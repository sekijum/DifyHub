import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { User, Role, UserStatus, Prisma } from '@prisma/client'; // Prisma を追加
import { GetAdministratorsQueryDto } from './dto/get-administrators-query.dto'; // DTO をインポート
import { CreateAdministratorDto } from './dto/create-administrator.dto';
import { UpdateAdministratorDto } from './dto/update-administrator.dto';
import { GetDevelopersQueryDto } from './dto/get-developers-query.dto';
import { UpdateDeveloperStatusDto } from './dto/update-developer-status.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // パスワードハッシュ化のソルトラウンド数

// Prisma.validator を使用して選択されるフィールドの型を定義
const administratorDataSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  name: true,
  status: true,
  createdAt: true,
});

// Developer 用のデータ選択
const developerDataSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  name: true,
  status: true,
  planName: true, // プラン名を追加
  createdAt: true,
  _count: { // 関連カウントを追加
    select: {
      createdApps: true, // 作成したアプリ数を取得
    },
  },
  developerName: true, // 開発者名も追加（必要に応じて）
  avatarUrl: true, // アバターURLも追加（必要に応じて）
  bio: true, // 自己紹介も追加（必要に応じて）
});

// User 用のデータ選択
const userDataSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  name: true,
  status: true,
  planName: true, // プラン名を追加
  createdAt: true,
  avatarUrl: true, // アバターURLも追加（必要に応じて）
});

// Prisma.UserGetPayload を使用して select に基づく型を生成
export type AdministratorData = Prisma.UserGetPayload<{ select: typeof administratorDataSelect }>;
export type DeveloperData = Prisma.UserGetPayload<{ select: typeof developerDataSelect }>;
export type UserData = Prisma.UserGetPayload<{ select: typeof userDataSelect }>;

