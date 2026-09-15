'use client';

import { ListChecks, Scale, Store, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BoutiquesPanel } from '@/components/administration/boutiques-panel';
import { UtilisateursPanel } from '@/components/administration/utilisateurs-panel';
import { BaremesPanel } from '@/components/administration/baremes-panel';
import { CriteresPanel } from '@/components/administration/criteres-panel';

export default function AdministrationPage() {
  const { user } = useAuth();

  if (user?.role !== 'ADMIN_RH') {
    return <p className="text-body text-text-muted">Accès réservé à l&apos;Admin RH.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-text-primary">Administration</h1>

      <Tabs defaultValue="boutiques">
        <TabsList>
          <TabsTrigger value="boutiques" className="gap-1.5">
            <Store className="h-4 w-4" strokeWidth={2} />
            Boutiques
          </TabsTrigger>
          <TabsTrigger value="utilisateurs" className="gap-1.5">
            <Users className="h-4 w-4" strokeWidth={2} />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="criteres" className="gap-1.5">
            <ListChecks className="h-4 w-4" strokeWidth={2} />
            Critères d&apos;évaluation
          </TabsTrigger>
          <TabsTrigger value="baremes" className="gap-1.5">
            <Scale className="h-4 w-4" strokeWidth={2} />
            Barèmes de notation
          </TabsTrigger>
        </TabsList>
        <TabsContent value="boutiques">
          <BoutiquesPanel />
        </TabsContent>
        <TabsContent value="utilisateurs">
          <UtilisateursPanel />
        </TabsContent>
        <TabsContent value="criteres">
          <CriteresPanel />
        </TabsContent>
        <TabsContent value="baremes">
          <BaremesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
