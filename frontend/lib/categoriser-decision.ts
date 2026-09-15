import { CategorieDecision } from './types';

/**
 * Mirrors the backend's categoriserDecision (backend/src/scoring/scoring.ts) so the
 * evaluation form can color its badge before a dashboard-style enriched response is
 * available. Kept as simple substring checks on purpose - same source strings.
 */
export function categoriserDecision(decisionRh: string): CategorieDecision {
  if (decisionRh.includes('REMPLACER')) return 'danger';
  if (decisionRh.includes('Revue de')) return 'warning';
  if (decisionRh.startsWith('MAINTENIR')) return 'success';
  return 'neutral';
}
