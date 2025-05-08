// ページネーション結果の型
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

// ページネーションパラメータ
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 検索パラメータ
export interface SearchParams {
  search?: string;
}

// ソートパラメータ
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 基本パラメータ (ページネーション、検索、ソート)
export interface BaseParams extends PaginationParams, SearchParams, SortParams {} 
