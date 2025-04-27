import { Controller, Post, UseGuards, Request, Get, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'ユーザーログイン' })
  @ApiResponse({ status: 200, description: '正常にログインしました' })
  @ApiResponse({ status: 401, description: '認証に失敗しました' })
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Post('register')
  @ApiOperation({ summary: 'ユーザー登録' })
  @ApiResponse({ status: 201, description: 'ユーザーが正常に登録されました' })
  @ApiResponse({ status: 400, description: '無効なリクエストデータ' })
  @ApiResponse({ status: 409, description: 'ユーザー名またはメールアドレスが既に存在します' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.username,
      registerDto.password,
      registerDto.avatar,
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ユーザープロフィールの取得' })
  @ApiResponse({ status: 200, description: 'プロフィール情報を返します' })
  @ApiResponse({ status: 401, description: '認証に失敗しました' })
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }
} 
