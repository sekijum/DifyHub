/**
 * ユーザーステータスの列挙型
 * Prismaの`UserStatus`列挙型と一致させる
 */
export const UserStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type UserStatusType = typeof UserStatus[keyof typeof UserStatus]; 
