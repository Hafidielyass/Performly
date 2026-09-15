import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

class ScoreCritereItemDto {
  @IsString()
  critereId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  score?: number | null;

  @IsOptional()
  @IsString()
  commentaire?: string | null;
}

export class UpsertScoresDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ScoreCritereItemDto)
  scores: ScoreCritereItemDto[];
}
