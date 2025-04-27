import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('likes')
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '動画に評価（高評価・低評価）を付ける' })
  @ApiResponse({ status: 200, description: '評価が正常に登録されました' })
  @ApiResponse({ status: 401, description: '認証されていません' })
  @ApiResponse({ status: 404, description: '動画が見つかりません' })
  create(@Body() createLikeDto: CreateLikeDto, @Request() req) {
    return this.likesService.create(req.user.userId, createLikeDto);
  }

  @Get()
  @ApiOperation({ summary: '動画の評価数（高評価・低評価）を取得' })
  @ApiResponse({ status: 200, description: '評価数を返します' })
  @ApiResponse({ status: 404, description: '動画が見つかりません' })
  findAll(@Query('videoId') videoId: string) {
    return this.likesService.findAll(+videoId);
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ユーザーの動画に対する評価状態を取得' })
  @ApiResponse({ status: 200, description: 'ユーザーの評価状態を返します' })
  @ApiResponse({ status: 401, description: '認証されていません' })
  @ApiResponse({ status: 404, description: '動画が見つかりません' })
  getUserLike(@Query('videoId') videoId: string, @Request() req) {
    return this.likesService.getUserLike(req.user.userId, +videoId);
  }

  @Delete(':videoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '動画の評価を削除' })
  @ApiResponse({ status: 200, description: '評価が正常に削除されました' })
  @ApiResponse({ status: 401, description: '認証されていません' })
  @ApiResponse({ status: 404, description: '評価が見つかりません' })
  remove(@Param('videoId') videoId: string, @Request() req) {
    return this.likesService.remove(req.user.userId, +videoId);
  }
} 
