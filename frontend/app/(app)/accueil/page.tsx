'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertOctagon, CheckCircle2, Store, Users2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { DashboardConsolideLigne } from '@/lib/types';
import { KpiTile } from '@/components/ui/kpi-tile';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { RepartitionDonut } from '@/components/charts/repartition-donut';
import { PeriodeSelect } from '@/components/dashboard/periode-select';

export default function AccueilPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [periode, setPeriode] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (user?.role === 'GERANT' && user.boutiqueId) {
      router.replace(`/boutiques/${user.boutiqueId}/tableau-de-bord`);
    }
  }, [user, router]);

  const { data: periodes } = useQuery({
    queryKey: ['dashboard-periodes-reseau'],
    queryFn: () => api.get<string[]>('/dashboard/periodes'),
    enabled: user?.role !== 'GERANT',
  });

  useEffect(() => {
    if (periode === undefined && periodes && periodes.length > 0) setPeriode(periodes[0]);
  }, [periodes, periode]);

  const { data } = useQuery({
    queryKey: ['dashboard-consolide', periode],
    queryFn: () =>
      api.get<DashboardConsolideLigne[]>(`/dashboard/consolide${periode ? `?periode=${encodeURIComponent(periode)}` : ''}`),
    enabled: user?.role !== 'GERANT',
  });

  const totalEffectif = data?.reduce((acc, b) => acc + b.effectifTotal, 0) ?? 0;
  const totalDanger = data?.reduce((acc, b) => acc + b.repartition.danger, 0) ?? 0;
  const totalWarning = data?.reduce((acc, b) => acc + b.repartition.warning, 0) ?? 0;
  const totalSuccess = data?.reduce((acc, b) => acc + b.repartition.success, 0) ?? 0;
  const totalNeutre = data?.reduce((acc, b) => acc + b.repartition.neutral, 0) ?? 0;

  const classement = useMemo(
    () =>
      [...(data ?? [])]
        .sort((a, b) => b.repartition.success - b.repartition.danger - (a.repartition.success - a.repartition.danger))
        .map((b) => ({ nom: b.nom, Performants: b.repartition.success, 'À remplacer': b.repartition.danger })),
    [data],
  );

  if (user?.role === 'GERANT') return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 text-text-primary">Vue d&apos;ensemble</h1>
        <PeriodeSelect periodes={periodes} value={periode} onChange={setPeriode} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile title="Boutiques" value={data?.length ?? '—'} icon={Store} />
        <KpiTile title="Effectif total" value={totalEffectif} icon={Users2} />
        <KpiTile title="Performances confirmées" value={totalSuccess} tone="success" icon={CheckCircle2} />
        <KpiTile title="À surveiller / remplacer" value={totalWarning + totalDanger} tone="danger" icon={AlertOctagon} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-72 rounded-lg border border-border bg-bg-surface p-4">
          <p className="mb-2 text-label text-text-muted">Répartition réseau</p>
          <div className="h-56">
            <RepartitionDonut
              repartition={{ success: totalSuccess, warning: totalWarning, danger: totalDanger, neutral: totalNeutre }}
            />
          </div>
        </div>

        <div className="h-72 rounded-lg border border-border bg-bg-surface p-4 lg:col-span-2">
          <p className="mb-2 text-label text-text-muted">Performants vs à remplacer, par boutique</p>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={classement}>
              <XAxis dataKey="nom" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} domain={[0, 'auto']} />
              <Tooltip />
              <Bar dataKey="Performants" fill="var(--success)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="À remplacer" fill="var(--danger)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Boutique</TableHead>
              <TableHead>Effectif</TableHead>
              <TableHead>Performants</TableHead>
              <TableHead>À revoir</TableHead>
              <TableHead>À remplacer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((b) => (
              <TableRow key={b.boutiqueId}>
                <TableCell>
                  <Link
                    href={`/boutiques/${b.boutiqueId}/tableau-de-bord`}
                    className="inline-flex items-center gap-2 text-brand-primary hover:underline"
                  >
                    <Store className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {b.nom}
                  </Link>
                </TableCell>
                <TableCell>{b.effectifTotal}</TableCell>
                <TableCell className="text-success">{b.repartition.success}</TableCell>
                <TableCell className="text-warning">{b.repartition.warning}</TableCell>
                <TableCell className="text-danger">{b.repartition.danger}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
