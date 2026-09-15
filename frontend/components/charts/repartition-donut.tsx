'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CategorieDecision } from '@/lib/types';

const LABELS: Record<CategorieDecision, string> = {
  success: 'Performants',
  warning: 'À revoir',
  danger: 'À remplacer',
  neutral: 'Pas encore évalué(e)',
};

const COLORS: Record<CategorieDecision, string> = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  neutral: 'var(--border)',
};

export function RepartitionDonut({ repartition }: { repartition: Record<CategorieDecision, number> }) {
  const data = (Object.keys(LABELS) as CategorieDecision[])
    .map((key) => ({ key, name: LABELS[key], value: repartition[key] ?? 0 }))
    .filter((d) => d.value > 0);

  const total = data.reduce((acc, d) => acc + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center text-body text-text-muted">
        Aucune évaluation pour le moment.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.key} fill={COLORS[d.key]} stroke="var(--bg-surface)" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" height={32} />
      </PieChart>
    </ResponsiveContainer>
  );
}
