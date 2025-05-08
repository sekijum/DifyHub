import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { UsersService } from "./users.service";
import { FindUserAppListQueryDto } from "./dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * ユーザー詳細とアプリ一覧を取得
   */
  @Get(":id")
  findUserById(
    @Param("id", ParseIntPipe) id: number,
    @Query()
    query: FindUserAppListQueryDto,
  ) {
    return this.usersService.findUserById(id, query);
  }
}
