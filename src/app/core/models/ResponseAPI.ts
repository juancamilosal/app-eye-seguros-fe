export class ResponseAPI<T> {
  status: 'ERROR' | 'SUCCESS' | 'DISPONIBLE' | 'NO_DISPONIBLE' | 'EN_USO';
  code?: string;
  message: string;
  data: T;
  meta?: {
    total_count?: number;
    filter_count?: number;
    page?: number;
    limit?: number;
  };

}
