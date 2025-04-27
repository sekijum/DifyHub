import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // メールアドレスまたはユーザー名が既に存在するか確認
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          { username: createUserDto.username }
        ]
      }
    });

    if (existingUser) {
      throw new ConflictException(
        existingUser.email === createUserDto.email
          ? 'このメールアドレスは既に使用されています'
          : 'このユーザー名は既に使用されています'
      );
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // ユーザーの作成
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    // パスワードを除外して返却
    const { password, ...result } = user;
    return result;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        channel: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`ID: ${id} のユーザーは存在しません`);
    }

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    // ユーザーが存在するか確認
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`ID: ${id} のユーザーは存在しません`);
    }

    // メールアドレスやユーザー名が変更される場合、重複確認
    if (updateUserDto.email || updateUserDto.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            updateUserDto.email ? { email: updateUserDto.email } : null,
            updateUserDto.username ? { username: updateUserDto.username } : null,
          ].filter(Boolean),
          NOT: { id },
        },
      });

      if (existingUser) {
        throw new ConflictException(
          existingUser.email === updateUserDto.email
            ? 'このメールアドレスは既に使用されています'
            : 'このユーザー名は既に使用されています'
        );
      }
    }

    // パスワードが更新される場合、ハッシュ化
    let data = { ...updateUserDto };
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // ユーザーの更新
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async remove(id: number) {
    // ユーザーが存在するか確認
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`ID: ${id} のユーザーは存在しません`);
    }

    // ユーザーの削除
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: `ID: ${id} のユーザーを削除しました` };
  }
} 
