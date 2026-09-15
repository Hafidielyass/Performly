import { IsString, MinLength } from 'class-validator';

export class CreateBoutiqueDto {
  @IsString()
  @MinLength(1)
  nom: string;
}
