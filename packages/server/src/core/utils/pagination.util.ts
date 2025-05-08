import { PaginatedResponse } from "@/core/types/api-response.type";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

/**
 * ページネーションパラメータを抽出するユーティリティ
 */
export const getPaginationParams = (query: any = {}) => {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    search = "",
    sortBy = "id",
    sortOrder = "desc",
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  return {
    skip,
    take,
    search,
    sortBy,
    sortOrder,
    page: Number(page),
    limit: Number(limit),
  };
};

/**
 * ページネーションレスポンスを生成する
 */
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> => {
  return {
    data,
    meta: {
      total,
      page,
      limit,
    },
  };
};
