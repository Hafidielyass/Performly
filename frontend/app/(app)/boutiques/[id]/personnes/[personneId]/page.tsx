'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '@/lib/api-client';
import { formaterPeriode } from '@/lib/periode';
import { formaterScore } from '@/lib/format-score';
import { HistoriquePersonne, StatutEvaluation } from '@/lib/types';
import { POSTE_ICONS, POSTE_LABELS } from '@/lib/poste-labels';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { RecommendationBadge } from '@/components/evaluations/recommendation-badge';
import { CritereHeatmap } from '@/components/personnes/critere-heatmap';

const STATUT_LABELS: Record<StatutEvaluation, string> = {
  BROUILLON: 'Brouillon',
  SOUMISE: 'Soumise',
  VALIDEE: 'Validée',
};

export default function PersonneDetailPage() {
  const params = useParams<{ id: string; personneId: string }>();

  const { data } = useQuery({
    queryKey: ['personne-historique', params.personneId],
    queryFn: () => api.get<HistoriquePersonne>(`/personnes/${params.personneId}/historique`),
  });

  const donneesGraphique = useMemo(
    () =>
      data?.evaluations.map((e) => ({
        periode: formaterPeriode(e.periode),
        score: e.scoreTotal,
      })) ?? [],
    [data],
  );

  if (!data) return <p className="text-body text-text-muted">Chargement...</p>;

  const { personne, profil, scoreMax, evaluations } = data;
  const Icon = POSTE_ICONS[personne.poste];
  const derniereEvaluation = evaluations[evaluations.length - 1];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/boutiques/${params.id}/effectif`}
        className="flex w-fit items-center gap-1.5 text-small text-text-muted hover:text-brand-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Retour à l&apos;effectif
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-bg-surface p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand-primary">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <p className="text-h2 text-text-primary">{personne.nomComplet}</p>
            <div className="flex divide-x divide-border text-small text-text-muted">
              <span className="pr-2">{POSTE_LABELS[personne.poste]}</span>
              <span className="px-2">{personne.typeContrat}</span>
              <span className="pl-2">{Number(personne.ancienneteAnnees).toFixed(1)} an(s) d&apos;ancienneté</span>
            </div>
          </div>
        </div>
        {derniereEvaluation && (
          <div className="flex items-center gap-3">
            <span className="text-label text-text-muted">
              Dernier score : {formaterScore(derniereEvaluation.scoreTotal)}
              {scoreMax ? ` / ${scoreMax}` : ''}
            </span>
            <RecommendationBadge
              decisionRh={derniereEvaluation.decisionRh}
              categorie={derniereEvaluation.categorieDecision}
            />
          </div>
        )}
      </div>

      {!profil ? (
        <p className="text-body text-text-muted">Ce poste n&apos;a pas de grille d&apos;évaluation.</p>
      ) : evaluations.length === 0 ? (
        <p className="text-body text-text-muted">Aucune évaluation enregistrée pour le moment.</p>
      ) : (
        <>
          <div className="h-72 rounded-lg border border-border bg-bg-surface p-4">
            <p className="mb-2 text-label text-text-muted">Évolution du score</p>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={donneesGraphique}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="periode" stroke="var(--text-muted)" fontSize={12} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={12}
                  domain={[0, scoreMax ?? 'auto']}
                  allowDecimals={false}
                />
                <Tooltip formatter={(value) => formaterScore(typeof value === 'number' ? value : null)} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--brand-primary)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--brand-primary)' }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-label text-text-muted">Détail par critère et par mois</p>
            <CritereHeatmap evaluations={evaluations} />
          </div>

          <div className="rounded-lg border border-border bg-bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Décision RH</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...evaluations].reverse().map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formaterPeriode(e.periode)}</TableCell>
                    <TableCell>{STATUT_LABELS[e.statut]}</TableCell>
                    <TableCell>
                      {formaterScore(e.scoreTotal)}
                      {scoreMax ? ` / ${scoreMax}` : ''}
                    </TableCell>
                    <TableCell>
                      <RecommendationBadge decisionRh={e.decisionRh} categorie={e.categorieDecision} />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/boutiques/${params.id}/evaluations/${params.personneId}?periode=${encodeURIComponent(e.periode)}`}
                        className="flex items-center justify-end gap-1 text-small text-brand-primary hover:underline"
                      >
                        Ouvrir
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
