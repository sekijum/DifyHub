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
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoQueryDto } from './dto/video-query.dto';

@ApiTags('videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '新しい動画をアップロード' })
  @ApiResponse({ status: 201, description: '動画が正常にアップロードされました' })
  @ApiResponse({ status: 400, description: '無効なリクエストデータ' })
  @ApiResponse({ status: 401, description: '認証されていません' })
  @ApiResponse({ status: 403, description: 'チャンネルが存在しません' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createVideoDto: CreateVideoDto,
    @UploadedFiles()
    files: {
      video?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
    @Request() req,
  ) {
    if (!files.video || files.video.length === 0) {
      throw new BadRequestException('動画ファイルが提供されていません');
    }

    const videoFile = files.video[0];
    const thumbnailFile = files.thumbnail?.[0];

    return this.videosService.create(
      req.user.userId,
      createVideoDto,
      videoFile,
      thumbnailFile,
    );
  }

  @Get()
  @ApiOperation({ summary: '動画一覧の取得' })
  @ApiResponse({ status: 200, description: '動画のリストを返します' })
  findAll(@Query() query: VideoQueryDto) {
    return this.videosService.findAll(query);
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '現在のユーザーの動画を取得' })
  @ApiResponse({ status: 200, description: 'ユーザーの動画リストを返します' })
  @ApiResponse({ status: 401, description: '認証されていません' })
  findAllByUser(@Request() req) {
    return this.videosService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '動画詳細の取得' })
  @ApiResponse({ status: 200, description: '動画の詳細情報を返します' })
  @ApiResponse({ status: 404, description: '動画が見つかりません' })
  findOne(@Param('id') id: string) {
    return this.videosService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '動画情報の更新' })
  @ApiResponse({ status: 200, description: '動画が正常に更新されました' })
  @ApiResponse({ status: 401, description: '認証されていません' })
  @ApiResponse({ status: 403, description: '更新する権限がありません' })
  @ApiResponse({ status: 404, description: '動画が見つかりません' })
  update(
    @Param('id') id: string,
    @Body() updateVideoDto: UpdateVideoDto,
    @Request() req,
  ) {
    return this.videosService.update(+id, req.user.userId, updateVideoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '動画の削除' })
  @ApiResponse({ status: 200, description: '動画が正常に削除されました' })
  @ApiResponse({ status: 401, description: '認証されていません' })
  @ApiResponse({ status: 403, description: '削除する権限がありません' })
  @ApiResponse({ status: 404, description: '動画が見つかりません' })
  remove(@Param('id') id: string, @Request() req) {
    return this.videosService.remove(+id, req.user.userId);
  }
}
