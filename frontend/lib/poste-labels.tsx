import { Car, Crown, LucideIcon, ParkingCircle, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { Poste } from './types';

export const POSTE_LABELS: Record<Poste, string> = {
  GERANT: 'Gérant(e)',
  ADJOINT: 'Adjoint(e)',
  VENDEUR: 'Vendeur(se)',
  FEMME_MENAGE: 'Femme de Ménage',
  VOITURIER: 'Voiturier',
  CHAUFFEUR: 'Chauffeur',
};

export const POSTE_ICONS: Record<Poste, LucideIcon> = {
  GERANT: Crown,
  ADJOINT: ShieldCheck,
  VENDEUR: ShoppingBag,
  FEMME_MENAGE: Sparkles,
  VOITURIER: ParkingCircle,
  CHAUFFEUR: Car,
};
