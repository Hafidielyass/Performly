/** Evaluation periods are monthly ("2026-09"), matching the monthly dashboard view. */
export function periodeCourante(date = new Date()): string {
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${mois}`;
}

const MOIS_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

/** Renders a period string for display: "2026-09" -> "Septembre 2026". Falls back to the raw
 * value for older non-monthly periods (e.g. "2026-T3") so historical data still reads fine. */
export function formaterPeriode(periode: string): string {
  const match = periode.match(/^(\d{4})-(\d{2})$/);
  if (!match) return periode;
  const [, annee, mois] = match;
  const index = Number(mois) - 1;
  if (index < 0 || index > 11) return periode;
  return `${MOIS_LABELS[index]} ${annee}`;
}
