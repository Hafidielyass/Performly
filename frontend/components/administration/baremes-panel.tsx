'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { BaremeNotation, ProfilEvaluation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export function BaremesPanel() {
  const queryClient = useQueryClient();
  const { data: baremes } = useQuery({
    queryKey: ['baremes'],
    queryFn: () => api.get<BaremeNotation[]>('/baremes'),
  });

  const [edits, setEdits] = useState<Record<string, { borneMin: string; borneMax: string; decisionRh: string }>>({});

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BaremeNotation> }) => api.patch(`/baremes/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['baremes'] }),
  });

  function edited(id: string, bareme: BaremeNotation) {
    return edits[id] ?? { borneMin: bareme.borneMin, borneMax: bareme.borneMax, decisionRh: bareme.decisionRh };
  }

  const groupes: Record<ProfilEvaluation, BaremeNotation[]> = {
    GERANT: baremes?.filter((b) => b.typeProfil === 'GERANT').sort((a, b) => a.ordre - b.ordre) ?? [],
    VENDEUR: baremes?.filter((b) => b.typeProfil === 'VENDEUR').sort((a, b) => a.ordre - b.ordre) ?? [],
  };

  return (
    <div className="flex flex-col gap-6">
      {(['GERANT', 'VENDEUR'] as ProfilEvaluation[]).map((profil) => (
        <div key={profil} className="rounded-lg border border-border bg-bg-surface">
          <div className="border-b border-border p-4">
            <p className="text-h3 text-text-primary">{profil === 'GERANT' ? 'Gérant(e)' : 'Vendeur(se)'}</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Borne min</TableHead>
                <TableHead>Borne max</TableHead>
                <TableHead>Décision RH</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupes[profil].map((bareme) => {
                const current = edited(bareme.id, bareme);
                return (
                  <TableRow key={bareme.id}>
                    <TableCell>
                      <Input
                        className="w-24"
                        value={current.borneMin}
                        onChange={(e) =>
                          setEdits((prev) => ({ ...prev, [bareme.id]: { ...current, borneMin: e.target.value } }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="w-24"
                        value={current.borneMax}
                        onChange={(e) =>
                          setEdits((prev) => ({ ...prev, [bareme.id]: { ...current, borneMax: e.target.value } }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={current.decisionRh}
                        onChange={(e) =>
                          setEdits((prev) => ({ ...prev, [bareme.id]: { ...current, decisionRh: e.target.value } }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Label className="sr-only" htmlFor={`save-${bareme.id}`}>
                        Enregistrer
                      </Label>
                      <Button
                        id={`save-${bareme.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateMutation.mutate({
                            id: bareme.id,
                            data: {
                              borneMin: Number(current.borneMin),
                              borneMax: Number(current.borneMax),
                              decisionRh: current.decisionRh,
                            } as unknown as Partial<BaremeNotation>,
                          })
                        }
                      >
                        Enregistrer
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
