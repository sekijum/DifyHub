import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Query,
  Body,
  Param,
  Req,
  ParseIntPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { AdminUsersService } from './admin.users.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard'; // 適切なパスに変更してください
import { RolesGuard } from '@/core/auth/guards/roles.guard';     // 適切なパスに変更してください
import { Roles } from '@/core/auth/decorators/roles.decorator'; // 適切なパスに変更してください
import { Role, UserStatus } from '@prisma/client'; // Prisma の Role enum と UserStatus をインポート
import { GetAdministratorsQueryDto } from './dto/get-administrators-query.dto'; // DTO をインポート
import { CreateAdministratorDto } from './dto/create-administrator.dto'; // 作成用DTOをインポート
import { UpdateAdministratorDto } from './dto/update-administrator.dto'; // 更新用DTOをインポート
import { GetDevelopersQueryDto } from './dto/get-developers-query.dto'; // 開発者一覧 DTO をインポート
import { UpdateDeveloperStatusDto } from './dto/update-developer-status.dto'; // 開発者ステータス更新 DTO をインポート
import { GetUsersQueryDto } from './dto/get-users-query.dto'; // 一般ユーザー一覧 DTO をインポート
import { UpdateUserStatusDto } from './dto/update-user-status.dto'; // 一般ユーザーステータス更新 DTO をインポート
import { 
  PaginatedAdministratorsResult, 
  AdministratorData,
  PaginatedDevelopersResult,
  DeveloperData,
  PaginatedUsersResult,
  UserData 
} from './admin.users.service'; // 戻り値の型をインポート
import { Request } from 'express'; // express の Request 型をインポート

// express の Request に user プロパティを追加するための型拡張 (必要であれば別ファイルに)
interface RequestWithUser extends Request {
  user?: { userId: number; /* 他のユーザー情報 */ };
}

@UseGuards(JwtAuthGuard, RolesGuard) // JWT認証とロールガードを適用
@Roles(Role.ADMINISTRATOR)           // ADMINISTRATOR ロールのみ許可
@Controller('admin') // コントローラーのベースパス
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get('administrators')
  async getAdministrators(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: GetAdministratorsQueryDto,
  ): Promise<PaginatedAdministratorsResult> {
    return this.adminUsersService.findAdministrators(query);
    // サービスがパスワードを除外したデータを返すため、ここでの .map は不要
  }

  @Post('administrators')
  @HttpCode(HttpStatus.CREATED)
  async createAdministrator(
    @Body(ValidationPipe)
    createAdministratorDto: CreateAdministratorDto,
  ): Promise<AdministratorData> { // 戻り値の型を AdministratorData に
    return this.adminUsersService.createAdministrator(createAdministratorDto);
  }

  @Patch('administrators/:id')
  async updateAdministrator(
    @Param('id', ParseIntPipe)
    id: number,
    @Body(ValidationPipe)
    updateAdministratorDto: UpdateAdministratorDto,
  ): Promise<AdministratorData> { // 戻り値の型を AdministratorData に
    return this.adminUsersService.updateAdministrator(id, updateAdministratorDto);
  }

  @Delete('administrators/:id')
  @HttpCode(HttpStatus.NO_CONTENT) // 成功時は 204 No Content を返す
  async deleteAdministrator(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser, // Req を注入し、型を指定
  ): Promise<void> {
    const currentUserId = req.user?.userId; // リクエストから userId を取得
    if (!currentUserId) {
      // 通常 JwtAuthGuard があればここには来ないはずだが念のため
      throw new ForbiddenException('Could not identify current user');
    }
    // サービスメソッドに currentUserId を渡す
    return this.adminUsersService.deleteAdministrator(id, currentUserId);
  }

  @Get('developers')
  async getDevelopers(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: GetDevelopersQueryDto,
    // 戻り値の型は管理者と同じ PaginatedAdministratorsResult を流用 (必要なら変更)
  ): Promise<PaginatedDevelopersResult> {
    return this.adminUsersService.findDevelopers(query);
  }

  @Patch('developers/:id/status')
  async updateDeveloperStatus(
    @Param('id', ParseIntPipe)
    id: number,
    @Body(ValidationPipe)
    updateDeveloperStatusDto: UpdateDeveloperStatusDto,
    // 戻り値の型は管理者と同じ AdministratorData を流用 (必要なら変更)
  ): Promise<DeveloperData> {
    return this.adminUsersService.updateDeveloperStatus(id, updateDeveloperStatusDto);
  }

  @Get('users') // Path: /admin/users
  async getRegularUsers(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: GetUsersQueryDto,
  ): Promise<PaginatedUsersResult> {
    return this.adminUsersService.findUsers(query);
  }

  // ユーザー詳細取得エンドポイントを追加
  @Get('users/:id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserData> {
    return this.adminUsersService.findUserById(id);
  }

  @Patch('users/:id/status') // Path: /admin/users/:id/status
  async updateUserStatus(
    @Param('id', ParseIntPipe)
    id: number,
    @Body(ValidationPipe)
    updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<UserData> {
    return this.adminUsersService.updateUserStatus(id, updateUserStatusDto);
  }

  // 管理者詳細取得エンドポイントを追加
  @Get('administrators/:id')
  async getAdministratorById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AdministratorData> {
    return this.adminUsersService.findAdministratorById(id);
  }

  // 開発者詳細取得エンドポイントを追加
  @Get('developers/:id')
  async getDeveloperById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeveloperData> {
    return this.adminUsersService.findDeveloperById(id);
  }
}
