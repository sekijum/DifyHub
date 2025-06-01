import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  ConflictException,
} from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import {
  User,
  DeveloperRequestStatus,
  Prisma,
  DeveloperRequest,
  RatingType,
  App,
  AppStatus,
  Bookmark,
  BookmarkFolder,
  Rating,
  Subscription,
  Plan,
} from "@prisma/client";
import {
  hashPassword,
  comparePassword,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
} from "@/core/utils";
import { payjp } from "@/core/payjp";
import {
  CreateBookmarkDto,
  CreateBookmarkFolderDto,
  CreateDeveloperRequestDto,
  FindBookmarksInFolderQueryDto,
  FindLikedAppListQueryDto,
  RateAppDto,
  UpdateAvatarDto,
  UpdateBookmarkFolderDto,
  UpdateNameDto,
  UpdatePasswordDto,
  UpdatePlanDto,
} from "./dto";
import { getPaginationParams, createPaginatedResponse } from "@/core/utils/pagination.util";
import { AppDto } from "@/features/user/apps/dto/app.dto";

@Injectable()
export class MeService {
  private readonly logger = new Logger(MeService.name);

  private calculateDeveloperStatus(
    requests: Pick<DeveloperRequest, "status">[],
  ): DeveloperRequestStatus | "UNSUBMITTED" {
    if (!requests || requests.length === 0) return "UNSUBMITTED";
    if (requests.some((req) => req.status === DeveloperRequestStatus.APPROVED)) return DeveloperRequestStatus.APPROVED;
    if (requests.some((req) => req.status === DeveloperRequestStatus.PENDING)) return DeveloperRequestStatus.PENDING;
    return DeveloperRequestStatus.REJECTED;
  }

  async findMyProfile(userId: number) {
    this.logger.log(`ユーザープロフィール取得開始: UserID=${userId}`);
    const userData = await this.findUserWithSubscriptionAndDeveloperRequestsOrThrow(userId);
    const developerStatus = this.calculateDeveloperStatus(userData.developerRequests);
    const { developerRequests, subscription, ...profileData } = userData;
    this.logger.log(`ユーザープロフィール取得成功: UserID=${userId}`);
    return {
      ...profileData,
      planName: subscription?.planName || null,
      developerStatus,
    };
  }

