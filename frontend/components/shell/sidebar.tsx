'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Home, LucideIcon, Settings, Store } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Boutique } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/branding/logo';

function NavLink({ href, icon: Icon, children }: { href: string; icon: LucideIcon; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-label transition-colors',
        active ? 'bg-brand-tint text-brand-primary' : 'text-text-muted hover:bg-bg-page hover:text-text-primary',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="truncate">{children}</span>
    </Link>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  const isMultiBoutique = user?.role === 'ADMIN_RH' || user?.role === 'DIRECTEUR_REGIONAL';

  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => api.get<Boutique[]>('/boutiques'),
    enabled: !!user,
  });

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-bg-surface p-4">
      <div className="mb-6 px-2">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <NavLink href="/accueil" icon={Home}>
          Accueil
        </NavLink>

        <p className="mt-4 px-3 text-small uppercase tracking-normal text-text-muted">Boutiques</p>
        {isMultiBoutique
          ? boutiques?.map((b) => (
              <NavLink key={b.id} href={`/boutiques/${b.id}/tableau-de-bord`} icon={Store}>
                {b.nom}
              </NavLink>
            ))
          : user?.boutiqueId && (
              <NavLink href={`/boutiques/${user.boutiqueId}/tableau-de-bord`} icon={Store}>
                {boutiques?.[0]?.nom ?? 'Ma boutique'}
              </NavLink>
            )}

        {isMultiBoutique && (
          <>
            <p className="mt-4 px-3 text-small uppercase tracking-normal text-text-muted">Global</p>
            <NavLink href="/consolide" icon={BarChart3}>
              Vue Consolidée
            </NavLink>
            {user?.role === 'ADMIN_RH' && (
              <NavLink href="/administration" icon={Settings}>
                Administration
              </NavLink>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}
