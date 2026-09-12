import { IsEnum } from 'class-validator';

enum SkillType {
  WRITING = 'WRITING',
  SPEAKING = 'SPEAKING',
  READING = 'READING',
  LISTENING = 'LISTENING',
}

enum CefrLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
}

export class CreatePracticeSessionDto {
  @IsEnum(SkillType, { message: 'skillType must be one of: WRITING, SPEAKING, READING, LISTENING' })
  skillType: SkillType;

  @IsEnum(CefrLevel, { message: 'cefrLevel must be one of: A1, A2, B1, B2, C1, C2' })
  cefrLevel: CefrLevel;
}