  async updateMyName(userId: number, updateNameDto: UpdateNameDto) {
    this.logger.log(`ユーザー名更新開始: UserID=${userId}, NewName=${updateNameDto.name}`);
    await this.findUserByIdOrThrow(userId);
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { name: updateNameDto.name },
        select: {
          id: true, email: true, name: true, avatarUrl: true, developerName: true,
          createdAt: true, updatedAt: true, role: true, status: true, bio: true,
          subscription: { select: { planName: true } },
        },
      });
      const { subscription, ...userData } = updatedUser;
      this.logger.log(`ユーザー名更新成功: UserID=${userId}`);
      return {
        ...userData,
        planName: subscription?.planName || null,
      };
    } catch (error) {
      this.logger.error(`ユーザー名更新エラー: UserID=${userId}, Error=${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`指定されたユーザー名は既に使用されています。`);
      }
      throw new InternalServerErrorException("ユーザー名の更新処理中に予期せぬエラーが発生しました。");
    }
  }

  async updateMyPassword(userId: number, updatePasswordDto: UpdatePasswordDto) {
    this.logger.log(`パスワード更新開始: UserID=${userId}`);
    const { newPassword } = updatePasswordDto;
    const user = await this.findUserByIdOrThrow(userId);
    
    try {
      const hashedNewPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });
      this.logger.log(`パスワード更新成功: UserID=${userId}`);
      return { message: "パスワードが正常に変更されました。" };
    } catch (error) {
      this.logger.error(`パスワード更新エラー: UserID=${userId}, Error=${error.message}`, error.stack);
      throw new InternalServerErrorException("パスワードの更新処理中に予期せぬエラーが発生しました。");
    }
  }

  async updateMyAvatarUrl(userId: number, updateAvatarDto: UpdateAvatarDto) {
    this.logger.log(`アバターURL更新開始: UserID=${userId}`);
    await this.findUserByIdOrThrow(userId);
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: updateAvatarDto.avatarUrl },
      });
      this.logger.log(`アバターURL更新成功: UserID=${userId}`);
      return { avatarUrl: updateAvatarDto.avatarUrl ?? "" };
    } catch (error) {
      this.logger.error(`アバターURL更新エラー: UserID=${userId}, Error=${error.message}`, error.stack);
      throw new InternalServerErrorException("アバターURLの更新処理中に予期せぬエラーが発生しました。");
    }
  }

  async updateMyPlan(userId: number, updatePlanDto: UpdatePlanDto) {
    this.logger.log(`プラン更新処理開始: UserID=${userId}, TargetPlan=${updatePlanDto.planName}`);
    const user = await this.findUserWithSubscriptionOrThrow(userId);
    const targetPlan = await this.findPlanByNameOrThrow(updatePlanDto.planName);
    if (user.subscription && user.subscription.planName === targetPlan.name) {
      this.logger.log(`プラン変更不要: UserID=${userId} は既にプラン ${targetPlan.name} に加入済み`);
      return {
        success: true,
        message: `あなたは既に ${targetPlan.name} プランに加入しています。`,
        planName: targetPlan.name,
        subscriptionId: user.subscription.id,
      };
    }
    try {
      if (!targetPlan.isDefault && !updatePlanDto.cardToken) {
        throw new BadRequestException("有料プランへの変更には有効なカード情報が必要です。");
      }
      if (!targetPlan.isDefault && updatePlanDto.cardToken) {
        await this.updatePayJpCustomerCard(user.payjpCustomerId, updatePlanDto.cardToken);
      }
      const result = await prisma.$transaction(async (tx) => {
        if (targetPlan.isDefault) {
          return this.switchToFreePlanAndUpdateDb(tx, user, targetPlan);
        } else {
          return this.switchToPaidPlanAndUpdateDb(tx, user, targetPlan as Plan & { payjpPlanId: string });
        }
      });
      this.logger.log(`プラン更新成功: UserID=${userId}, NewPlan=${result.planName}, SubscriptionID=${result.subscriptionId}`);
      return result;
    } catch (error) {
      this.logger.error(`プラン更新失敗: UserID=${userId}, TargetPlan=${updatePlanDto.planName}, Error=${error.message}`, error.stack);
      this.handlePlanUpdateError(error, updatePlanDto.planName);
    }
  }

  private async findUserWithSubscriptionAndDeveloperRequestsOrThrow(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, developerName: true, avatarUrl: true, role: true,
        createdAt: true, updatedAt: true, status: true, bio: true,
        developerRequests: { select: { status: true }, orderBy: { createdAt: "desc" } },
        subscription: { select: { planName: true } },
      },
    });
    if (!user) throw new NotFoundException(`指定されたユーザー (ID: ${userId}) が見つかりません。`);
    return user;
  }

  private async findUserByIdOrThrow(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`指定されたユーザー (ID: ${userId}) が見つかりません。`);
    return user;
  }
  
  private async findUserWithSubscriptionOrThrow(userId: number): Promise<User & { payjpCustomerId: string; subscription?: Subscription & { plan?: Plan } }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: { include: { plan: true } } },
    });
    if (!user) throw new NotFoundException(`指定されたユーザー (ID: ${userId}) が見つかりません。`);
    if (!user.payjpCustomerId) {
        this.logger.error(`PayJP顧客ID未設定エラー: UserID=${userId}`);
        throw new InternalServerErrorException('決済顧客情報が設定されていません。システム管理者に連絡してください。');
    }
    return user as User & { payjpCustomerId: string; subscription?: Subscription & { plan?: Plan } };
  }

  private async findPlanByNameOrThrow(planName: string): Promise<Plan & { payjpPlanId: string | null }> {
    const plan = await prisma.plan.findUnique({ where: { name: planName } });
    if (!plan) throw new NotFoundException(`指定されたプラン「${planName}」が見つかりません。`);
    if (!plan.isDefault && !plan.payjpPlanId) {
        this.logger.error(`PayJPプランID未設定エラー: PlanName=${planName}`);
        throw new InternalServerErrorException(`プラン「${planName}」の決済情報が正しく設定されていません。`);
    }
    return plan as Plan & { payjpPlanId: string | null };
  }

  private async updatePayJpCustomerCard(payjpCustomerId: string, cardToken: string) {
    this.logger.log(`Pay.JPカード情報更新/設定開始: CustomerID=${payjpCustomerId}`);
    try {
      // 1. トークンからカード情報を取得 (特にフィンガープリント)
      const tokenInfo = await payjp.tokens.retrieve(cardToken);
      if (!tokenInfo || !tokenInfo.card || !tokenInfo.card.fingerprint) {
        this.logger.error(`無効なカードトークン情報: TokenID=${cardToken}`);
        throw new BadRequestException("無効なカードトークンです。カード情報を確認してください。");
      }
      const newCardFingerprint = tokenInfo.card.fingerprint;
      const newCardBrand = tokenInfo.card.brand; // ログや将来的な利用のために取得
      const newCardLast4 = tokenInfo.card.last4; // ログや将来的な利用のために取得

      this.logger.log(`取得したカード情報: Brand=${newCardBrand}, Last4=${newCardLast4}, Fingerprint=${newCardFingerprint}`);

      // 2. 顧客に登録済みのカード一覧を取得
      const customer = await payjp.customers.retrieve(payjpCustomerId);
      const existingCards = await payjp.customers.cards.list(payjpCustomerId, { limit: 100 }); // 多数のカード登録も考慮

      const cardWithSameFingerprint = existingCards.data.find(
        (card) => card.fingerprint === newCardFingerprint,
      );

      if (cardWithSameFingerprint) {
        // 3a. 同じフィンガープリントのカードが既に存在する場合
        this.logger.log(`同一フィンガープリントの既存カードを発見: CardID=${cardWithSameFingerprint.id}`);
        if (customer.default_card === cardWithSameFingerprint.id) {
          // 既にデフォルトカードなので何もしない
          this.logger.log(`既存カードは既にデフォルトカードです。更新処理は不要。CardID=${cardWithSameFingerprint.id}`);
          return; // 更新不要
        } else {
          // デフォルトカードではないので、デフォルトに設定する
          await payjp.customers.update(payjpCustomerId, { default_card: cardWithSameFingerprint.id });
          this.logger.log(`既存カードをデフォルトに設定完了: CardID=${cardWithSameFingerprint.id}`);
          return;
        }
      } else {
        // 3b. 同じフィンガープリントのカードが存在しない場合、新しいカードとして登録しデフォルトに設定
        this.logger.log(`同一フィンガープリントのカードなし。新規カードとして登録します。`);
        const newPayJpCard = await payjp.customers.cards.create(payjpCustomerId, { card: cardToken });
        this.logger.log(`新規カード登録成功: CardID=${newPayJpCard.id}, Fingerprint=${newPayJpCard.fingerprint}`);
        
        await payjp.customers.update(payjpCustomerId, { default_card: newPayJpCard.id });
        this.logger.log(`新規登録したカードをデフォルトに設定完了: CardID=${newPayJpCard.id}`);
        return;
      }
    } catch (error) {
      this.logger.error(`Pay.JPカード情報更新/設定エラー: CustomerID=${payjpCustomerId}, Error=${error.message}`, error.stack);
      if (error.type === 'PayjpCardError') { 
        throw new BadRequestException(`カード情報が無効、または処理できませんでした: ${error.message} (コード: ${error.code})`);
      }
      if (error.status === 400 || error.status === 404) { 
         throw new BadRequestException(`カード情報の処理に失敗しました: ${error.message}`);
      }
      throw new InternalServerErrorException(`カード情報の処理中に予期せぬエラーが発生しました: ${error.message}`);
    }
  }

  private async switchToFreePlanAndUpdateDb(
    tx: Prisma.TransactionClient,
    user: User & { subscription?: Subscription & { plan?: Plan } },
    targetPlan: Plan,
  ) {
    this.logger.log(`無料プランへの切り替え処理(DB): UserID=${user.id}, TargetPlan=${targetPlan.name}`);
    if (user.subscription && user.subscription.payjpSubscriptionId) {
      try {
        await payjp.subscriptions.delete(user.subscription.payjpSubscriptionId);
        this.logger.log(`Pay.JPサブスクリプションキャンセル成功: PayjpSubID=${user.subscription.payjpSubscriptionId}`);
      } catch (error) {
        this.logger.warn(`Pay.JPサブスクリプションのキャンセルに失敗しました (無視して継続): PayjpSubID=${user.subscription.payjpSubscriptionId}, Error=${error.message}`);
      }
    }
    if (user.subscription) {
      const updatedSubscription = await tx.subscription.update({
        where: { id: user.subscription.id },
        data: { planName: targetPlan.name, payjpSubscriptionId: null },
      });
      return {
        success: true,
        message: `${targetPlan.name}プランへの変更が完了しました。`,
        planName: targetPlan.name,
        subscriptionId: updatedSubscription.id,
      };
    } else {
      const newSubscription = await tx.subscription.create({
        data: { userId: user.id, planName: targetPlan.name, payjpSubscriptionId: null },
      });
      return {
        success: true,
        message: `${targetPlan.name}プランへの登録が完了しました。`,
        planName: targetPlan.name,
        subscriptionId: newSubscription.id,
      };
    }
  }

  private async switchToPaidPlanAndUpdateDb(
    tx: Prisma.TransactionClient,
    user: User & { payjpCustomerId: string; subscription?: Subscription & { plan?: Plan } },
    targetPlan: Plan & { payjpPlanId: string },
  ) {
    this.logger.log(`有料プランへの切り替え処理(DB): UserID=${user.id}, TargetPlan=${targetPlan.name}`);
    let newPayjpSubscriptionId: string;
    try {
      if (user.subscription && user.subscription.payjpSubscriptionId) {
        const updatedPayJpSub = await payjp.subscriptions.update(
          user.subscription.payjpSubscriptionId,
          { plan: targetPlan.payjpPlanId, prorate: true },
        );
        newPayjpSubscriptionId = updatedPayJpSub.id;
        this.logger.log(`Pay.JPサブスクリプション更新成功: PayjpSubID=${newPayjpSubscriptionId}`);
      } else {
        const createdPayJpSub = await payjp.subscriptions.create({
          customer: user.payjpCustomerId,
          plan: targetPlan.payjpPlanId,
          prorate: true,
        });
        newPayjpSubscriptionId = createdPayJpSub.id;
        this.logger.log(`Pay.JPサブスクリプション新規作成成功: PayjpSubID=${newPayjpSubscriptionId}`);
      }
    } catch (error) {
      if (error.response?.text?.includes('already_subscribed') || error.code === 'already_subscribed') {
        this.logger.warn(`Pay.JPで既に購読済みのプランです: UserID=${user.id}, PayJPPlanID=${targetPlan.payjpPlanId}`);
        const subscriptions = await payjp.subscriptions.list({ customer: user.payjpCustomerId, plan: targetPlan.payjpPlanId, status: 'active', limit: 1 });
        if (subscriptions.data.length > 0) {
          newPayjpSubscriptionId = subscriptions.data[0].id;
          this.logger.log(`既存の有効なPay.JPサブスクリプションを使用: PayjpSubID=${newPayjpSubscriptionId}`);
        } else {
          this.logger.error(`Pay.JPサブスクリプションエラー(already_subscribedだが有効なものなし): UserID=${user.id}, PayJPPlanID=${targetPlan.payjpPlanId}, Error: ${error.message}`);
          throw new ConflictException(`現在このプラン(${targetPlan.name})の有効な購読情報が見つかりませんでした。サポートにお問い合わせください。`);
        }
      } else {
        this.logger.error(`Pay.JPサブスクリプション操作エラー: UserID=${user.id}, PayJPPlanID=${targetPlan.payjpPlanId}, Error: ${error.message}`, error.stack);
        if (error.type === 'PayjpCardError') {
          throw new BadRequestException(`カードエラーによりサブスクリプションを作成/更新できませんでした: ${error.message} (コード: ${error.code})`);
        }
        throw new InternalServerErrorException(`サブスクリプション処理中にエラーが発生しました: ${error.message}`);
      }
    }
    if (user.subscription) {
      const updatedSubscription = await tx.subscription.update({
        where: { id: user.subscription.id },
        data: { planName: targetPlan.name, payjpSubscriptionId: newPayjpSubscriptionId },
      });
      return {
        success: true,
        message: `${targetPlan.name}プランへの変更が完了しました。`,
        planName: targetPlan.name,
        subscriptionId: updatedSubscription.id,
      };
    } else {
      const newSubscription = await tx.subscription.create({
        data: { userId: user.id, planName: targetPlan.name, payjpSubscriptionId: newPayjpSubscriptionId },
      });
      return {
        success: true,
        message: `${targetPlan.name}プランへの登録が完了しました。`,
        planName: targetPlan.name,
        subscriptionId: newSubscription.id,
      };
    }
  }

  private handlePlanUpdateError(error: any, planName?: string) {
    if (
      error instanceof NotFoundException ||
      error instanceof BadRequestException ||
      error instanceof ConflictException ||
      error instanceof InternalServerErrorException
    ) {
      throw error;
    }
    if (error.type && error.type.startsWith('Payjp')) {
      this.logger.warn(`Pay.JP APIエラー発生: Type=${error.type}, Code=${error.code}, Message=${error.message}`);
      if (error.code === 'already_subscribed') {
        throw new ConflictException(`このプラン(${planName || ''})には既に加入済みか、過去の購読情報と競合しています。`);
      }
      if (error.param === 'card' || error.type === 'PayjpCardError') {
         throw new BadRequestException(`決済カードエラー: ${error.message} (詳細コード: ${error.code})`);
      }
       throw new BadRequestException(`決済処理エラー: ${error.message}。サポートにお問い合わせください。`);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.warn(`Prismaエラー発生: Code=${error.code}, Meta=${JSON.stringify(error.meta)}`);
      if (error.code === 'P2025') {
        throw new NotFoundException('プラン更新に必要な情報が見つかりませんでした。');
      }
      if (error.code === 'P2002') {
         throw new ConflictException('プラン情報が他と重複しています。時間を置いて再度お試しください。');
      }
    }
    this.logger.error(`予期せぬプラン更新エラー: ${error.message}`, error.stack);
    throw new InternalServerErrorException(
      "プランの更新処理中に予期せぬエラーが発生しました。しばらくしてから再度お試しいただくか、サポートまでお問い合わせください。",
    );
  }

  async findLikedAppList(userId: number, query: FindLikedAppListQueryDto) {
    this.logger.log(`いいねしたアプリ一覧取得開始: UserID=${userId}, Query=${JSON.stringify(query)}`);
    const { sortBy, sortOrder, page, limit } = query;
    const pagination = getPaginationParams({page, limit});
    const whereCondition: Prisma.AppWhereInput = {
      ratings: { some: { userId: userId, type: RatingType.LIKE } },
      status: AppStatus.PUBLISHED,
    };

    // 評価情報を含むクエリで取得
    const [apps, total] = await prisma.$transaction([
      prisma.app.findMany({
        where: whereCondition,
        orderBy: { [sortBy]: sortOrder },
        skip: pagination.skip,
        take: pagination.take,
        include: { 
          creator: { select: { id: true, name: true, avatarUrl: true } },
          category: { select: { id: true, name: true } },
          ratings: { select: { type: true } }, // 評価情報を含める
        },
      }),
      prisma.app.count({ where: whereCondition }),
    ]);

    // AppDtoに変換（評価情報を計算）
    const appDtos = apps.map(app => {
      const likeCount = app.ratings.filter(r => r.type === RatingType.LIKE).length;
      const dislikeCount = app.ratings.filter(r => r.type === RatingType.DISLIKE).length;

      return new AppDto({
        id: app.id,
        name: app.name,
        description: app.description,
        thumbnailUrl: app.thumbnailUrl,
        creatorId: app.creatorId,
        categoryId: app.categoryId,
        isSubscriptionLimited: app.isSubscriptionLimited,
        usageCount: app.usageCount,
        createdAt: app.createdAt,
        creator: app.creator,
        category: app.category,
        likeCount,
        dislikeCount,
      });
    });

    this.logger.log(`いいねしたアプリ一覧取得成功: UserID=${userId}, Total=${total}`);
    return createPaginatedResponse(appDtos, total, pagination.page, pagination.limit);
  }

  async createBookmarkFolder(userId: number, dto: CreateBookmarkFolderDto) {
    const { name } = dto;
    this.logger.log(`ブックマークフォルダ作成開始: UserID=${userId}, Name=${name}`);
    const existingFolder = await prisma.bookmarkFolder.findFirst({ where: { userId, name } });
    if (existingFolder) {
      throw new ConflictException(`ブックマークフォルダ名 '${name}' は既に使用されています。`);
    }
    try {
      const folder = await prisma.bookmarkFolder.create({ data: { userId, name } });
      this.logger.log(`ブックマークフォルダ作成成功: FolderID=${folder.id}`);
      return folder;
    } catch (error) {
      this.logger.error(`ブックマークフォルダ作成エラー: UserID=${userId}, Name=${name}, Error=${error.message}`, error.stack);
      throw new InternalServerErrorException("ブックマークフォルダの作成処理中に予期せぬエラーが発生しました。");
    }
  }

  async updateBookmarkFolder(
    userId: number,
    folderId: number,
    dto: UpdateBookmarkFolderDto,
  ) {
    const { name } = dto;
    this.logger.log(`ブックマークフォルダ更新開始: UserID=${userId}, FolderID=${folderId}, NewName=${name}`);
    if (name.trim() === "") throw new BadRequestException("フォルダ名を空にすることはできません。");
    const folder = await this.findBookmarkFolderOrThrow(userId, folderId);
    if (folder.isDefault) throw new BadRequestException("デフォルトのブックマークフォルダ名は変更できません。");
    if (folder.name === name) return folder;
    const existingFolderWithNewName = await prisma.bookmarkFolder.findFirst({
      where: { userId, name, id: { not: folderId } },
    });
    if (existingFolderWithNewName) {
      throw new ConflictException(`ブックマークフォルダ名 '${name}' は既に使用されています。`);
    }
    try {
      const updatedFolder = await prisma.bookmarkFolder.update({
        where: { id: folderId, userId }, 
        data: { name },
      });
      this.logger.log(`ブックマークフォルダ更新成功: FolderID=${folderId}`);
      return updatedFolder;
    } catch (error) {
      this.logger.error(`ブックマークフォルダ更新エラー: UserID=${userId}, FolderID=${folderId}, Error=${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
         throw new NotFoundException(`ID ${folderId} のブックマークフォルダが見つからないか、操作権限がありません。`);
      }
      throw new InternalServerErrorException("ブックマークフォルダ名の更新処理中に予期せぬエラーが発生しました。");
    }
  }

  async findBookmarkFolderList(userId: number) {
    this.logger.log(`ブックマークフォルダ一覧取得開始: UserID=${userId}`);
    const folders = await prisma.bookmarkFolder.findMany({
      where: { userId },
      orderBy: [
        { isDefault: "desc" }, // デフォルトフォルダーを最初に表示
        { bookmarks: { _count: "desc" } }, // ブックマーク数が多い順
        { createdAt: "asc" } // 同じブックマーク数の場合は作成日順
      ], 
      include: { 
        _count: { select: { bookmarks: true } },
        bookmarks: {
          include: {
            app: {
              include: {
                creator: { select: { id: true, name: true, avatarUrl: true } },
                category: { select: { id: true, name: true } }
              }
            }
          }
        }
      },
    });
    this.logger.log(`ブックマークフォルダ一覧取得成功: UserID=${userId}, Count=${folders.length}`);
    return folders;
  }

  async findBookmarksInFolder(
    userId: number,
    folderId: number,
    query: FindBookmarksInFolderQueryDto,
  ) {
    this.logger.log(`フォルダ内ブックマーク一覧取得開始: UserID=${userId}, FolderID=${folderId}`);
    await this.findBookmarkFolderOrThrow(userId, folderId);
    const pagination = getPaginationParams(query);
    const [bookmarks, total] = await prisma.$transaction([
      prisma.bookmark.findMany({
        where: { userId, bookmarkFolderId: folderId },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: { app: { include: { creator: { select: { id: true, name: true, avatarUrl: true } } } } },
      }),
      prisma.bookmark.count({ where: { userId, bookmarkFolderId: folderId } }),
    ]);
    this.logger.log(`フォルダ内ブックマーク一覧取得成功: UserID=${userId}, FolderID=${folderId}, Total=${total}`);
    return createPaginatedResponse(bookmarks, total, pagination.page, pagination.limit);
  }

  async toggleBookmark(userId: number, dto: CreateBookmarkDto): Promise<Bookmark | null> {
    const { appId, folderId, folderName } = dto;
    this.logger.log(`ブックマークトグル開始: UserID=${userId}, AppID=${appId}, FolderID=${folderId}, FolderName=${folderName}`);

    if ((!folderId && !folderName) || (folderId && folderName)) {
      throw new BadRequestException("folderIdまたはfolderNameのどちらか一方のみを指定してください。");
    }
    if (folderName !== undefined && folderName !== null && folderName.trim() === "") {
      throw new BadRequestException("folderNameを空にすることはできません。");
    }
    await prisma.app.findUniqueOrThrow({ where: { id: appId }, select: { id: true } });

    if (folderId) {
      const folder = await this.findBookmarkFolderOrThrow(userId, folderId);
      return this.toggleExistingBookmark(userId, appId, folder.id);
    } else if (folderName) {
      return this.createFolderAndBookmark(userId, appId, folderName);
    } else {
      this.logger.error('ブックマーク処理のフォルダ指定ロジックエラー');
      throw new InternalServerErrorException('ブックマーク処理で予期せぬエラーが発生しました。');
    }
  }

  async deleteBookmarkFolder(userId: number, folderId: number) {
    this.logger.log(`ブックマークフォルダ削除開始: UserID=${userId}, FolderID=${folderId}`);
    const folder = await this.findBookmarkFolderOrThrow(userId, folderId);
    if (folder.isDefault) {
      throw new BadRequestException("デフォルトのブックマークフォルダは削除できません。");
    }
    try {
      await prisma.bookmarkFolder.delete({ where: { id: folderId, userId } });
      this.logger.log(`ブックマークフォルダ削除成功: FolderID=${folderId}`);
      return { message: `ブックマークフォルダ '${folder.name}' (ID: ${folderId}) が正常に削除されました。` };
    } catch (error) {
      this.logger.error(`ブックマークフォルダ削除エラー: UserID=${userId}, FolderID=${folderId}, Error=${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`ID ${folderId} のブックマークフォルダが見つからないか、操作権限がありません。`);
      }
      throw new InternalServerErrorException("ブックマークフォルダの削除処理中に予期せぬエラーが発生しました。");
    }
  }

  async requestDeveloperRole(userId: number, dto: CreateDeveloperRequestDto) {
    const { portfolioUrl, reason } = dto;
    this.logger.log(`開発者ロール申請開始: UserID=${userId}`);
    const existingRequests = await prisma.developerRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (existingRequests.some((req) => req.status === DeveloperRequestStatus.APPROVED)) {
      throw new ConflictException("開発者ロールは既に承認されています。");
    }
    if (existingRequests.length > 0 && existingRequests[0].status === DeveloperRequestStatus.PENDING) {
      throw new ConflictException("開発者申請は既に申請中です。承認または却下をお待ちください。");
    }
    try {
      const newRequest = await prisma.developerRequest.create({
        data: { userId, portfolioUrl, reason },
      });
      this.logger.log(`開発者ロール申請成功: RequestID=${newRequest.id}`);
      return newRequest;
    } catch (error) {
      this.logger.error(`開発者ロール申請エラー: UserID=${userId}, Error=${error.message}`, error.stack);
      throw new InternalServerErrorException("開発者申請リクエストの作成中に予期せぬエラーが発生しました。");
    }
  }

  async toggleAppRating(userId: number, appId: number, dto: RateAppDto): Promise<Rating | null> {
    const { type } = dto;
    this.logger.log(`アプリ評価トグル開始: UserID=${userId}, AppID=${appId}, Type=${type}`);
    await prisma.app.findUniqueOrThrow({ where: { id: appId }, select: { id: true } });
    const existingRating = await prisma.rating.findUnique({
      where: { userId_appId: { userId, appId } },
    });
    if (existingRating) {
      if (existingRating.type === type) {
        try {
          await prisma.rating.delete({ where: { userId_appId: { userId, appId } } });
          this.logger.log(`アプリ評価削除成功: UserID=${userId}, AppID=${appId}`);
          return null;
        } catch (error) {
          this.logger.error(`アプリ評価削除エラー: UserID=${userId}, AppID=${appId}, Error=${error.message}`, error.stack);
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null;
          throw new InternalServerErrorException("評価の削除処理中に予期せぬエラーが発生しました。");
        }
      } else {
        try {
          const updatedRating = await prisma.rating.update({
            where: { userId_appId: { userId, appId } },
            data: { type },
          });
          this.logger.log(`アプリ評価更新成功: UserID=${userId}, AppID=${appId}, NewType=${type}`);
          return updatedRating;
        } catch (error) {
          this.logger.error(`アプリ評価更新エラー: UserID=${userId}, AppID=${appId}, Error=${error.message}`, error.stack);
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
             throw new NotFoundException("更新対象の評価が見つかりませんでした。");
          }
          throw new InternalServerErrorException("評価の更新処理中に予期せぬエラーが発生しました。");
        }
      }
    } else {
      try {
        const newRating = await prisma.rating.create({ data: { userId, appId, type } });
        this.logger.log(`アプリ評価作成成功: UserID=${userId}, AppID=${appId}, Type=${type}`);
        return newRating;
      } catch (error) {
        this.logger.error(`アプリ評価作成エラー: UserID=${userId}, AppID=${appId}, Type=${type}, Error=${error.message}`, error.stack);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
             throw new NotFoundException(`指定されたアプリ(ID:${appId})が見つかりません。`);
        }
        throw new InternalServerErrorException("評価の作成処理中に予期せぬエラーが発生しました。");
      }
    }
  }

  async findBookmarkFoldersWithAppStatus(userId: number, appId: number) {
    this.logger.log(`アプリ別ブックマークフォルダ状態取得開始: UserID=${userId}, AppID=${appId}`);
    await prisma.app.findUniqueOrThrow({ where: { id: appId }, select: {id:true}}); 
    const folders = await prisma.bookmarkFolder.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    if (folders.length === 0) return [];
    const bookmarkedFolderIds = await prisma.bookmark
      .findMany({
        where: { userId, appId, bookmarkFolderId: { in: folders.map((f) => f.id) } },
        select: { bookmarkFolderId: true },
      })
      .then((bookmarks) => new Set(bookmarks.map((b) => b.bookmarkFolderId)));
    const result = folders.map((folder) => ({
      ...folder,
      isAppBookmarked: bookmarkedFolderIds.has(folder.id),
    }));
    this.logger.log(`アプリ別ブックマークフォルダ状態取得成功: UserID=${userId}, AppID=${appId}, FolderCount=${result.length}`);
    return result;
  }

  async findBillingHistory(userId: number) {
    this.logger.log(`請求履歴取得開始: UserID=${userId}`);
    
    // ユーザーの存在確認とPayJP顧客IDの取得
    const user = await this.findUserWithSubscriptionOrThrow(userId);
    
    try {
      // PayJPのcharges APIを使って請求履歴を取得
      const charges = await payjp.charges.list({
        customer: user.payjpCustomerId,
      });

      // 請求履歴をフォーマット
      const billingItems = charges.data.map(charge => {
        const amountRefunded = charge.amount_refunded || 0;
        const actualChargedAmount = charge.amount - amountRefunded;
        
        return {
          id: charge.id,
          amount: actualChargedAmount,
          amountRefunded: amountRefunded,
          originalAmount: charge.amount,
          currency: charge.currency,
          createdAt: new Date(charge.created * 1000).toISOString(),
          paid: charge.paid,
          refunded: charge.refunded,
          captured: charge.captured,
          status: this.getBillingStatus(charge),
          failureCode: charge.failure_code || null,
          failureMessage: charge.failure_message || null,
          cardLast4: charge.card?.last4 || null,
          cardBrand: charge.card?.brand || null,
          refundReason: charge.refund_reason || null,
        };
      });

      this.logger.log(`請求履歴取得成功: UserID=${userId}, Count=${billingItems.length}`);
      
      return billingItems;
    } catch (error) {
      this.logger.error(`請求履歴取得エラー: UserID=${userId}, Error=${error.message}`, error.stack);
      
      if (error.type === 'PayjpInvalidRequestError') {
        throw new BadRequestException('請求履歴の取得に失敗しました。');
      }
      
      throw new InternalServerErrorException('請求履歴の取得処理中に予期せぬエラーが発生しました。');
    }
  }

  private async findBookmarkFolderOrThrow(userId: number, folderId: number): Promise<BookmarkFolder> {
    const folder = await prisma.bookmarkFolder.findUnique({ where: { id: folderId } });
    if (!folder) throw new NotFoundException(`ID ${folderId} のブックマークフォルダが見つかりません。`);
    if (folder.userId !== userId) throw new UnauthorizedException(`ID ${folderId} のブックマークフォルダへのアクセス権がありません。`);
    return folder;
  }

  private async toggleExistingBookmark(
    userId: number,
    appId: number,
    folderId: number,
  ): Promise<Bookmark | null> { 
    const bookmarkWhereInput = { userId, appId, bookmarkFolderId: folderId };
    const existingBookmark = await prisma.bookmark.findUnique({
      where: { userId_appId_bookmarkFolderId: bookmarkWhereInput },
    });
    if (existingBookmark) {
      try {
        await prisma.bookmark.delete({ where: { userId_appId_bookmarkFolderId: bookmarkWhereInput } });
        this.logger.log(`既存ブックマーク削除成功: UserID=${userId}, AppID=${appId}, FolderID=${folderId}`);
        return null;
      } catch (error) {
        this.logger.error(`既存ブックマーク削除エラー: UserID=${userId}, AppID=${appId}, FolderID=${folderId}, Error=${error.message}`, error.stack);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null;
        throw new InternalServerErrorException("ブックマークの削除処理中に予期せぬエラーが発生しました。");
      }
    } else {
      try {
        const newBookmark = await prisma.bookmark.create({
          data: { userId, appId, bookmarkFolderId: folderId },
          include: { app: true }, 
        });
        this.logger.log(`新規ブックマーク作成成功: UserID=${userId}, AppID=${appId}, FolderID=${folderId}`);
        return newBookmark;
      } catch (error) {
        this.logger.error(`新規ブックマーク作成エラー: UserID=${userId}, AppID=${appId}, FolderID=${folderId}, Error=${error.message}`, error.stack);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
          throw new NotFoundException(`フォルダ(ID: ${folderId})またはアプリ(ID: ${appId})が見つかりません。`);
        }
        throw new InternalServerErrorException("ブックマークの作成処理中に予期せぬエラーが発生しました。");
      }
    }
  }

  private async createFolderAndBookmark(
    userId: number,
    appId: number,
    folderName: string,
  ): Promise<Bookmark> { 
    this.logger.log(`フォルダ作成とブックマーク処理開始: UserID=${userId}, AppID=${appId}, FolderName=${folderName}`);
    try {
      return await prisma.$transaction(async (tx) => {
        let folder = await tx.bookmarkFolder.findFirst({ where: { userId, name: folderName }});
        if (!folder) {
           folder = await tx.bookmarkFolder.create({ data: { userId, name: folderName } });
           this.logger.log(`新規フォルダ作成成功: FolderID=${folder.id}, Name=${folderName}`);
        } else {
           this.logger.log(`既存フォルダ使用: FolderID=${folder.id}, Name=${folderName}`);
        }
        const existingBookmarkInTx = await tx.bookmark.findUnique({
          where: { userId_appId_bookmarkFolderId: { userId, appId, bookmarkFolderId: folder.id } }
        });
        if (existingBookmarkInTx) {
          this.logger.warn(`ブックマーク重複試行(トランザクション内): UserID=${userId}, AppID=${appId}, FolderID=${folder.id}`);
          throw new ConflictException(`アプリ(ID: ${appId})は既にフォルダ「${folderName}」にブックマークされています。`);
        }
        const newBookmark = await tx.bookmark.create({
          data: { userId, appId, bookmarkFolderId: folder.id },
          include: { app: true },
        });
        this.logger.log(`フォルダ内新規ブックマーク作成成功: BookmarkID=${newBookmark.id}`);
        return newBookmark;
      });
    } catch (error) {
      this.logger.error(`フォルダ作成とブックマーク処理エラー: UserID=${userId}, AppID=${appId}, FolderName=${folderName}, Error=${error.message}`, error.stack);
      if (error instanceof ConflictException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") { 
          throw new ConflictException(`ブックマークフォルダ名 '${folderName}' は既に使用されています。`);
        }
        if (error.code === "P2003" && error.meta?.field_name?.toString().includes('Bookmark_appId_fkey')) { 
            throw new NotFoundException(`指定されたアプリ(ID: ${appId})が見つかりません。`);
        }
      }
      throw new InternalServerErrorException("ブックマーク処理中に予期せぬエラーが発生しました。");
    }
  }

  private getBillingStatus(charge: any): string {
    if (charge.refunded) {
      if (charge.amount_refunded && charge.amount_refunded < charge.amount) {
        return 'partial_refunded';
      }
      return 'refunded';
    } else if (charge.paid) {
      return 'paid';
    } else if (charge.failure_message) {
      return 'failed';
    } else {
      return 'pending';
    }
  }
}
