import { IsEnum, IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { CefrLevel } from '@prisma/client';

export class CreateSessionDto {
  @IsEnum(CefrLevel)
  cefrLevel: CefrLevel;

  @IsString()
  topic: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  durationMinutes?: number;
}
