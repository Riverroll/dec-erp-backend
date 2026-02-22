export class MetaDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class StatusDto {
  code: number;
  detail: string;
}

export class BaseResponseDto<T = any> {
  status: StatusDto;
  message: string;
  timestamp: string;
  request?: { method: string; url: string };
  data: T;
  meta?: MetaDto;
}
