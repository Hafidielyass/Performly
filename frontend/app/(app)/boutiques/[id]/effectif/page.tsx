'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Personne } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PosteTag } from '@/components/evaluations/poste-tag';
import { PersonneFormDialog, PersonneFormValues } from '@/components/personnes/personne-form-dialog';
import { PersonneImportDialog } from '@/components/personnes/personne-import-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function EffectifPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [personneEnEdition, setPersonneEnEdition] = useState<Personne | null>(null);
  const [personneASupprimer, setPersonneASupprimer] = useState<Personne | null>(null);

  const { data: personnes } = useQuery({
    queryKey: ['personnes', params.id],
    queryFn: () => api.get<Personne[]>(`/boutiques/${params.id}/personnes`),
  });

  function invalider() {
    queryClient.invalidateQueries({ queryKey: ['personnes', params.id] });
  }

  const createMutation = useMutation({
    mutationFn: (values: PersonneFormValues) =>
      api.post(`/boutiques/${params.id}/personnes`, {
        ...values,
        ancienneteAnnees: Number(values.ancienneteAnnees),
        salaireNet: Number(values.salaireNet),
      }),
    onSuccess: () => {
      invalider();
      setFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: PersonneFormValues) =>
      api.patch(`/personnes/${personneEnEdition!.id}`, {
        ...values,
        ancienneteAnnees: Number(values.ancienneteAnnees),
        salaireNet: Number(values.salaireNet),
      }),
    onSuccess: () => {
      invalider();
      setFormOpen(false);
      setPersonneEnEdition(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/personnes/${id}`),
    onSuccess: () => {
      invalider();
      setPersonneASupprimer(null);
    },
  });

  const isAdmin = user?.role === 'ADMIN_RH';

  function ouvrirAjout() {
    setPersonneEnEdition(null);
    setFormOpen(true);
  }

  function ouvrirEdition(personne: Personne) {
    setPersonneEnEdition(personne);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" className="gap-1.5" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" strokeWidth={2} />
            Importer un fichier
          </Button>
          <Button className="gap-1.5" onClick={ouvrirAjout}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Ajouter une personne
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-border bg-bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead>Contrat</TableHead>
              <TableHead>Ancienneté</TableHead>
              <TableHead>Salaire net</TableHead>
              <TableHead>Statut</TableHead>
              {isAdmin && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {personnes?.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/boutiques/${params.id}/personnes/${p.id}`} className="text-brand-primary hover:underline">
                    {p.nomComplet}
                  </Link>
                </TableCell>
                <TableCell>
                  <PosteTag poste={p.poste} />
                </TableCell>
                <TableCell>{p.typeContrat}</TableCell>
                <TableCell>{Number(p.ancienneteAnnees).toFixed(1)} an(s)</TableCell>
                <TableCell>{Number(p.salaireNet).toLocaleString('fr-MA')} MAD</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${p.actif ? 'bg-success' : 'bg-text-muted'}`}
                      aria-hidden="true"
                    />
                    {p.actif ? 'Actif' : 'Inactif'}
                  </span>
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => ouvrirEdition(p)} aria-label="Modifier">
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPersonneASupprimer(p)} aria-label="Supprimer">
                        <Trash2 className="h-3.5 w-3.5 text-danger" strokeWidth={2} />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PersonneFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        personne={personneEnEdition}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={(values) => (personneEnEdition ? updateMutation.mutate(values) : createMutation.mutate(values))}
      />

      <PersonneImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        boutiqueId={params.id}
        onImported={invalider}
      />

      <ConfirmDialog
        open={!!personneASupprimer}
        onOpenChange={(open) => !open && setPersonneASupprimer(null)}
        title="Supprimer cette personne ?"
        description={`${personneASupprimer?.nomComplet ?? ''} sera définitivement supprimé(e), ainsi que tout son historique d'évaluations. Cette action est irréversible.`}
        isPending={deleteMutation.isPending}
        onConfirm={() => personneASupprimer && deleteMutation.mutate(personneASupprimer.id)}
      />
    </div>
  );
}
