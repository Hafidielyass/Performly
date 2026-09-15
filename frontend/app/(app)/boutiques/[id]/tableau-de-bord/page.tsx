'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Crown, Star, Users2, X, XCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import { formaterScore } from '@/lib/format-score';
import { CategorieDecision, DashboardBoutique } from '@/lib/types';
import { KpiTile } from '@/components/ui/kpi-tile';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { RecommendationBadge } from '@/components/evaluations/recommendation-badge';
import { RepartitionDonut } from '@/components/charts/repartition-donut';
import { PosteTag } from '@/components/evaluations/poste-tag';
import { PeriodeSelect } from '@/components/dashboard/periode-select';
import { ExportButtons } from '@/components/exports/export-buttons';

const STATUT_LABELS: Record<CategorieDecision, string> = {
  success: 'Performances confirmées',
  warning: 'Revue de performance',
  danger: 'À remplacer',
  neutral: 'Pas encore évalué(e)',
};

export default function TableauDeBordPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [periode, setPeriode] = useState<string | undefined>(undefined);

  const statutFiltre = searchParams.get('statut') as CategorieDecision | null;

  const { data: periodes } = useQuery({
    queryKey: ['dashboard-periodes', params.id],
    queryFn: () => api.get<string[]>(`/boutiques/${params.id}/dashboard/periodes`),
  });

  useEffect(() => {
    if (periode === undefined && periodes && periodes.length > 0) setPeriode(periodes[0]);
  }, [periodes, periode]);

  const { data } = useQuery({
    queryKey: ['dashboard', params.id, periode],
    queryFn: () =>
      api.get<DashboardBoutique>(
        `/boutiques/${params.id}/dashboard${periode ? `?periode=${encodeURIComponent(periode)}` : ''}`,
      ),
  });

  const moyennes = useMemo(() => {
    const gerants = data?.personnes.filter((p) => p.poste === 'GERANT' && p.scoreActuel !== null) ?? [];
    const vendeurs = data?.personnes.filter((p) => p.poste === 'VENDEUR' && p.scoreActuel !== null) ?? [];
    const moyenne = (list: typeof gerants) =>
      list.length ? list.reduce((acc, p) => acc + (p.scoreActuel ?? 0), 0) / list.length : null;
    return { gerant: moyenne(gerants), vendeur: moyenne(vendeurs) };
  }, [data]);

  function hrefPourStatut(statut: CategorieDecision): string {
    return statutFiltre === statut ? pathname : `${pathname}?statut=${statut}`;
  }

  const personnesAffichees = statutFiltre ? data?.personnes.filter((p) => p.categorie === statutFiltre) : data?.personnes;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end gap-3">
        <PeriodeSelect periodes={periodes} value={periode} onChange={setPeriode} />
        <ExportButtons
          className="flex items-center gap-1.5"
          xlsxPath={`/boutiques/${params.id}/export/xlsx?periode=${encodeURIComponent(periode ?? '')}`}
          pdfPath={`/boutiques/${params.id}/export/pdf?periode=${encodeURIComponent(periode ?? '')}`}
          fallbackName={`evaluations-${periode ?? ''}`}
          disabled={!periode}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile title="Effectif actif" value={data?.effectifTotal ?? '—'} icon={Users2} />
        <KpiTile
          title="Performances confirmées"
          value={data?.repartition.success ?? '—'}
          tone="success"
          icon={CheckCircle2}
          href={hrefPourStatut('success')}
          active={statutFiltre === 'success'}
        />
        <KpiTile
          title="Revue de performance"
          value={data?.repartition.warning ?? '—'}
          tone="warning"
          icon={AlertTriangle}
          href={hrefPourStatut('warning')}
          active={statutFiltre === 'warning'}
        />
        <KpiTile
          title="À remplacer"
          value={data?.repartition.danger ?? '—'}
          tone="danger"
          icon={XCircle}
          href={hrefPourStatut('danger')}
          active={statutFiltre === 'danger'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiTile
          title="Score moyen Gérant(e) (/145)"
          value={moyennes.gerant !== null ? moyennes.gerant.toFixed(1) : '—'}
          icon={Crown}
        />
        <KpiTile
          title="Score moyen Vendeur(se) (/5)"
          value={moyennes.vendeur !== null ? moyennes.vendeur.toFixed(2) : '—'}
          icon={Star}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-72 rounded-lg border border-border bg-bg-surface p-4 lg:col-span-1">
          <p className="mb-2 text-label text-text-muted">Répartition des recommandations</p>
          <div className="h-56">
            <RepartitionDonut repartition={data?.repartition ?? { success: 0, warning: 0, danger: 0, neutral: 0 }} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-bg-surface lg:col-span-2">
          {statutFiltre && (
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="text-small text-text-muted">
                Filtré : <span className="text-text-primary">{STATUT_LABELS[statutFiltre]}</span>
              </span>
              <Link href={pathname} scroll={false} className="flex items-center gap-1 text-small text-brand-primary hover:underline">
                <X className="h-3.5 w-3.5" strokeWidth={2} />
                Réinitialiser
              </Link>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Score actuel</TableHead>
                <TableHead>Recommandation RH</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personnesAffichees?.map((p) => (
                <TableRow key={p.personneId}>
                  <TableCell>
                    <Link
                      href={`/boutiques/${params.id}/personnes/${p.personneId}`}
                      className="text-brand-primary hover:underline"
                    >
                      {p.nomComplet}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <PosteTag poste={p.poste} />
                  </TableCell>
                  <TableCell>{formaterScore(p.scoreActuel)}</TableCell>
                  <TableCell>
                    <RecommendationBadge decisionRh={p.decisionRh} categorie={p.categorie} />
                  </TableCell>
                </TableRow>
              ))}
              {personnesAffichees?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-body text-text-muted">
                    Aucune personne dans cette catégorie.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
