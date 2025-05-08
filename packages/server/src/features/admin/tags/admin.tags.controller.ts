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
  ParseIntPipe,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "@/core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/core/auth/guards/roles.guard";
import { Roles } from "@/core/auth/decorators/roles.decorator";
import { AdminTagsService } from "./admin.tags.service";
import { FindTagListQueryDto, CreateTagDto, UpdateTagDto } from "./dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
@Controller("admin/tags")
export class AdminTagsController {
  constructor(private readonly adminTagsService: AdminTagsService) {}

  /**
   * タグ一覧を取得
   */
  @Get()
  findTagList(@Query() query: FindTagListQueryDto) {
    return this.adminTagsService.findTagList(query);
  }

  /**
   * タグ詳細を取得
   */
  @Get(":id")
  findTagById(@Param("id", ParseIntPipe) id: number) {
    return this.adminTagsService.findTagById(id);
  }

  /**
   * タグを作成
   */
  @Post()
  createTag(@Body() createDto: CreateTagDto) {
    return this.adminTagsService.createTag(createDto);
  }

  /**
   * タグを更新
   */
  @Patch(":id")
  updateTag(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateTagDto,
  ) {
    return this.adminTagsService.updateTag(id, updateDto);
  }

  /**
   * タグを削除
   */
  @Delete(":id")
  deleteTag(@Param("id", ParseIntPipe) id: number) {
    return this.adminTagsService.deleteTag(id);
  }
}
