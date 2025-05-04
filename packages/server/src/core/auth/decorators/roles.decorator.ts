import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
/**
 * 許可するユーザーロールを指定するデコレータ。
 * 例: @Roles(Role.ADMINISTRATOR, Role.DEVELOPER)
 * @param roles 許可するロールの配列
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles); 
