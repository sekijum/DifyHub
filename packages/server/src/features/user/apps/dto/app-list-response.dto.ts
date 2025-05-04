import { AppDto } from './app.dto';

export class AppListResponseDto {
  data: AppDto[];
  total: number;

  constructor(data: AppDto[], total: number) {
    this.data = data;
    this.total = total;
  }
} 
