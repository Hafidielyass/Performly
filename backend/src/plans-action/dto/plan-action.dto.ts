import { PartialType } from '@nestjs/mapped-types';
import { StatutPlanAction } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePlanActionDto {
  @IsString()
  @MinLength(1)
  personneId: string;

  @IsString()
  @MinLength(1)
  evaluationId: string;

  @IsString()
  formationPrioritaire: string;

  @IsString()
  delaiRevue: string;

  @IsDateString()
  dateSuivi: string;

  @IsOptional()
  @IsString()
  decisionFinale?: string;
}

export class UpdatePlanActionDto extends PartialType(CreatePlanActionDto) {
  @IsOptional()
  @IsEnum(StatutPlanAction)
  statut?: StatutPlanAction;
}
