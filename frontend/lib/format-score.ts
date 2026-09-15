/** Gérant(e) scores are always whole numbers (a sum); Vendeur(se) scores are an average and can
 * repeat forever (e.g. 11/3). Round only when needed so "10" stays "10" but "3.6666..." becomes
 * "3.67". */
export function formaterScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—';
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}
