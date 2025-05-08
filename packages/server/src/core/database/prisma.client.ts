import { PrismaClient } from "@prisma/client";

// グローバル変数としてPrismaClientインスタンスを保持
// 開発環境ではホットリロード時に複数のインスタンスが生成されるのを防ぐ
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 既存のインスタンスがあればそれを利用、なければ新しく作成
const prisma = globalForPrisma.prisma || new PrismaClient();

// 開発環境の場合はグローバル変数にインスタンスを保存
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
