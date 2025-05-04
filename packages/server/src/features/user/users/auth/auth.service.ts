import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { User, Prisma } from '@prisma/client';
import { MailerService } from '@/core/mailer/mailer.service';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { hashPassword, comparePassword } from '@/core/utils/hashing.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * JWT アクセストークンを生成します。
   * @param user ユーザー情報 (id, email, role を含む)
   * @returns アクセストークン文字列
   */
  private async generateAccessToken(user: Pick<User, 'id' | 'email' | 'role'>): Promise<string> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    // 有効期限は AuthModule で設定された値 (環境変数 JWT_ACCESS_EXPIRES_IN または デフォルト '7d') を使用
    // ここで ConfigService から再度取得する必要はない
    // const expiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'); 
    try {
      // signAsync は AuthModule の設定に基づいてトークンを生成する
      return await this.jwtService.signAsync(payload);
    } catch (error) {
      console.error('JWTトークンの生成に失敗しました:', error);
      throw new InternalServerErrorException('トークンの生成中にエラーが発生しました。');
    }
  }

  /**
   * LocalStrategy (メールアドレスとパスワード認証) で使用されるユーザー検証ロジック。
   * @param email メールアドレス
   * @param pass パスワード
   * @returns パスワードを除いたユーザー情報、または null
   */
  async validateUser(email: string, pass: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const isPasswordMatching = await comparePassword(pass, user.password);
      if (isPasswordMatching) {
        // パスワードフィールドを除外して返す
        const { password, ...result } = user;
        return result;
      }
    }
    // ユーザーが存在しない、またはパスワードが一致しない場合は null を返す
    return null;
  }

  /**
   * 新規ユーザー登録を行います。
   * @param signUpDto サインアップ情報
   * @returns アクセストークン
   */
  async signUp(signUpDto: SignUpDto): Promise<{ access_token: string }> {
    const { email, password, name, avatarUrl } = signUpDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // 既にメールアドレスが登録されている場合はエラー
      throw new ConflictException('このメールアドレスは既に使用されています。');
    }

    const hashedPassword = await hashPassword(password);

    let newUser: User;
    try {
      // ユーザー作成時にネストしてデフォルトフォルダも作成
      newUser = await this.prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            avatarUrl,
            bookmarkFolders: {
              create: {
                name: '後で見る',
                isDefault: true,
              },
            },
            // planName など他の必須フィールドは Prisma スキーマのデフォルト値に依存
          },
        });

    } catch (error) {
      // Prisma でのユーザー作成エラー（DB接続エラー、制約違反など）
      console.error('ユーザー登録中に Prisma エラーが発生しました:', error);
      // P2002 は Prisma 2.16 以降で一意性制約違反を示すコード
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          // email の unique 制約違反の場合
           throw new ConflictException('このメールアドレスは既に使用されています。');
      }
      throw new InternalServerErrorException('ユーザー登録中にエラーが発生しました。しばらくしてから再度お試しください。');
    }

    // ウェルカムメールを送信 (失敗してもサインアップ自体は成功とする)
    try {
      await this.mailerService.sendWelcomeEmail(newUser);
    } catch (error) {
      // メール送信のエラーはログに残すが、ユーザーへの影響は最小限に
      console.error(`ウェルカムメールの送信に失敗しました (ユーザー: ${newUser.email}):`, error);
    }

    // 新規ユーザー用のアクセストークンを生成して返す
    const payloadUser: Pick<User, 'id' | 'email' | 'role'> = { id: newUser.id, email: newUser.email, role: newUser.role };
    const accessToken = await this.generateAccessToken(payloadUser);
    return { access_token: accessToken };
  }

  /**
   * ユーザーのサインイン処理を行います。
   * @param signInDto サインイン情報
   * @returns アクセストークン
   */
  async signIn(signInDto: SignInDto): Promise<{ access_token: string }> {
    const { email, password } = signInDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // ユーザーが存在しない、またはパスワードが一致しない場合、
    // セキュリティのため、どちらが原因か特定できないような一般的なエラーメッセージを返す
    if (!user || !(await comparePassword(password, user.password))) {
      throw new UnauthorizedException('メールアドレスまたはパスワードが正しくありません。');
    }

    // 有効なユーザーであればアクセストークンを生成して返す
    const payloadUser: Pick<User, 'id' | 'email' | 'role'> = { id: user.id, email: user.email, role: user.role };
    const accessToken = await this.generateAccessToken(payloadUser);
    return { access_token: accessToken };
  }
} 
