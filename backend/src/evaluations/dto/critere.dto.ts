import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCritereDto {
  @IsString()
  @MinLength(1)
  categorieId: string;

  @IsString()
  @MinLength(1)
  libelle: string;

  @IsOptional()
  @IsInt()
  ordreAffichage?: number;
}

export class UpdateCritereDto extends PartialType(CreateCritereDto) {}
