import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/types';

/**
 * For routes shaped as /boutiques/:boutiqueId/... . GERANT users may only ever hit
 * their own boutiqueId; ADMIN_RH/DIRECTEUR_REGIONAL (boutiqueId === null on the JWT)
 * pass through to every boutique. For nested resources reached by their own id
 * (e.g. PATCH /personnes/:id), this guard cannot help - those services call
 * assertBoutiqueAccess() directly after loading the entity.
 */
@Injectable()
export class BoutiqueScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    const targetBoutiqueId: string | undefined = request.params?.boutiqueId;

    if (!user || !targetBoutiqueId) return true;
    if (user.boutiqueId === null) return true;
    if (user.boutiqueId !== targetBoutiqueId) {
      throw new ForbiddenException('Accès refusé à cette boutique.');
    }
    return true;
  }
}
