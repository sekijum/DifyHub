import {
  Controller,
  Get,
  Body,
  Put,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { Setting } from "@prisma/client";
import { AdminSettingService } from "./admin.setting.service";
import { UpdateSettingDto } from "./dto/update-setting.dto";
import { JwtAuthGuard } from "@/core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/core/auth/guards/roles.guard";
import { Roles } from "@/core/auth/decorators/roles.decorator";
import { Role } from "@prisma/client";

@Controller("admin/setting")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
export class AdminSettingController {
  constructor(private readonly settingService: AdminSettingService) {}

  @Get()
  async findOne() {
    return this.settingService.findSetting();
  }

  @Put()
  async update(@Body() updateSettingDto: UpdateSettingDto) {
    return this.settingService.updateSetting(updateSettingDto);
  }
}
