import { PartialType } from '@nestjs/mapped-types';
import { ProfilEvaluation } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategorieDto {
  @IsString()
  @MinLength(1)
  nom: string;

  @IsEnum(ProfilEvaluation)
  applicableA: ProfilEvaluation;

  @IsOptional()
  @IsInt()
  ordreAffichage?: number;
}

export class UpdateCategorieDto extends PartialType(CreateCategorieDto) {}
