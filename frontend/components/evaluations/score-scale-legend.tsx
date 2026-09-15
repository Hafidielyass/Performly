const ECHELLE = [
  { valeur: 1, label: 'Insuffisant' },
  { valeur: 2, label: 'À améliorer' },
  { valeur: 3, label: 'Correct' },
  { valeur: 4, label: 'Bien' },
  { valeur: 5, label: 'Excellent' },
];

export function ScoreScaleLegend() {
  return (
    <div className="flex flex-wrap gap-3">
      {ECHELLE.map((item) => (
        <span key={item.valeur} className="flex items-center gap-1.5 text-small text-text-muted">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-tint text-small font-medium text-brand-primary">
            {item.valeur}
          </span>
          {item.label}
        </span>
      ))}
    </div>
  );
}
