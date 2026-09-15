import { RoleUtilisateur } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  motDePasse: string;

  @IsEnum(RoleUtilisateur)
  role: RoleUtilisateur;

  @ValidateIf((o) => o.role === RoleUtilisateur.GERANT)
  @IsString()
  boutiqueId?: string | null;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
