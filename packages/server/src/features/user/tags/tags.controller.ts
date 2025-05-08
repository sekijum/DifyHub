import { Controller, Get } from "@nestjs/common";
import { TagsService } from "./tags.service";

/**
 * タグ関連のエンドポイントを提供するコントローラー
 */
@Controller("tags")
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * 人気のタグを取得
   */
  @Get("popular")
  findPopular() {
    return this.tagsService.findPopular();
  }

  /**
   * すべてのタグを取得
   */
  @Get()
  findTagList() {
    return this.tagsService.findTagList();
  }
}
