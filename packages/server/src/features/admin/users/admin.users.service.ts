import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Role, Prisma } from "@prisma/client";
import { prisma } from "@/core/database/prisma.client";
import {
  FindAdministratorListQueryDto,
  FindDeveloperListQueryDto,
  FindUserListQueryDto,
  CreateAdministratorDto,
  UpdateAdministratorDto,
  UpdateDeveloperStatusDto,
  UpdateUserStatusDto,
} from "./dto";
import {
  getPaginationParams,
  createPaginatedResponse,
  hashPassword,
  logger,
} from "@/core/utils";

@Injectable()
export class AdminUsersService {
  private readonly serviceName = AdminUsersService.name;

  /**
   * メールアドレスの重複チェック
   */
  private async validateUniqueEmail(email: string, excludeId?: number) {
    try {
      const whereCondition: Prisma.UserWhereInput = {
        email,
        ...(excludeId && { NOT: { id: excludeId } }),
      };

      const existingUser = await prisma.user.findFirst({
        where: whereCondition,
      });

      if (existingUser) {
        throw new ConflictException("このメールアドレスは既に使用されています");
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      logger.error(
        `メールアドレス検証中にエラーが発生しました: ${error.message}`,
        error.stack,
        this.serviceName,
      );
      throw new InternalServerErrorException(
        "メールアドレス検証中にエラーが発生しました",
      );
    }
  }

  // ----- 管理者関連 -----

  async findAdministratorList(query?: FindAdministratorListQueryDto) {
    const pagination = getPaginationParams(query);

    const where: Prisma.UserWhereInput = {
      role: Role.ADMINISTRATOR,
      ...(query?.status && { status: query.status }),
    };

    // 検索条件を構築
    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: "insensitive" } },
        { email: { contains: pagination.search, mode: "insensitive" } },
      ];
    }

    try {
      const [data, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { [pagination.sortBy]: pagination.sortOrder },
        }),
        prisma.user.count({ where }),
      ]);

      return createPaginatedResponse(
        data,
        total,
        pagination.page,
        pagination.limit,
      );
    } catch (error) {
      logger.error(
        `管理者リスト取得中にエラーが発生しました: ${error.message}`,
        error.stack,
        this.serviceName,
      );
      throw new InternalServerErrorException(
        "データ取得中にエラーが発生しました",
      );
    }
  }

  async findAdministratorById(id: number) {
    try {
      const administrator = await prisma.user.findUniqueOrThrow({
        where: {
          id,
          role: Role.ADMINISTRATOR,
        },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return administrator;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException(`ID:${id}の管理者が見つかりません`);
        }
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error(
        `管理者取得中にエラーが発生しました: ${error.message}`,
        error.stack,
        this.serviceName,
      );
      throw new InternalServerErrorException(
        "管理者情報取得中にエラーが発生しました",
      );
    }
  }

  async createAdministrator(dto: CreateAdministratorDto) {
    try {
      await this.validateUniqueEmail(dto.email);
      const hashedPassword = await hashPassword(dto.password);

      await prisma.$transaction(async (tx) => {
        return tx.user.create({
          data: {
            email: dto.email,
            name: dto.name,
            password: hashedPassword,
            role: Role.ADMINISTRATOR,
          },
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      logger.error(
        `管理者作成中にエラーが発生しました: ${error.message}`,
        error.stack,
        this.serviceName,
      );
      throw new InternalServerErrorException(
        "管理者作成中にエラーが発生しました",
      );
    }
  }

  async updateAdministrator(id: number, dto: UpdateAdministratorDto) {
    try {
      // 管理者の存在確認
      await prisma.user.findUniqueOrThrow({
        where: {
          id,
          role: Role.ADMINISTRATOR,
        },
      });

      const dataToUpdate: Prisma.UserUpdateInput = {};

      if (dto.name) dataToUpdate.name = dto.name;

      if (dto.email) {
        await this.validateUniqueEmail(dto.email, id);
        dataToUpdate.email = dto.email;
      }

      if (dto.password) {
        dataToUpdate.password = await hashPassword(dto.password);
      }

      if (Object.keys(dataToUpdate).length === 0) {
        throw new BadRequestException("更新するフィールドがありません");
      }

      await prisma.$transaction(async (tx) => {
        return tx.user.update({
          where: { id },
          data: dataToUpdate,
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException(`ID:${id}の管理者が見つかりません`);
        }
      }
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      logger.error(
        `管理者更新中にエラーが発生しました: ${error.message}`,
        error.stack,
        this.serviceName,
      );
      throw new InternalServerErrorException(
        "管理者更新中にエラーが発生しました",
      );
    }
  }

  async deleteAdministrator(id: number, currentUserId: number) {
    try {
      if (id === currentUserId) {
        throw new ForbiddenException("自分自身を削除することはできません");
      }

      // 管理者の存在確認
      await prisma.user.findUniqueOrThrow({
        where: {
          id,
          role: Role.ADMINISTRATOR,
        },
      });

      const adminCount = await prisma.user.count({
        where: { role: Role.ADMINISTRATOR },
      });

      if (adminCount <= 1) {
        throw new ForbiddenException("最後の管理者を削除することはできません");
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.delete({ where: { id } });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException(`ID:${id}の管理者が見つかりません`);
        }
      }
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      logger.error(
        `管理者削除中にエラーが発生しました: ${error.message}`,
        error.stack,
        this.serviceName,
      );
      throw new InternalServerErrorException(
        "管理者削除中にエラーが発生しました",
      );
    }
  }

  // ----- 開発者関連 -----

  async findDeveloperList(query?: FindDeveloperListQueryDto) {
    const pagination = getPaginationParams(query);

    const where: Prisma.UserWhereInput = {
      role: Role.DEVELOPER,
      ...(query?.status && { status: query.status }),
    };

    // 検索条件を構築
    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: "insensitive" } },
        { email: { contains: pagination.search, mode: "insensitive" } },
        { developerName: { contains: pagination.search, mode: "insensitive" } },
      ];
    }

    try {
      const [data, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            developerName: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { [pagination.sortBy]: pagination.sortOrder },
        }),
        prisma.user.count({ where }),
      ]);

      return createPaginatedResponse(
        data,
        total,
        pagination.page,
        pagination.limit,
      );
    } catch (error) {
      logger.error(
        `開発者リスト取得中にエラーが発生しました: ${error.message}`,
        error.stack,
        this.serviceName,
      );
      throw new InternalServerErrorException(
        "データ取得中にエラーが発生しました",
      );
    }
  }

  async findDeveloperById(id: number) {
    try {
      const developer = await prisma.user.findUniqueOrThrow({
        where: {
          id,
          role: Role.DEVELOPER,
        },
        select: {
          id: true,
          email: true,
          name: true,
          developerName: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return developer;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException(`ID:${id}の開発者が見つかりません`);
        }
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error(
        `開発者取得中にエラーが発生しました: ${error.message}`,
        error.stack,
        this.serviceName,
      );
      throw new InternalServerErrorException(
        "開発者情報取得中にエラーが発生しました",
      );
    }
  }

  async updateDeveloperStatus(id: number, dto: UpdateDeveloperStatusDto) {
    try {
      // 開発者の存在確認
      await prisma.user.findUniqueOrThrow({
        where: {
          id,
          role: Role.DEVELOPER,
        },
      });

      await prisma.$transaction(async (tx) => {
        return tx.user.update({
          where: { id },
          data: { status: dto.status },
          select: {
            id: true,
            email: true,
            name: true,
            developerName: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException(`ID:${id}の開発者が見つかりません`);
        }
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error(
        `開発者ステータス更新中にエラーが発生しました: ${error.message}`,
        error.stack,
        this.serviceName,
      );
      throw new InternalServerErrorException(
        "開発者ステータス更新中にエラーが発生しました",
      );
    }
  }

  // ----- 一般ユーザー関連 -----

  async findUserList(query?: FindUserListQueryDto) {
    const pagination = getPaginationParams(query);

    const where: Prisma.UserWhereInput = {
      role: Role.USER,
      ...(query?.status && { status: query.status }),
    };

    // 検索条件を構築
    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: "insensitive" } },
        { email: { contains: pagination.search, mode: "insensitive" } },
      ];
    }

    try {
      const [data, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { [pagination.sortBy]: pagination.sortOrder },
        }),
        prisma.user.count({ where }),
      ]);

      return createPaginatedResponse(
        data,
        total,
        pagination.page,
        pagination.limit,
      );
    } catch (error) {
      logger.error(
        `ユーザーリスト取得中にエラーが発生しました: ${error.message}`,
        error.stack,
        this.serviceName,
      );
      throw new InternalServerErrorException(
        "データ取得中にエラーが発生しました",
      );
    }
  }

  async findUserById(id: number) {
    try {
      const user = await prisma.user.findUniqueOrThrow({
        where: {
          id,
          role: Role.USER,
        },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException(`ID:${id}のユーザーが見つかりません`);
        }
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error(
        `ユーザー取得中にエラーが発生しました: ${error.message}`,
        error.stack,
        this.serviceName,
      );
      throw new InternalServerErrorException(
        "ユーザー情報取得中にエラーが発生しました",
      );
    }
  }

  async updateUserStatus(id: number, dto: UpdateUserStatusDto) {
    try {
      // ユーザーの存在確認
      await prisma.user.findUniqueOrThrow({
        where: {
          id,
          role: Role.USER,
        },
      });

      await prisma.$transaction(async (tx) => {
        return tx.user.update({
          where: { id },
          data: { status: dto.status },
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException(`ID:${id}のユーザーが見つかりません`);
        }
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error(
        `ユーザーステータス更新中にエラーが発生しました: ${error.message}`,
        error.stack,
        this.serviceName,
      );
      throw new InternalServerErrorException(
        "ユーザーステータス更新中にエラーが発生しました",
      );
    }
  }
}
