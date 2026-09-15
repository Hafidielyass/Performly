'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Boutique } from '@/lib/types';
import { cn } from '@/lib/utils';

const TABS = [
  { href: 'grille-poste', label: 'Grille de Poste' },
  { href: 'effectif', label: 'Effectif' },
  { href: 'evaluations', label: 'Évaluations' },
  { href: 'tableau-de-bord', label: 'Tableau de Bord' },
  { href: 'plan-action', label: "Plan d'Action RH" },
];

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();

  const { data: boutique } = useQuery({
    queryKey: ['boutique', params.id],
    queryFn: () => api.get<Boutique>(`/boutiques/${params.id}`),
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-h1 text-text-primary">{boutique?.nom ?? 'Boutique'}</h1>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const href = `/boutiques/${params.id}/${tab.href}`;
          const active = pathname === href;
          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                'border-b-2 border-transparent px-3 py-2 text-label transition-colors',
                active
                  ? 'border-brand-primary text-brand-primary'
                  : 'text-text-muted hover:text-text-primary',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}
