import {
  Controller,
  Get,
  UseGuards,
  Query,
  Param,
} from "@nestjs/common";
import { UserPlansService } from "./user.plans.service";
import { JwtAuthGuard } from "@/core/auth";

@Controller("user/plans")
export class UserPlansController {
  constructor(private readonly userPlansService: UserPlansService) {}

  /**
   * 一般ユーザー向けプラン一覧を取得
   */
  @Get()
  async findPlanList() {
    return this.userPlansService.findPlanList();
  }

  /**
   * プラン詳細を取得（名前で検索）
   */
  @Get(":name")
  async findPlanByName(@Param("name") name: string) {
    return this.userPlansService.findPlanByName(name);
  }
} 
