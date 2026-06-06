export type ApiOk<T> = {ok: true; data: T};

export type ApiErr = {ok: false; code: string; message?: string};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages?: number;
}

export * from './banner';
export * from './notification';