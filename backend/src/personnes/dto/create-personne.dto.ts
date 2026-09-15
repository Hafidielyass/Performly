import { Poste, TypeContrat } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreatePersonneDto {
  @IsString()
  @MinLength(1)
  nomComplet: string;

  @IsEnum(Poste)
  poste: Poste;

  @IsEnum(TypeContrat)
  typeContrat: TypeContrat;

  @IsNumber()
  @Min(0)
  ancienneteAnnees: number;

  @IsNumber()
  @Min(0)
  salaireNet: number;

  @IsOptional()
  actif?: boolean;
}
