import { Controller, Get } from "@nestjs/common";
import { CategoriesService } from "./categories.service";

/**
 * カテゴリ関連のエンドポイントを提供するコントローラー
 */
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * カテゴリ一覧を取得
   */
  @Get()
  findCategoryList() {
    return this.categoriesService.findCategoryList();
  }
}
