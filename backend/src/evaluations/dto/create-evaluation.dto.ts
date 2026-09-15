import { IsString, MinLength } from 'class-validator';

export class CreateEvaluationDto {
  @IsString()
  @MinLength(1)
  personneId: string;

  @IsString()
  @MinLength(1)
  periode: string;
}
