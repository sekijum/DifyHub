import { Controller, Get } from '@nestjs/common';
import { Setting } from '@prisma/client';
import { SettingService } from './setting.service';

@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  async findSetting(): Promise<Setting> {
    return this.settingService.findSetting();
  }
} 
