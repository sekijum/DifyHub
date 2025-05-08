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
} from "@nestjs/common";
import { AdminUsersService } from "./admin.users.service";
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
  UserPayload,
} from "@/core/auth";
import { Role } from "@prisma/client";
import {
  UpdateUserStatusDto,
  CreateAdministratorDto,
  UpdateAdministratorDto,
  UpdateDeveloperStatusDto,
  FindAdministratorListQueryDto,
  FindDeveloperListQueryDto,
  FindUserListQueryDto,
} from "./dto/index";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
@Controller("admin")
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get("administrators")
  async findAdministratorList(@Query() query: FindAdministratorListQueryDto) {
    return this.adminUsersService.findAdministratorList(query);
  }

  @Post("administrators")
  async createAdministrator(
    @Body() createAdministratorDto: CreateAdministratorDto,
  ) {
    return this.adminUsersService.createAdministrator(createAdministratorDto);
  }

  @Patch("administrators/:id")
  async updateAdministrator(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateAdministratorDto: UpdateAdministratorDto,
  ) {
    return this.adminUsersService.updateAdministrator(
      id,
      updateAdministratorDto,
    );
  }

  @Delete("administrators/:id")
  async removeAdministrator(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: UserPayload,
  ) {
    return this.adminUsersService.deleteAdministrator(id, user.userId);
  }

  @Get("developers")
  async findDeveloperList(@Query() query: FindDeveloperListQueryDto) {
    return this.adminUsersService.findDeveloperList(query);
  }

  @Patch("developers/:id/status")
  async updateDeveloperStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDeveloperStatusDto: UpdateDeveloperStatusDto,
  ) {
    return this.adminUsersService.updateDeveloperStatus(
      id,
      updateDeveloperStatusDto,
    );
  }

  @Get("users")
  async findUserList(@Query() query: FindUserListQueryDto) {
    return this.adminUsersService.findUserList(query);
  }

  @Get("users/:id")
  async findUserById(@Param("id", ParseIntPipe) id: number) {
    return this.adminUsersService.findUserById(id);
  }

  @Patch("users/:id/status")
  async updateUserStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.adminUsersService.updateUserStatus(id, updateUserStatusDto);
  }

  @Get("administrators/:id")
  async findAdministratorById(@Param("id", ParseIntPipe) id: number) {
    return this.adminUsersService.findAdministratorById(id);
  }

  @Get("developers/:id")
  async findDeveloperById(@Param("id", ParseIntPipe) id: number) {
    return this.adminUsersService.findDeveloperById(id);
  }
}
