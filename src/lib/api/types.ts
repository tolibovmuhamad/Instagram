export interface ApiEnvelope<T> {
  data: T;
  errors: string[] | null;
  statusCode: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  totalRecords?: number;
}

export interface Paginated<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export class ApiError extends Error {
  status?: number;
  errors: string[];

  constructor(message: string, status?: number, errors: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}
