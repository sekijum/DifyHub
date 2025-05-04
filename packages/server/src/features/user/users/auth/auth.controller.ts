import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';

/**
 * 認証関連のエンドポイントを提供するコントローラー
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 新規ユーザー登録エンドポイント
   * @param signUpDto ユーザー登録情報
   * @returns アクセストークン
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signUp(@Body() signUpDto: SignUpDto): Promise<{ access_token: string }> {
    return this.authService.signUp(signUpDto);
  }

  /**
   * ユーザーサインインエンドポイント
   * @param signInDto サインイン情報
   * @returns アクセストークン
   */
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() signInDto: SignInDto): Promise<{ access_token: string }> {
    return this.authService.signIn(signInDto);
  }
} 
