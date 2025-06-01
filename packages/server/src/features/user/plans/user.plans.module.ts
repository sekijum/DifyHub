import { Module } from "@nestjs/common";
import { UserPlansController } from "./user.plans.controller";
import { UserPlansService } from "./user.plans.service";

@Module({
  controllers: [UserPlansController],
  providers: [UserPlansService],
})
export class UserPlansModule {} 
