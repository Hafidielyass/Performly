import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreateGrillePosteDto {
  @IsString()
  @MinLength(1)
  nomPoste: string;

  @IsInt()
  @Min(0)
  effectifMin: number;

  @IsInt()
  @Min(0)
  effectifMax: number;

  @IsNumber()
  @Min(0)
  salaireNetMoyen: number;

  @IsString()
  niveauEtudes: string;

  @IsString()
  experienceRequise: string;

  @IsString()
  competencesCles: string;

  @IsString()
  missionClientDediee: string;
}

export class UpdateGrillePosteDto extends PartialType(CreateGrillePosteDto) {}
