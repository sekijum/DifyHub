/**
 * Prisma操作に関する共通ユーティリティ
 */
import { Prisma } from "@prisma/client";

/**
 * ID文字列または配列を数値配列に変換する
 * @param ids 変換する文字列または文字列配列
 * @returns 数値配列
 */
export function parseIds(
  ids: string | string[] | undefined,
): number[] | undefined {
  if (!ids) return undefined;
  const idArray = Array.isArray(ids) ? ids : [ids];
  return idArray.map((id) => parseInt(id, 10)).filter((num) => !isNaN(num));
}

/**
 * ソートパラメータからPrismaのOrderBy句を構築する
 * @param sortBy ソート対象のフィールド名
 * @param sortOrder ソート順（asc/desc）
 * @returns Prismaのソート句
 */
export function buildOrderBy(
  sortBy: string,
  sortOrder: "asc" | "desc",
): Prisma.AppOrderByWithRelationInput {
  return {
    [sortBy]: sortOrder,
  };
}

/**
 * 配列をシャッフルする（Fisher-Yatesアルゴリズム）
 * @param array シャッフル対象の配列
 * @returns シャッフルされた配列
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
