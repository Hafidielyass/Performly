'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role === 'GERANT' && user.boutiqueId) {
      router.replace(`/boutiques/${user.boutiqueId}/tableau-de-bord`);
    } else {
      router.replace('/accueil');
    }
  }, [isLoading, user, router]);

  return null;
}
