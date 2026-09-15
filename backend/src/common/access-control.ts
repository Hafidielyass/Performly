import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types';

/**
 * A GERANT may only touch data belonging to their own boutique. ADMIN_RH and
 * DIRECTEUR_REGIONAL have a null boutiqueId on their user record, meaning
 * cross-boutique access - they always pass. Call this from services (not just
 * guards) whenever a mutation/read resolves a target boutiqueId from a nested
 * resource (e.g. an evaluation id), so scope is enforced regardless of route shape.
 *
 * Must throw (403), never silently filter to empty - a GERANT probing another
 * boutique's id should see an explicit refusal, not an empty result that could
 * be mistaken for "this boutique has no data".
 */
export function assertBoutiqueAccess(user: AuthenticatedUser, targetBoutiqueId: string): void {
  if (user.boutiqueId === null) return;
  if (user.boutiqueId !== targetBoutiqueId) {
    throw new ForbiddenException("Accès refusé à cette boutique.");
  }
}

export function isMultiBoutiqueRole(user: AuthenticatedUser): boolean {
  return user.boutiqueId === null;
}
