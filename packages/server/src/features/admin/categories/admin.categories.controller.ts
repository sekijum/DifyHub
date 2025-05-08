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
import { AdminCategoriesService } from "./admin.categories.service";
import {
  FindCategoryListQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "./dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
@Controller("admin/categories")
export class AdminCategoriesController {
  constructor(
    private readonly adminCategoriesService: AdminCategoriesService,
  ) {}

  /**
   * カテゴリー一覧を取得
   */
  @Get()
  findCategoryList(@Query() query: FindCategoryListQueryDto) {
    return this.adminCategoriesService.findCategoryList(query);
  }

  /**
   * カテゴリー詳細を取得
   */
  @Get(":id")
  findCategoryById(@Param("id", ParseIntPipe) id: number) {
    return this.adminCategoriesService.findCategoryById(id);
  }

  /**
   * カテゴリーを作成
   */
  @Post()
  createCategory(@Body() createDto: CreateCategoryDto) {
    return this.adminCategoriesService.createCategory(createDto);
  }

  /**
   * カテゴリーを更新
   */
  @Patch(":id")
  updateCategory(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateCategoryDto,
  ) {
    return this.adminCategoriesService.updateCategory(id, updateDto);
  }

  /**
   * カテゴリーを削除
   */
  @Delete(":id")
  deleteCategory(@Param("id", ParseIntPipe) id: number) {
    return this.adminCategoriesService.deleteCategory(id);
  }
}
