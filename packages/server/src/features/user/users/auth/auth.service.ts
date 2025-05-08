import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { SignUpDto, SignInDto } from "./dto";
import { User, Prisma } from "@prisma/client";
import { MailerService } from "@/core/mailer/mailer.service";
import { prisma } from "@/core/database/prisma.client";
import { hashPassword, comparePassword } from "@/core/utils/hashing.util";
import { square } from "@/core/square/square.client";

// JWTペイロード型定義
interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * JWT アクセストークンを生成します。
   */
  private async generateAccessToken(user: Pick<User, "id" | "email" | "role">) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    try {
      return await this.jwtService.signAsync(payload);
    } catch (error) {
      this.logger.error(`JWTトークン生成エラー: ${JSON.stringify(error)}`, {
        userId: user.id,
      });
      throw new InternalServerErrorException(
        "トークンの生成中にエラーが発生しました",
      );
    }
  }

  /**
   * Square顧客IDを作成します
   */
  private async createSquareCustomer(name: string, email: string) {
    try {
      this.logger.log("Square顧客作成開始", { name, email });

      const customerResponse = await square.customers.create({
        givenName: name,
        emailAddress: email,
        referenceId: `user_${Date.now()}`,
      });

      if (customerResponse.customer?.id) {
        return customerResponse.customer.id;
      }

      throw new Error("Square顧客作成レスポンスが無効です");
    } catch (error) {
      this.logger.error(`Square顧客作成エラー: ${JSON.stringify(error)}`, {
        name,
        email,
      });
      // フォールバックID（実際のSquare連携はできない）
      return `cust_${Math.random().toString(36).substring(2, 10)}`;
    }
  }

  /**
   * 無料プランのSquareサブスクリプションを作成します
   */
  private async createFreeSubscription(
    userId: number,
    squareCustomerId: string,
  ) {
    try {
      // フリープランの情報を取得
      const freePlan = await prisma.plan.findUnique({
        where: { name: "free" },
      });

      if (!freePlan || !freePlan.squareCatalogId) {
        this.logger.warn(
          "無料プラン情報が見つからない、またはcatalogIDがありません",
          { userId },
        );
        return null;
      }

      this.logger.log("無料プランのサブスクリプション作成", {
        userId,
        customerId: squareCustomerId,
        planId: freePlan.squareCatalogId,
      });

      const subscriptionResponse = await square.subscriptions.create({
        idempotencyKey: `${userId}_free_${Date.now()}`,
        locationId: process.env.SQUARE_LOCATION_ID || "",
        planVariationId: freePlan.squareCatalogId,
        customerId: squareCustomerId,
      });

      if (subscriptionResponse.subscription?.id) {
        return subscriptionResponse.subscription.id;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `無料プランサブスクリプション作成エラー: ${JSON.stringify(error)}`,
        { userId },
      );
      return null;
    }
  }

  /**
   * LocalStrategy (メールアドレスとパスワード認証) で使用されるユーザー検証ロジック
   */
  async validateUser(email: string, pass: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return null;
      }

      const isPasswordMatching = await comparePassword(pass, user.password);
      if (!isPasswordMatching) {
        return null;
      }

      // パスワードフィールドを除外して返す
      const { password, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error(`ユーザー検証エラー: ${JSON.stringify(error)}`, {
        email,
      });
      return null;
    }
  }

  /**
   * 新規ユーザー登録を行います
   */
  async signUp(dto: SignUpDto) {
    const { email, password, name, avatarUrl } = dto;

    try {
      // メールアドレス重複チェック
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new ConflictException("このメールアドレスは既に使用されています");
      }

      // パスワードハッシュ化
      const hashedPassword = await hashPassword(password);

      // Square顧客ID作成
      const squareCustomerId = await this.createSquareCustomer(name, email);

      // ユーザー作成（デフォルトフォルダとサブスクリプション情報も同時に作成）
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          avatarUrl,
          bookmarkFolders: {
            create: {
              name: "後で見る",
              isDefault: true,
            },
          },
          subscription: {
            create: {
              planName: "free",
              squareCustomerId,
            },
          },
        },
      });

      // 無料プランサブスクリプション作成
      const subscriptionId = await this.createFreeSubscription(
        newUser.id,
        squareCustomerId,
      );

      // サブスクリプションIDがある場合のみ更新
      if (subscriptionId) {
        await prisma.subscription.update({
          where: { userId: newUser.id },
          data: { squareSubscriptionId: subscriptionId },
        });
      }

      // ウェルカムメール送信
      try {
        await this.mailerService.sendWelcomeEmail(newUser);
      } catch (error) {
        this.logger.error(
          `ウェルカムメール送信エラー: ${JSON.stringify(error)}`,
          { userId: newUser.id, email: newUser.email },
        );
      }

      // アクセストークン生成
      const accessToken = await this.generateAccessToken({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      return { access_token: accessToken };
    } catch (error) {
      // Prisma エラー処理
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("このメールアドレスは既に使用されています");
      }

      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(`ユーザー登録エラー: ${JSON.stringify(error)}`, {
        email,
      });
      throw new InternalServerErrorException(
        "ユーザー登録中にエラーが発生しました。しばらくしてから再度お試しください",
      );
    }
  }

  /**
   * ユーザーのサインイン処理を行います
   */
  async signIn(dto: SignInDto) {
    const { email, password } = dto;

    try {
      // ユーザー検索
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // 存在確認とパスワード検証
      if (!user || !(await comparePassword(password, user.password))) {
        throw new UnauthorizedException(
          "メールアドレスまたはパスワードが正しくありません",
        );
      }

      // アクセストークン生成
      const accessToken = await this.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return { access_token: accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`サインインエラー: ${JSON.stringify(error)}`, {
        email,
      });
      throw new InternalServerErrorException(
        "サインイン処理中にエラーが発生しました",
      );
    }
  }
}
