import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class QueryRankDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 20;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  neighborCount?: number = 5;
}
