import { PartialType } from '@nestjs/mapped-types';
import { ProfilEvaluation } from '@prisma/client';
import { IsEnum, IsInt, IsNumber, IsString, MinLength } from 'class-validator';

export class CreateBaremeDto {
  @IsEnum(ProfilEvaluation)
  typeProfil: ProfilEvaluation;

  @IsNumber()
  borneMin: number;

  @IsNumber()
  borneMax: number;

  @IsString()
  @MinLength(1)
  decisionRh: string;

  @IsInt()
  ordre: number;
}

export class UpdateBaremeDto extends PartialType(CreateBaremeDto) {}
