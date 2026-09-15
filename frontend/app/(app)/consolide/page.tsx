'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, CheckCircle2, Download, Store, Users2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { DashboardConsolideLigne } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { KpiTile } from '@/components/ui/kpi-tile';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PeriodeSelect } from '@/components/dashboard/periode-select';

export default function ConsolidePage() {
  const [periode, setPeriode] = useState<string | undefined>(undefined);

  const { data: periodes } = useQuery({
    queryKey: ['dashboard-periodes-reseau'],
    queryFn: () => api.get<string[]>('/dashboard/periodes'),
  });

  useEffect(() => {
    if (periode === undefined && periodes && periodes.length > 0) setPeriode(periodes[0]);
  }, [periodes, periode]);

  const { data } = useQuery({
    queryKey: ['dashboard-consolide', periode],
    queryFn: () =>
      api.get<DashboardConsolideLigne[]>(`/dashboard/consolide${periode ? `?periode=${encodeURIComponent(periode)}` : ''}`),
  });

  const chartData = data?.map((b) => ({
    nom: b.nom,
    Performants: b.repartition.success,
    'À revoir': b.repartition.warning,
    'À remplacer': b.repartition.danger,
  }));

  const totalEffectif = data?.reduce((acc, b) => acc + b.effectifTotal, 0) ?? 0;
  const totalSuccess = data?.reduce((acc, b) => acc + b.repartition.success, 0) ?? 0;
  const totalWarning = data?.reduce((acc, b) => acc + b.repartition.warning, 0) ?? 0;
  const totalDanger = data?.reduce((acc, b) => acc + b.repartition.danger, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 text-text-primary">Vue Consolidée</h1>
        <div className="flex items-center gap-3">
          <PeriodeSelect periodes={periodes} value={periode} onChange={setPeriode} />
          <Button variant="outline" disabled title="Disponible en Phase 2" className="gap-1.5">
            <Download className="h-3.5 w-3.5" strokeWidth={2} />
            Exporter (Phase 2)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile title="Boutiques" value={data?.length ?? '—'} icon={Store} />
        <KpiTile title="Effectif total" value={totalEffectif} icon={Users2} />
        <KpiTile title="Performants" value={totalSuccess} tone="success" icon={CheckCircle2} />
        <KpiTile title="À revoir / remplacer" value={totalWarning + totalDanger} tone="warning" icon={AlertTriangle} />
      </div>

      <div className="h-72 rounded-lg border border-border bg-bg-surface p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="nom" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Performants" fill="var(--success)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="À revoir" fill="var(--warning)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="À remplacer" fill="var(--danger)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
                  <span className="inline-flex items-center gap-2">
                    <Store className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={2} />
                    {b.nom}
                  </span>
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
