'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { CategorieEvaluation, CritereEvaluation, ProfilEvaluation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CategorieFormDialog, CategorieFormValues } from '@/components/administration/categorie-form-dialog';

type ElementASupprimer =
  | { type: 'categorie'; categorie: CategorieEvaluation }
  | { type: 'critere'; critere: CritereEvaluation };

export function CriteresPanel() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [categorieEnEdition, setCategorieEnEdition] = useState<CategorieEvaluation | null>(null);
  const [profilForm, setProfilForm] = useState<ProfilEvaluation>('GERANT');
  const [formError, setFormError] = useState<string | null>(null);
  const [elementASupprimer, setElementASupprimer] = useState<ElementASupprimer | null>(null);
  const [suppressionError, setSuppressionError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [nouveaux, setNouveaux] = useState<Record<string, string>>({});

  const { data: categoriesGerant, isLoading: chargementGerant } = useQuery({
    queryKey: ['categories-evaluation', 'GERANT'],
    queryFn: () => api.get<CategorieEvaluation[]>('/categories-evaluation?applicableA=GERANT'),
  });
  const { data: categoriesVendeur, isLoading: chargementVendeur } = useQuery({
    queryKey: ['categories-evaluation', 'VENDEUR'],
    queryFn: () => api.get<CategorieEvaluation[]>('/categories-evaluation?applicableA=VENDEUR'),
  });

  function invalider() {
    queryClient.invalidateQueries({ queryKey: ['categories-evaluation'] });
  }

  const createCategorie = useMutation({
    mutationFn: (values: CategorieFormValues) => api.post('/categories-evaluation', values),
    onSuccess: () => {
      invalider();
      setFormOpen(false);
      setFormError(null);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : "La création a échoué."),
  });

  const updateCategorie = useMutation({
    mutationFn: ({ id, values }: { id: string; values: CategorieFormValues }) =>
      api.patch(`/categories-evaluation/${id}`, values),
    onSuccess: () => {
      invalider();
      setFormOpen(false);
      setCategorieEnEdition(null);
      setFormError(null);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : "La modification a échoué."),
  });

  const deleteCategorie = useMutation({
    mutationFn: (id: string) => api.delete(`/categories-evaluation/${id}`),
    onSuccess: () => {
      invalider();
      setElementASupprimer(null);
      setSuppressionError(null);
    },
    onError: (err) => setSuppressionError(err instanceof ApiError ? err.message : 'La suppression a échoué.'),
  });

  const createCritere = useMutation({
    mutationFn: ({ categorieId, libelle }: { categorieId: string; libelle: string }) =>
      api.post('/criteres-evaluation', { categorieId, libelle }),
    onSuccess: (_data, variables) => {
      invalider();
      setActionError(null);
      setNouveaux((prev) => {
        const next = { ...prev };
        delete next[variables.categorieId];
        return next;
      });
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : "L'ajout du critère a échoué."),
  });

  const updateCritere = useMutation({
    mutationFn: ({ id, libelle }: { id: string; libelle: string }) => api.patch(`/criteres-evaluation/${id}`, { libelle }),
    onSuccess: (_data, variables) => {
      invalider();
      setActionError(null);
      setEdits((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : "La modification du critère a échoué."),
  });

  const deleteCritere = useMutation({
    mutationFn: (id: string) => api.delete(`/criteres-evaluation/${id}`),
    onSuccess: () => {
      invalider();
      setElementASupprimer(null);
      setSuppressionError(null);
    },
    onError: (err) => setSuppressionError(err instanceof ApiError ? err.message : 'La suppression a échoué.'),
  });

  const enSauvegarde =
    createCategorie.isPending ||
    updateCategorie.isPending ||
    deleteCategorie.isPending ||
    createCritere.isPending ||
    updateCritere.isPending ||
    deleteCritere.isPending;

  function ouvrirAjoutCategorie(profil: ProfilEvaluation) {
    setCategorieEnEdition(null);
    setProfilForm(profil);
    setFormError(null);
    setFormOpen(true);
  }

  function ouvrirEditionCategorie(categorie: CategorieEvaluation) {
    setCategorieEnEdition(categorie);
    setProfilForm(categorie.applicableA);
    setFormError(null);
    setFormOpen(true);
  }

  function demandeSuppressionCategorie(categorie: CategorieEvaluation) {
    setSuppressionError(null);
    setElementASupprimer({ type: 'categorie', categorie });
  }

  function demandeSuppressionCritere(critere: CritereEvaluation) {
    setSuppressionError(null);
    setElementASupprimer({ type: 'critere', critere });
  }

  const libelleModifie = (critere: CritereEvaluation) =>
    edits[critere.id] !== undefined &&
    edits[critere.id].trim() !== '' &&
    edits[critere.id].trim() !== critere.libelle;

  function renderNouveauCritere(categorie: CategorieEvaluation) {
    return (
      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const libelle = nouveaux[categorie.id]?.trim();
          if (libelle && libelle.length > 0 && !enSauvegarde) {
            createCritere.mutate({ categorieId: categorie.id, libelle });
          }
        }}
      >
        <Input
          value={nouveaux[categorie.id] ?? ''}
          onChange={(e) => setNouveaux((prev) => ({ ...prev, [categorie.id]: e.target.value }))}
          placeholder={`Ajouter un critère à « ${categorie.nom} »`}
          disabled={enSauvegarde}
        />
        <Button
          type="submit"
          size="sm"
          className="gap-1.5"
          disabled={enSauvegarde || !(nouveaux[categorie.id]?.trim().length > 0)}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Ajouter
        </Button>
      </form>
    );
  }

  function renderGrille(titre: string, categorieDeTete: 'GERANT' | 'VENDEUR', categories?: CategorieEvaluation[], chargement?: boolean) {
    return (
      <div className="rounded-lg border border-border bg-bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <p className="text-h3 text-text-primary">{titre}</p>
          <Button size="sm" className="gap-1.5" onClick={() => ouvrirAjoutCategorie(categorieDeTete)} disabled={enSauvegarde}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nouvelle catégorie
          </Button>
        </div>

        {chargement && <p className="p-4 text-body text-text-muted">Chargement...</p>}

        {!chargement && categories?.length === 0 && (
          <p className="p-4 text-body text-text-muted">
            Aucune catégorie pour ce profil. Créez la première avec le bouton ci-dessus.
          </p>
        )}

        {!chargement && (categories?.length ?? 0) > 0 && (
          <div className="divide-y divide-border">
            {categories?.map((categorie) => (
              <div key={categorie.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-h3 text-text-primary">{categorie.nom}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">
                        {categorie.applicableA === 'GERANT' ? 'Gérant(e)' : 'Vendeur(se)'}
                      </Badge>
                      <Badge variant="neutral">
                        {categorie.criteres.length} critère{categorie.criteres.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => ouvrirEditionCategorie(categorie)}
                      disabled={enSauvegarde}
                      aria-label={`Modifier la catégorie ${categorie.nom}`}
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => demandeSuppressionCategorie(categorie)}
                      disabled={enSauvegarde}
                      aria-label={`Supprimer la catégorie ${categorie.nom}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-danger" strokeWidth={2} />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {categorie.criteres.map((critere) => (
                    <div key={critere.id} className="flex items-center gap-2">
                      <Input
                        value={edits[critere.id] ?? critere.libelle}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [critere.id]: e.target.value }))}
                        disabled={enSauvegarde}
                        aria-label={`Libellé du critère ${critere.libelle}`}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={enSauvegarde || !libelleModifie(critere)}
                        onClick={() => updateCritere.mutate({ id: critere.id, libelle: edits[critere.id].trim() })}
                      >
                        Enregistrer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => demandeSuppressionCritere(critere)}
                        disabled={enSauvegarde}
                        aria-label="Supprimer le critère"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-danger" strokeWidth={2} />
                      </Button>
                    </div>
                  ))}
                  {renderNouveauCritere(categorie)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const confirmation =
    elementASupprimer?.type === 'categorie'
      ? {
          title: 'Supprimer cette catégorie ?',
          description: `« ${elementASupprimer.categorie.nom} » et ses critères seront définitivement supprimés. Cette action est irréversible.`,
        }
      : elementASupprimer?.type === 'critere'
        ? {
            title: 'Supprimer ce critère ?',
            description: `« ${elementASupprimer.critere.libelle} » sera définitivement supprimé. Cette action est irréversible.`,
          }
        : { title: '', description: '' };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-body text-text-muted">
        Créez, renommez et supprimez les catégories et critères des grilles d&apos;évaluation. Un critère déjà utilisé
        dans une évaluation ne peut pas être supprimé, pour ne pas altérer les résultats existants.
      </p>

      {actionError && <p className="text-small text-danger">{actionError}</p>}

      {renderGrille('Gérant(e)', 'GERANT', categoriesGerant, chargementGerant)}
      {renderGrille('Vendeur(se)', 'VENDEUR', categoriesVendeur, chargementVendeur)}

      <CategorieFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categorie={categorieEnEdition}
        applicableAParDefaut={profilForm}
        isPending={createCategorie.isPending || updateCategorie.isPending}
        error={formError}
        onSubmit={(values) =>
          categorieEnEdition
            ? updateCategorie.mutate({ id: categorieEnEdition.id, values })
            : createCategorie.mutate(values)
        }
      />

      <ConfirmDialog
        open={!!elementASupprimer}
        onOpenChange={(open) => {
          if (!open) {
            setElementASupprimer(null);
            setSuppressionError(null);
          }
        }}
        title={confirmation.title}
        description={confirmation.description}
        error={suppressionError}
        isPending={deleteCategorie.isPending || deleteCritere.isPending}
        onConfirm={() => {
          if (elementASupprimer?.type === 'categorie') deleteCategorie.mutate(elementASupprimer.categorie.id);
          if (elementASupprimer?.type === 'critere') deleteCritere.mutate(elementASupprimer.critere.id);
        }}
      />
    </div>
  );
}