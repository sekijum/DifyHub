// アプリ一覧の結果
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams {
  search?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BaseParams extends PaginationParams, SearchParams, SortParams {}

// app.tsの型を再エクスポート
export * from './app';
export * from './user';
export * from './common';
export * from './developer';
export * from './notification';
export * from './plan';
