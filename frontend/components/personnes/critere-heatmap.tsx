import { Fragment } from 'react';
import { EvaluationHistorique } from '@/lib/types';
import { formaterPeriode } from '@/lib/periode';

// Ordinal ramp (one hue, monotone lightness, light->dark) matching the app's brand green,
// validated with the dataviz skill's checker: light-end contrast, adjacent ΔL, single hue all pass.
const RAMP: Record<number, { bg: string; text: string }> = {
  1: { bg: '#79C0A1', text: '#1E2A24' },
  2: { bg: '#59AF89', text: '#1E2A24' },
  3: { bg: '#449271', text: '#FFFFFF' },
  4: { bg: '#347157', text: '#FFFFFF' },
  5: { bg: '#254F3D', text: '#FFFFFF' },
};

const LABELS: Record<number, string> = {
  1: 'Insuffisant',
  2: 'À améliorer',
  3: 'Correct',
  4: 'Bien',
  5: 'Excellent',
};

interface CritereHeatmapProps {
  evaluations: EvaluationHistorique[];
}

export function CritereHeatmap({ evaluations }: CritereHeatmapProps) {
  const criteresParId = new Map<string, { libelle: string; categorieNom: string; categorieOrdre: number; ordreAffichage: number }>();
  for (const evaluation of evaluations) {
    for (const c of evaluation.criteres) {
      if (!criteresParId.has(c.critereId)) {
        criteresParId.set(c.critereId, {
          libelle: c.libelle,
          categorieNom: c.categorieNom,
          categorieOrdre: c.categorieOrdre,
          ordreAffichage: c.ordreAffichage,
        });
      }
    }
  }
  const criteresTries = [...criteresParId.entries()].sort(
    ([, a], [, b]) => a.categorieOrdre - b.categorieOrdre || a.ordreAffichage - b.ordreAffichage,
  );

  if (criteresTries.length === 0 || evaluations.length === 0) {
    return <p className="text-body text-text-muted">Aucune évaluation à afficher.</p>;
  }

  let categoriePrecedente = '';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-small text-text-muted">Échelle :</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="flex items-center gap-1.5 text-small text-text-muted">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: RAMP[n].bg }} aria-hidden="true" />
            {n} ({LABELS[n]})
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-body">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-[220px] border-b border-r border-border bg-bg-surface p-2 text-left text-label text-text-muted">
                Critère
              </th>
              {evaluations.map((e) => (
                <th
                  key={e.id}
                  className="min-w-[84px] border-b border-border bg-bg-surface p-2 text-center text-label text-text-muted"
                >
                  {formaterPeriode(e.periode)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteresTries.map(([critereId, meta]) => {
              const nouvelleCategorie = meta.categorieNom !== categoriePrecedente;
              categoriePrecedente = meta.categorieNom;
              return (
                <Fragment key={critereId}>
                  {nouvelleCategorie && (
                    <tr key={`cat-${critereId}`}>
                      <td
                        colSpan={evaluations.length + 1}
                        className="border-b border-border bg-brand-tint px-2 py-1 text-small font-medium text-brand-primary"
                      >
                        {meta.categorieNom}
                      </td>
                    </tr>
                  )}
                  <tr key={critereId}>
                    <td className="sticky left-0 z-10 border-b border-r border-border bg-bg-surface p-2 text-body text-text-primary">
                      {meta.libelle}
                    </td>
                    {evaluations.map((e) => {
                      const score = e.criteres.find((c) => c.critereId === critereId)?.score ?? null;
                      return (
                        <td key={e.id} className="border-b border-border p-1 text-center">
                          {score !== null ? (
                            <span
                              className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-label font-medium"
                              style={{ backgroundColor: RAMP[score].bg, color: RAMP[score].text }}
                              title={`${LABELS[score]} (${score}/5)`}
                            >
                              {score}
                            </span>
                          ) : (
                            <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-md bg-bg-page text-label text-text-muted">
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
