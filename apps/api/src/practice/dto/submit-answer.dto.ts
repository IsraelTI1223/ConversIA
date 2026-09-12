import { IsString, MaxLength, MinLength } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @MinLength(1, { message: 'Answer cannot be empty' })
  @MaxLength(5000, { message: 'Answer exceeds maximum length' })
  answer: string;
}
