/**
 * API共通レスポンス型定義
 */

// 標準APIレスポンス型
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  errors?: { message: string; code: string }[];
}

/**
 * ページネーション情報のメタデータ
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

/**
 * ページネーションレスポンスの共通型
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * ページネーション処理を行うユーティリティ関数
 * @param data 処理対象のデータ配列
 * @param total 総件数
 * @param page 現在のページ
 * @param limit 1ページあたりの件数
 * @returns ページネーション済みのAPIレスポンス
 */
export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): ApiResponse<T[]> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
    },
  };
}
