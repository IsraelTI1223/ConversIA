import { IsString, MaxLength, MinLength } from 'class-validator';

export class TranslateTextDto {
  @IsString()
  @MinLength(1, { message: 'Text cannot be empty' })
  @MaxLength(5000, { message: 'Text exceeds maximum length of 5000 characters' })
  text: string;
}
