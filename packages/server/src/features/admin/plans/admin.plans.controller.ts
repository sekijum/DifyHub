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
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AdminPlansService } from "./admin.plans.service";
import { JwtAuthGuard, RolesGuard, Roles } from "@/core/auth";
import { Role, Plan } from "@prisma/client";
import { CreatePlanDto, UpdatePlanDto } from "./dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
@Controller("admin/plans")
export class AdminPlansController {
  constructor(private readonly adminPlansService: AdminPlansService) {}

  /**
   * プラン一覧を取得
   */
  @Get()
  async findPlanList() {
    return this.adminPlansService.findPlanList();
  }

  /**
   * プラン詳細を取得
   */
  @Get(":name")
  async findPlanByName(@Param("name") name: string) {
    return this.adminPlansService.findPlanByName(name);
  }

  /**
   * プランを作成
   */
  @Post()
  async createPlan(@Body() createPlanDto: CreatePlanDto) {
    return this.adminPlansService.createPlan(createPlanDto);
  }

  /**
   * プランを更新
   */
  @Patch(":name")
  async updatePlan(
    @Param("name") name: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return this.adminPlansService.updatePlan(name, updatePlanDto);
  }

  /**
   * プランを削除
   */
  @Delete(":name")
  async deletePlan(@Param("name") name: string) {
    await this.adminPlansService.deletePlan(name);
  }
}
