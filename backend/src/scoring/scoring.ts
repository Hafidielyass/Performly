export type ProfilEvaluation = 'GERANT' | 'VENDEUR';

export interface BaremeRange {
  typeProfil: ProfilEvaluation;
  borneMin: number;
  borneMax: number;
  decisionRh: string;
}

/**
 * Gerant(e) score = SUM of all entered criteria scores. Never a percentage, never
 * divided by item count. Unscored criteria (null) are excluded, not treated as 0.
 */
export function calculerScoreGerant(scores: (number | null)[]): number | null {
  const notes = scores.filter((s): s is number => s !== null);
  if (notes.length === 0) return null;
  return notes.reduce((a, b) => a + b, 0);
}

/**
 * Vendeur(se) score = AVERAGE of entered criteria scores, out of 5.
 */
export function calculerScoreVendeur(scores: (number | null)[]): number | null {
  const notes = scores.filter((s): s is number => s !== null);
  if (notes.length === 0) return null;
  return notes.reduce((a, b) => a + b, 0) / notes.length;
}

/**
 * A null score must resolve to "Pas encore évalué(e)" - never fall through to the
 * lowest band, which would falsely imply poor performance instead of "not evaluated yet".
 */
export type CategorieDecision = 'success' | 'warning' | 'danger' | 'neutral';

/**
 * Maps a decision string to the semantic color family used across the UI
 * (§2 of the spec: success/warning/danger badges). Kept alongside the scoring
 * functions so the API and the seed data agree on one source of truth instead
 * of the frontend re-deriving it from substring checks of its own.
 */
export function categoriserDecision(decisionRh: string): CategorieDecision {
  if (decisionRh.includes('REMPLACER')) return 'danger';
  if (decisionRh.includes('Revue de')) return 'warning';
  if (decisionRh.startsWith('MAINTENIR')) return 'success';
  return 'neutral';
}

export function resoudreDecisionRH(
  score: number | null,
  typeProfil: ProfilEvaluation,
  baremes: BaremeRange[],
): string {
  if (score === null) return 'Pas encore évalué(e)';
  const bareme = baremes
    .filter((b) => b.typeProfil === typeProfil)
    .find((b) => score >= b.borneMin && score <= b.borneMax);
  return bareme?.decisionRh ?? 'Non classé';
}
