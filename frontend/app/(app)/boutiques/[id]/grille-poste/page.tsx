'use client';

import { useQuery } from '@tanstack/react-query';
import { Briefcase } from 'lucide-react';
import { api } from '@/lib/api-client';
import { GrillePoste } from '@/lib/types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function GrillePostePage() {
  const { data } = useQuery({
    queryKey: ['grille-postes'],
    queryFn: () => api.get<GrillePoste[]>('/grille-postes'),
  });

  return (
    <div className="rounded-lg border border-border bg-bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Poste</TableHead>
            <TableHead>Effectif</TableHead>
            <TableHead>Salaire net moyen</TableHead>
            <TableHead>Niveau d&apos;études</TableHead>
            <TableHead>Expérience requise</TableHead>
            <TableHead>Compétences clés</TableHead>
            <TableHead>Mission client dédiée</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((g) => (
            <TableRow key={g.id}>
              <TableCell>
                <span className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-tint text-brand-primary">
                    <Briefcase className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  {g.nomPoste}
                </span>
              </TableCell>
              <TableCell>
                {g.effectifMin}–{g.effectifMax}
              </TableCell>
              <TableCell>{Number(g.salaireNetMoyen).toLocaleString('fr-MA')} MAD</TableCell>
              <TableCell>{g.niveauEtudes}</TableCell>
              <TableCell>{g.experienceRequise}</TableCell>
              <TableCell>{g.competencesCles}</TableCell>
              <TableCell>{g.missionClientDediee}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
