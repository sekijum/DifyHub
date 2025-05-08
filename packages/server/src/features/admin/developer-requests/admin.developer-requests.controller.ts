import {
  Controller,
  Get,
  Patch,
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
import { AdminDeveloperRequestsService } from "./admin.developer-requests.service";
import {
  FindDeveloperRequestListQueryDto,
  UpdateDeveloperRequestStatusDto,
} from "./dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
@Controller("admin/developer-requests")
export class AdminDeveloperRequestsController {
  constructor(
    private readonly adminDeveloperRequestsService: AdminDeveloperRequestsService,
  ) {}

  /**
   * 開発者申請一覧を取得
   */
  @Get()
  findDeveloperRequestList(@Query() query: FindDeveloperRequestListQueryDto) {
    return this.adminDeveloperRequestsService.findDeveloperRequestList(query);
  }

  /**
   * 開発者申請詳細を取得
   */
  @Get(":id")
  findDeveloperRequestById(@Param("id", ParseIntPipe) id: number) {
    return this.adminDeveloperRequestsService.findDeveloperRequestById(id);
  }

  /**
   * 開発者申請のステータスを更新（承認・却下）
   */
  @Patch(":id/status")
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateDeveloperRequestStatusDto,
  ) {
    return this.adminDeveloperRequestsService.updateDeveloperRequestStatus(
      id,
      updateDto,
    );
  }
}
