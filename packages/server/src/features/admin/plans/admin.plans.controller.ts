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
  ValidationPipe,
} from '@nestjs/common';
import { AdminPlansService, PaginatedPlansResult } from './admin.plans.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/auth/guards/roles.guard';
import { Roles } from '@/core/auth/decorators/roles.decorator';
import { Role, Plan } from '@prisma/client';
import { GetPlansQueryDto } from './dto/get-plans-query.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
@Controller('admin/plans')
export class AdminPlansController {
  constructor(private readonly adminPlansService: AdminPlansService) {}

  /**
   * プラン一覧を取得
   */
  @Get()
  async getPlans(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: GetPlansQueryDto,
  ): Promise<PaginatedPlansResult> {
    return this.adminPlansService.findPlans(query);
  }

  /**
   * プラン詳細を取得
   */
  @Get(':id')
  async getPlanById(
    @Param('id') id: string,
  ): Promise<Plan> {
    return this.adminPlansService.findPlanById(id);
  }

  /**
   * プランを作成
   */
  @Post()
  async createPlan(
    @Body(ValidationPipe) createDto: CreatePlanDto,
  ): Promise<Plan> {
    return this.adminPlansService.createPlan(createDto);
  }

  /**
   * プランを更新
   */
  @Patch(':id')
  async updatePlan(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdatePlanDto,
  ): Promise<Plan> {
    return this.adminPlansService.updatePlan(id, updateDto);
  }

  /**
   * プランを削除
   */
  @Delete(':id')
  async deletePlan(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.adminPlansService.deletePlan(id);
    return { message: 'プランが正常に削除されました' };
  }
} 
