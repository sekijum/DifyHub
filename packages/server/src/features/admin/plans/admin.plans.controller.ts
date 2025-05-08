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
  @Get(":id")
  async findPlanById(@Param("id") id: string) {
    return this.adminPlansService.findPlanById(id);
  }

  /**
   * プランを作成
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPlan(@Body() createPlanDto: CreatePlanDto) {
    return this.adminPlansService.createPlan(createPlanDto);
  }

  /**
   * プランを更新
   */
  @Patch(":id")
  async updatePlan(
    @Param("id") id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return this.adminPlansService.updatePlan(id, updatePlanDto);
  }

  /**
   * プランを削除
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePlan(@Param("id") id: string) {
    await this.adminPlansService.deletePlan(id);
  }
}
