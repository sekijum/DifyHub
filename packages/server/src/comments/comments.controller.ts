import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'コメントを作成' })
  @ApiResponse({ status: 201, description: 'コメントが正常に作成されました' })
  @ApiResponse({ status: 400, description: '無効なリクエストデータ' })
  @ApiResponse({ status: 401, description: '認証されていません' })
  @ApiResponse({ status: 404, description: '動画が見つかりません' })
  create(@Body() createCommentDto: CreateCommentDto, @Request() req) {
    return this.commentsService.create(req.user.userId, createCommentDto);
  }

  @Get()
  @ApiOperation({ summary: '動画のコメント一覧を取得' })
  @ApiResponse({ status: 200, description: 'コメントのリストを返します' })
  @ApiResponse({ status: 404, description: '動画が見つかりません' })
  findAll(@Query('videoId') videoId: string) {
    return this.commentsService.findAll(+videoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'コメント詳細の取得' })
  @ApiResponse({ status: 200, description: 'コメントの詳細情報を返します' })
  @ApiResponse({ status: 404, description: 'コメントが見つかりません' })
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'コメントの更新' })
  @ApiResponse({ status: 200, description: 'コメントが正常に更新されました' })
  @ApiResponse({ status: 401, description: '認証されていません' })
  @ApiResponse({ status: 403, description: '更新する権限がありません' })
  @ApiResponse({ status: 404, description: 'コメントが見つかりません' })
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req,
  ) {
    return this.commentsService.update(+id, req.user.userId, updateCommentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'コメントの削除' })
  @ApiResponse({ status: 200, description: 'コメントが正常に削除されました' })
  @ApiResponse({ status: 401, description: '認証されていません' })
  @ApiResponse({ status: 403, description: '削除する権限がありません' })
  @ApiResponse({ status: 404, description: 'コメントが見つかりません' })
  remove(@Param('id') id: string, @Request() req) {
    return this.commentsService.remove(+id, req.user.userId);
  }
} 