// Paginated result types
export interface PaginatedAdministratorsResult {
  data: AdministratorData[];
  total: number;
}
export interface PaginatedDevelopersResult {
  data: DeveloperData[];
  total: number;
}
export interface PaginatedUsersResult {
  data: UserData[];
  total: number;
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * ADMINISTRATOR ロールを持つユーザーの一覧を、ページネーションとフィルタリング付きで取得します。
   * @param query クエリパラメータ (ページネーション、フィルター)
   * @returns 管理者ユーザーの配列と総件数
   */
  async findAdministrators(query?: GetAdministratorsQueryDto): Promise<PaginatedAdministratorsResult> {
    // queryが未定義の場合は空オブジェクトを使用
    const safeQuery = query || {};
    
    // デフォルト値を適用
    const page = safeQuery.page ?? 1;
    const limit = safeQuery.limit ?? 10;
    const status = safeQuery.status;
    const search = safeQuery.search;
    const sortBy = safeQuery.sortBy ?? 'createdAt';
    const sortOrder = safeQuery.sortOrder ?? 'desc';
    
    const skip = (page - 1) * limit;

    // where 条件を構築
    const where: Prisma.UserWhereInput = {
      role: Role.ADMINISTRATOR, // 管理者ロールは必須
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // orderBy オブジェクトを構築
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    try {
      // データを取得
      const [administrators, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          select: administratorDataSelect, // 定義した select を使用
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        data: administrators,
        total,
      };
    } catch (error) {
      console.error('Error in findAdministrators:', error);
      // エラーが発生した場合は空の結果を返す
      return {
        data: [],
        total: 0,
      };
    }
  }

  async createAdministrator(dto: CreateAdministratorDto): Promise<AdministratorData> {
    const { email, name, password } = dto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const newUser = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: Role.ADMINISTRATOR,
        // status: UserStatus.ACTIVE, // 必要に応じてデフォルトステータスを設定
      },
      select: administratorDataSelect, // Return selected fields
    });

    return newUser;
  }

  async updateAdministrator(id: number, dto: UpdateAdministratorDto): Promise<AdministratorData> {
    const { name, email, password } = dto;

    // Find the administrator
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.role !== Role.ADMINISTRATOR) {
      throw new NotFoundException(`Administrator with ID ${id} not found`);
    }

    const dataToUpdate: Prisma.UserUpdateInput = {};

    if (name) {
      dataToUpdate.name = name;
    }

    if (email) {
      // Check if new email already exists (excluding current user)
      const existingUser = await this.prisma.user.findUnique({
        where: { email, NOT: { id } },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
      dataToUpdate.email = email;
    }

    if (password) {
      // Hash new password
      dataToUpdate.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    if (Object.keys(dataToUpdate).length === 0) {
        // If no fields to update, return current data or throw an error
        // Returning current data might be misleading, so throwing an error is clearer
        throw new BadRequestException('No fields to update provided');
        // Or return the user directly (after selecting fields):
        // return await this.prisma.user.findUnique({ where: { id }, select: administratorDataSelect });
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: administratorDataSelect,
    });

    return updatedUser;
  }

  async deleteAdministrator(id: number, currentUserId: number): Promise<void> {
    // --- Prevent deleting oneself --- //
    if (id === currentUserId) {
      throw new ForbiddenException('Cannot delete your own administrator account');
    }

    // Find the administrator to delete
    const userToDelete = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!userToDelete || userToDelete.role !== Role.ADMINISTRATOR) {
      throw new NotFoundException(`Administrator with ID ${id} not found`);
    }

    // --- Prevent deleting the last administrator --- //
    const adminCount = await this.prisma.user.count({
      where: { role: Role.ADMINISTRATOR },
    });

    if (adminCount <= 1) {
      throw new ForbiddenException('Cannot delete the last administrator');
    }

    // Delete user
    await this.prisma.user.delete({
      where: { id },
    });
  }

  // --- Developers --- //

  // findAdministrators とほぼ同じだが、role を DEVELOPER でフィルタリング
  async findDevelopers(query?: GetDevelopersQueryDto): Promise<PaginatedDevelopersResult> {
    // queryが未定義の場合は空オブジェクトを使用
    const safeQuery = query || {};
    
    // デフォルト値を適用
    const page = safeQuery.page ?? 1;
    const limit = safeQuery.limit ?? 10;
    const status = safeQuery.status;
    const search = safeQuery.search;
    const sortBy = safeQuery.sortBy ?? 'createdAt';
    const sortOrder = safeQuery.sortOrder ?? 'desc';
    
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: Role.DEVELOPER, // ロールを DEVELOPER に変更
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { developerName: { contains: search, mode: 'insensitive' } }, // developerName も検索対象に追加
      ];
    }

    // orderBy オブジェクトを構築
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    try {
      const [developers, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          select: developerDataSelect, // Developer 用の select を使用
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.user.count({ where }),
      ]);

      // 戻り値の型に合わせて返す
      return {
        data: developers,
        total,
      };
    } catch (error) {
      console.error('Error in findDevelopers:', error);
      // エラーが発生した場合は空の結果を返す
      return {
        data: [],
        total: 0,
      };
    }
  }

  // 開発者のステータスを更新するメソッド
  async updateDeveloperStatus(id: number, dto: UpdateDeveloperStatusDto): Promise<DeveloperData> {
    const { status } = dto;

    // Find the developer
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    // ユーザーが存在し、かつ DEVELOPER ロールであることを確認
    if (!user || user.role !== Role.DEVELOPER) {
      throw new NotFoundException(`Developer with ID ${id} not found`);
    }

    // Update status
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status },
      select: developerDataSelect, // Developer 用の select を使用
    });

    return updatedUser;
  }

  // --- Regular Users --- //

  async findUsers(query?: GetUsersQueryDto): Promise<PaginatedUsersResult> {
    // queryが未定義の場合は空オブジェクトを使用
    const safeQuery = query || {};
    
    // デフォルト値を適用
    const page = safeQuery.page ?? 1;
    const limit = safeQuery.limit ?? 10;
    const status = safeQuery.status;
    const search = safeQuery.search;
    const sortBy = safeQuery.sortBy ?? 'createdAt';
    const sortOrder = safeQuery.sortOrder ?? 'desc';
    
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: Role.USER,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // orderBy オブジェクトを構築
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    try {
      const [users, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          select: userDataSelect,
          skip,
          take: limit,
          orderBy: orderBy,
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        data: users,
        total,
      };
    } catch (error) {
      console.error('Error in findUsers:', error);
      // エラーが発生した場合は空の結果を返す
      return {
        data: [],
        total: 0,
      };
    }
  }

  // 一般ユーザーのステータスを更新するメソッド
  async updateUserStatus(id: number, dto: UpdateUserStatusDto): Promise<UserData> {
    const { status } = dto;

    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    // ユーザーが存在し、かつ USER ロールであることを確認
    if (!user || user.role !== Role.USER) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Update status
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status },
      select: userDataSelect, // User 用の select を使用
    });

    return updatedUser;
  }

  // ユーザーIDから詳細情報を取得するメソッド
  async findUserById(id: number): Promise<UserData> {
    // ユーザーを検索（ロールがUSERのもののみ）
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.USER
      },
      select: userDataSelect
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  // 管理者IDから詳細情報を取得するメソッド
  async findAdministratorById(id: number): Promise<AdministratorData> {
    // 管理者を検索（ロールがADMINISTRATORのもののみ）
    const administrator = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.ADMINISTRATOR
      },
      select: administratorDataSelect
    });

    if (!administrator) {
      throw new NotFoundException(`Administrator with ID ${id} not found`);
    }

    return administrator;
  }

  // 開発者IDから詳細情報を取得するメソッド
  async findDeveloperById(id: number): Promise<DeveloperData> {
    // 開発者を検索（ロールがDEVELOPERのもののみ）
    const developer = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.DEVELOPER
      },
      select: developerDataSelect
    });

    if (!developer) {
      throw new NotFoundException(`Developer with ID ${id} not found`);
    }

    return developer;
  }

  // 他の管理者向けユーザー操作メソッド (作成、更新、削除など) をここに追加できます
}
