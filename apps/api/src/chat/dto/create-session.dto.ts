import { IsEnum, IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { CefrLevel, SessionMode } from '@prisma/client';

export class CreateSessionDto {
  @IsEnum(CefrLevel)
  cefrLevel: CefrLevel;

  @IsString()
  topic: string;

  @IsOptional()
  @IsEnum(SessionMode)
  mode?: SessionMode;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  durationMinutes?: number;
}
