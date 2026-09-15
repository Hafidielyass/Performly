'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Store, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { Boutique } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { BoutiqueFormDialog, BoutiqueFormValues } from '@/components/boutiques/boutique-form-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function BoutiquesPanel() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [boutiqueEnEdition, setBoutiqueEnEdition] = useState<Boutique | null>(null);
  const [boutiqueASupprimer, setBoutiqueASupprimer] = useState<Boutique | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => api.get<Boutique[]>('/boutiques'),
  });

  function invalider() {
    queryClient.invalidateQueries({ queryKey: ['boutiques'] });
  }

  const createMutation = useMutation({
    mutationFn: (values: BoutiqueFormValues) => api.post('/boutiques', { nom: values.nom }),
    onSuccess: () => {
      invalider();
      setFormOpen(false);
      setFormError(null);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'La création a échoué.'),
  });

  const updateMutation = useMutation({
    mutationFn: (values: BoutiqueFormValues) => api.patch(`/boutiques/${boutiqueEnEdition!.id}`, { nom: values.nom }),
    onSuccess: () => {
      invalider();
      setFormOpen(false);
      setBoutiqueEnEdition(null);
      setFormError(null);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : "La modification a échoué."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/boutiques/${id}`),
    onSuccess: () => {
      invalider();
      setBoutiqueASupprimer(null);
      setDeleteError(null);
    },
    onError: (err) => setDeleteError(err instanceof ApiError ? err.message : 'La suppression a échoué.'),
  });

  function ouvrirAjout() {
    setBoutiqueEnEdition(null);
    setFormError(null);
    setFormOpen(true);
  }

  function ouvrirEdition(boutique: Boutique) {
    setBoutiqueEnEdition(boutique);
    setFormError(null);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={ouvrirAjout}>
          <Plus className="h-4 w-4" strokeWidth={2} />
          Nouvelle boutique
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Boutique</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {boutiques?.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <Store className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={2} />
                    {b.nom}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => ouvrirEdition(b)} aria-label="Modifier">
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeleteError(null);
                        setBoutiqueASupprimer(b);
                      }}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-danger" strokeWidth={2} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BoutiqueFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        boutique={boutiqueEnEdition}
        isPending={createMutation.isPending || updateMutation.isPending}
        error={formError}
        onSubmit={(values) => (boutiqueEnEdition ? updateMutation.mutate(values) : createMutation.mutate(values))}
      />

      <ConfirmDialog
        open={!!boutiqueASupprimer}
        onOpenChange={(open) => {
          if (!open) {
            setBoutiqueASupprimer(null);
            setDeleteError(null);
          }
        }}
        title="Supprimer cette boutique ?"
        description={`${boutiqueASupprimer?.nom ?? ''} sera définitivement supprimée. Cette action est irréversible.`}
        error={deleteError}
        isPending={deleteMutation.isPending}
        onConfirm={() => boutiqueASupprimer && deleteMutation.mutate(boutiqueASupprimer.id)}
      />
    </div>
  );
}
