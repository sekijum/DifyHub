import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'ユーザーを作成' })
  @ApiResponse({ status: 201, description: 'ユーザーが正常に作成されました' })
  @ApiResponse({ status: 400, description: '無効なリクエストデータ' })
  @ApiResponse({ status: 409, description: 'ユーザー名またはメールアドレスが既に存在します' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'すべてのユーザーを取得' })
  @ApiResponse({ status: 200, description: 'ユーザーのリストを返します' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'IDによるユーザーの取得' })
  @ApiResponse({ status: 200, description: 'ユーザーの詳細情報を返します' })
  @ApiResponse({ status: 404, description: 'ユーザーが見つかりません' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ユーザー情報の更新' })
  @ApiResponse({ status: 200, description: '更新されたユーザー情報を返します' })
  @ApiResponse({ status: 404, description: 'ユーザーが見つかりません' })
  @ApiResponse({ status: 409, description: 'ユーザー名またはメールアドレスが既に存在します' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    // 本人または管理者のみ更新可能にするロジックをここに追加
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ユーザーの削除' })
  @ApiResponse({ status: 200, description: 'ユーザーが正常に削除されました' })
  @ApiResponse({ status: 404, description: 'ユーザーが見つかりません' })
  remove(@Param('id') id: string, @Request() req) {
    // 本人または管理者のみ削除可能にするロジックをここに追加
    return this.usersService.remove(+id);
  }
} 
