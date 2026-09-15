import { RoleUtilisateur } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: RoleUtilisateur;
  boutiqueId: string | null;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: RoleUtilisateur;
  boutiqueId: string | null;
}
