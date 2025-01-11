import { IsString, IsNumber, Min } from 'class-validator';

export class UpdateScoreDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(0)
  score: number;
}
