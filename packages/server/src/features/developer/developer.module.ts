import { Module } from '@nestjs/common';
import { DeveloperAppsModule } from './apps/developer.apps.module';
import { DeveloperProfileModule } from './profile/developer.profile.module';

@Module({
  imports: [
    DeveloperAppsModule,
    DeveloperProfileModule,
  ],
  exports: [
    DeveloperAppsModule,
    DeveloperProfileModule,
  ],
})
export class DeveloperModule {} 
