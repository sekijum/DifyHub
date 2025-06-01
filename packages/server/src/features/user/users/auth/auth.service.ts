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
import { payjp } from "@/core/payjp";

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
    try {
      // メールアドレス重複チェック
      const existingUser = await prisma.user.findUnique({ where: { email: dto.email } });
      if (existingUser) {
        throw new ConflictException("このメールアドレスは既に使用されています");
      }

      // パスワードハッシュ化
      const hashedPassword = await hashPassword(dto.password);

      const newUser = await prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          avatarUrl: dto.avatarUrl ?? null,
        },
      });

      const payjpCustomer = await payjp.customers.create({ email: dto.email, description: dto.name });

      if (!payjpCustomer.id) {
        throw new InternalServerErrorException("PayJP顧客作成に失敗しました");
      }

      const freePlan = await prisma.plan.findFirstOrThrow({ where: { isDefault: true } });

      await prisma.user.update({
        where: { id: newUser.id },
        data: { 
          payjpCustomerId: payjpCustomer.id,
          subscription: {
            create: {
              planName: freePlan.name,
            },
          },
        },
      });

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
        email: dto.email,
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
