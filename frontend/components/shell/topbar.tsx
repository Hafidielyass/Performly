'use client';

import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

const ROLE_LABELS: Record<string, string> = {
  ADMIN_RH: 'Admin RH',
  DIRECTEUR_REGIONAL: 'Directeur Régional',
  GERANT: 'Gérant(e)',
};

function initiales(email: string) {
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/).filter(Boolean);
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-bg-surface px-6">
      <div />
      <div className="flex items-center gap-3">
        {user && (
          <>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint text-small font-medium text-brand-primary">
              {initiales(user.email)}
            </span>
            <div className="text-right">
              <p className="text-label text-text-primary">{user.email}</p>
              <p className="text-small text-text-muted">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
          </>
        )}
        <Button variant="outline" size="sm" onClick={() => logout()} className="gap-1.5">
          <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
          Déconnexion
        </Button>
      </div>
    </header>
  );
}
