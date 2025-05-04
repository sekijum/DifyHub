import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { App, AppStatus, Prisma } from '@prisma/client';
import { GetAppsQueryDto } from './dto/get-apps-query.dto';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';

// アプリデータと関連情報を結合した型
export interface AppWithDetails extends App {
  category?: {
    id: number;
    name: string;
  } | null;
  tags?: {
    id: number;
    name: string;
  }[];
  subImages?: {
    id: number;
    imageUrl: string;
    order: number;
  }[];
  _count?: {
    ratings: number;
    bookmarks: number;
  };
  likeRatio?: number; // 高評価率
  bookmarkCount?: number; // ブックマーク数
  likesCount?: number; // 高評価数
  dislikesCount?: number; // 低評価数
}

// ページネーション結果型
export interface PaginatedAppsResult {
  data: AppWithDetails[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class DeveloperAppsService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  /**
   * 開発者のアプリ一覧を取得
   */
  async findApps(
    query: GetAppsQueryDto,
    developerId: number
  ): Promise<PaginatedAppsResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status;
    const search = query.search;
    const categoryId = query.categoryId;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    
    // where条件の構築
    const where: Prisma.AppWhereInput = {
      creatorId: developerId, // 自分のアプリのみ取得
    };

    // ステータスによるフィルター
    if (status) {
      where.status = status;
    }

    // カテゴリーによるフィルター
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 検索条件（アプリ名、説明）
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // ソート条件の構築
    const orderBy: Prisma.AppOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    try {
      // データの取得と総件数のカウント
      const [apps, total] = await this.prisma.$transaction([
        this.prisma.app.findMany({
          where,
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            ratings: {
              select: {
                type: true,
              },
            },
            _count: {
              select: {
                ratings: true,
                bookmarks: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
        }),
        this.prisma.app.count({ where }),
      ]);

      // 高評価率と必要なデータを追加
      const processedApps = apps.map(app => {
        const likeCount = app.ratings?.filter(r => r.type === 'LIKE').length || 0;
        const totalRatings = app._count?.ratings || 0;
        const likeRatio = totalRatings > 0 ? Math.round((likeCount / totalRatings) * 100) : 0;
        
        return {
          id: app.id,
          name: app.name,
          status: app.status,
          usageCount: app.usageCount,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          category: app.category,
          likeRatio,
          bookmarkCount: app._count?.bookmarks || 0,
        } as AppWithDetails;
      });

      return {
        data: processedApps,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error in findApps:', error);
      return {
        data: [],
        total: 0,
        page,
        limit,
      };
    }
  }

  /**
   * アプリ詳細を取得
   */
  async findAppById(
    id: number,
    developerId: number
  ): Promise<AppWithDetails> {
    // 基本的なアプリ情報の取得
    const appPromise = this.prisma.app.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
          }
        },
        subImages: {
          orderBy: {
            order: 'asc',
          },
        },
        ratings: true, // すべての評価情報を取得
        _count: {
          select: {
            ratings: true,
            bookmarks: true,
          },
        },
      },
    });

    // 高評価と低評価の数をカウント - 別々のクエリで取得
    const likesCountPromise = this.prisma.rating.count({
      where: { 
        appId: id,
        type: 'LIKE'
      },
    });

    const dislikesCountPromise = this.prisma.rating.count({
      where: { 
        appId: id,
        type: 'DISLIKE'
      },
    });

    // 並行してデータを取得
    const [app, likesCount, dislikesCount] = await Promise.all([
      appPromise,
      likesCountPromise,
      dislikesCountPromise,
    ]);

    if (!app) {
      throw new NotFoundException(`アプリ ID ${id} が見つかりません`);
    }

    // 自分のアプリかどうか確認
    if (app.creatorId !== developerId) {
      throw new ForbiddenException('このアプリにアクセスする権限がありません');
    }

    // 高評価率を計算
    const totalRatings = likesCount + dislikesCount;
    const likeRatio = totalRatings > 0 ? Math.round((likesCount / totalRatings) * 100) : 0;
    
    const appWithDetails = {
      ...app,
      likesCount,
      dislikesCount,
      likeRatio,
      bookmarkCount: app._count?.bookmarks || 0,
    } as AppWithDetails;

    return appWithDetails;
  }

  /**
   * アプリを新規作成
   */
  async createApp(
    createDto: CreateAppDto,
    developerId: number
  ): Promise<AppWithDetails> {
    const {
      name,
      description,
      thumbnailUrl,
      appUrl,
      categoryId,
      isSubscriptionLimited,
      tagIds,
      subImages,
      status,
    } = createDto;

    try {
      // タグの接続データ作成
      const tagsConnect = tagIds?.map(id => ({ id })) || [];

      // アプリ作成とサブ画像・タグの登録を一つのトランザクションで実行
      const newApp = await this.prisma.$transaction(async (prisma) => {
        // アプリを作成
        const app = await prisma.app.create({
          data: {
            name,
            description,
            thumbnailUrl,
            appUrl,
            categoryId,
            isSubscriptionLimited: isSubscriptionLimited ?? false,
            status, // フロントから受け取ったステータスを使用
            creatorId: developerId, // 作成者は現在のユーザー
            // タグとの関連付け
            tags: tagIds && tagIds.length > 0 ? {
              connect: tagsConnect
            } : undefined,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            tags: {
              select: {
                id: true,
                name: true,
              }
            },
          },
        });

        // サブ画像がある場合は登録
        if (subImages && subImages.length > 0) {
          await Promise.all(
            subImages.map(({ imageUrl, order }) =>
              prisma.appSubImage.create({
                data: {
                  appId: app.id,
                  imageUrl,
                  order,
                },
              })
            )
          );
        }

        // 作成したアプリを返す（サブ画像も含めて取得）
        return prisma.app.findUnique({
          where: { id: app.id },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            tags: {
              select: {
                id: true,
                name: true,
              }
            },
            subImages: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        });
      });

      return newApp as AppWithDetails;
    } catch (error) {
      console.error('Error in createApp:', error);
      throw new BadRequestException('アプリの作成に失敗しました');
    }
  }

  /**
   * アプリを更新
   */
  async updateApp(
    id: number,
    updateDto: UpdateAppDto,
    developerId: number,
    files?: { thumbnail?: Express.Multer.File[], newSubImages?: Express.Multer.File[] }
  ): Promise<AppWithDetails> {
    // アプリの存在確認と権限チェック
    const existingApp = await this.prisma.app.findUnique({
      where: { id },
    });

    if (!existingApp) {
      throw new NotFoundException(`アプリ ID ${id} が見つかりません`);
    }

    if (existingApp.creatorId !== developerId) {
      throw new ForbiddenException('このアプリを編集する権限がありません');
    }

    // SUSPENDED状態のアプリのみ変更不可
    if (existingApp.status === AppStatus.SUSPENDED) {
      throw new ForbiddenException(`${existingApp.status}状態のアプリは編集できません`);
    }

    // DTOが未定義の場合は空オブジェクトを使用
    const safeUpdateDto = updateDto || {};
    
    // デバッグログ
    console.log('Updating app with DTO:', safeUpdateDto);
    console.log('Uploaded files:', files);
    
    try {
      // アプリ更新とサブ画像・タグの更新を一つのトランザクションで実行
      const updatedApp = await this.prisma.$transaction(async (prisma) => {
        // 更新データを構築
        const updateData: Prisma.AppUpdateInput = {};
        
        // 各フィールドを明示的に処理
        if (safeUpdateDto.name !== undefined) {
          updateData.name = safeUpdateDto.name;
        }
        
        if (safeUpdateDto.description !== undefined) {
          updateData.description = safeUpdateDto.description;
        }
        
        // サムネイル画像処理
        if (files?.thumbnail && files.thumbnail.length > 0) {
          // TODO: ファイル保存処理（実際にはS3などのストレージサービスに保存）
          // この例では、仮のURLを設定しています
          const thumbnailFile = files.thumbnail[0];
          updateData.thumbnailUrl = `https://example.com/uploads/${thumbnailFile.originalname}`;
        } else if (safeUpdateDto.removeThumbnail) {
          updateData.thumbnailUrl = null;
        }
        
        if (safeUpdateDto.appUrl !== undefined) {
          updateData.appUrl = safeUpdateDto.appUrl;
        }
        
        if (safeUpdateDto.isSubscriptionOnly !== undefined) {
          // DTOのフィールド名の違いを修正
          updateData.isSubscriptionLimited = safeUpdateDto.isSubscriptionOnly;
        }
        
        if (safeUpdateDto.status !== undefined) {
          updateData.status = safeUpdateDto.status;
          // デバッグログ
          console.log('Updating status to:', safeUpdateDto.status);
        }
        
        // タグ処理
        if (safeUpdateDto.tags !== undefined && Array.isArray(safeUpdateDto.tags)) {
          // タグ名の配列からタグを検索または作成
          const tags = await Promise.all(
            safeUpdateDto.tags.map(async (tagName) => {
              if (!tagName) return null;
              
              // 既存のタグを検索
              let tag = await prisma.tag.findFirst({
                where: { name: tagName },
              });
              
              // タグが存在しない場合は新規作成
              if (!tag) {
                tag = await prisma.tag.create({
                  data: { name: tagName },
                });
              }
              
              return tag;
            })
          );
          
          // nullを除外
          const validTags = tags.filter(tag => tag !== null);
          
          // まず既存のタグ接続をすべて切断
          await prisma.app.update({
            where: { id },
            data: {
              tags: {
                set: [], // すべてのタグ接続をリセット
              },
            },
          });
          
          // そして新しいタグを接続
          if (validTags.length > 0) {
            await prisma.app.update({
              where: { id },
              data: {
                tags: {
                  connect: validTags.map(tag => ({ id: tag.id })),
                },
              },
            });
          }
        } else if (safeUpdateDto.tagIds !== undefined) {
          // 従来のtagIdsフィールドでの更新処理
          updateData.tags = {
            set: [], // 既存のタグをクリア
            connect: safeUpdateDto.tagIds.map(tagId => ({ id: tagId })),
          };
        }
        
        if (safeUpdateDto.categoryId !== undefined) {
          updateData.category = {
            connect: { id: safeUpdateDto.categoryId }
          };
        }
        
        // デバッグログ
        console.log('Update data:', updateData);
        
        // アプリを更新
        const app = await prisma.app.update({
          where: { id },
          data: updateData,
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            tags: {
              select: {
                id: true,
                name: true,
              }
            },
          },
        });

        // サブ画像処理
        // TODO: ファイルアップロード機能の具体的な実装
        if (files?.newSubImages && files.newSubImages.length > 0) {
          // ファイルごとに処理
          const newSubImagesData = files.newSubImages.map((file, index) => {
            // 実際のアプリケーションでは、ここでファイルをストレージに保存し、URLを取得します
            return {
              appId: app.id,
              imageUrl: `https://example.com/uploads/${file.originalname}`,
              order: index,
            };
          });
          
          // 既存のIDが指定されている場合は既存の順序を保持
          if (safeUpdateDto.existingSubImageIds && safeUpdateDto.existingSubImageIds.length > 0) {
            // 既存のサブ画像を取得
            const existingSubImages = await prisma.appSubImage.findMany({
              where: { 
                appId: id,
                id: { in: safeUpdateDto.existingSubImageIds.map(id => Number(id)) }
              },
              orderBy: { id: 'asc' }
            });
            
            // 既存の画像をマッピング
            for (let i = 0; i < existingSubImages.length; i++) {
              await prisma.appSubImage.update({
                where: { id: existingSubImages[i].id },
                data: { order: newSubImagesData.length + i }
              });
            }
          } else {
            // 既存のサブ画像を全て削除
            await prisma.appSubImage.deleteMany({
              where: { appId: id }
            });
          }
          
          // 新しいサブ画像を追加
          await Promise.all(
            newSubImagesData.map(data => 
              prisma.appSubImage.create({
                data
              })
            )
          );
        }

        // 更新したアプリを返す（サブ画像も含めて取得）
        return prisma.app.findUnique({
          where: { id: app.id },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            tags: {
              select: {
                id: true,
                name: true,
              }
            },
            subImages: {
              orderBy: {
                order: 'asc',
              },
            },
            _count: {
              select: {
                ratings: true,
                bookmarks: true,
              },
            },
          },
        });
      });

      // 評価数を取得
      const likesCount = await this.prisma.rating.count({
        where: { 
          appId: id,
          type: 'LIKE'
        },
      });

      const dislikesCount = await this.prisma.rating.count({
        where: { 
          appId: id,
          type: 'DISLIKE'
        },
      });

      // 高評価率を計算
      const totalRatings = likesCount + dislikesCount;
      const likeRatio = totalRatings > 0 ? Math.round((likesCount / totalRatings) * 100) : 0;
      
      // 詳細情報を追加
      const appWithDetails = {
        ...updatedApp,
        likesCount,
        dislikesCount,
        likeRatio,
        bookmarkCount: updatedApp._count?.bookmarks || 0,
      } as AppWithDetails;

      return appWithDetails;
    } catch (error) {
      console.error('Error in updateApp:', error);
      throw new BadRequestException('アプリの更新に失敗しました');
    }
  }

  /**
   * アプリを削除
   */
  async deleteApp(
    id: number,
    developerId: number
  ): Promise<void> {
    // アプリの存在確認と権限チェック
    const existingApp = await this.prisma.app.findUnique({
      where: { id },
    });

    if (!existingApp) {
      throw new NotFoundException(`アプリ ID ${id} が見つかりません`);
    }

    if (existingApp.creatorId !== developerId) {
      throw new ForbiddenException('このアプリを削除する権限がありません');
    }

    // SUSPENDED状態のアプリのみ削除不可
    if (existingApp.status === AppStatus.SUSPENDED) {
      throw new ForbiddenException(`${existingApp.status}状態のアプリは削除できません`);
    }

    try {
      // 関連データも含めて削除（外部キー制約によりカスケード削除される）
      await this.prisma.app.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error in deleteApp:', error);
      throw new BadRequestException('アプリの削除に失敗しました');
    }
  }
} 
