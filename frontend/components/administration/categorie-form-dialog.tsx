'use client';

import { useEffect, useState } from 'react';
import { ProfilEvaluation, CategorieEvaluation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface CategorieFormValues {
  nom: string;
  applicableA: ProfilEvaluation;
}

interface CategorieFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorie?: CategorieEvaluation | null;
  applicableAParDefaut?: ProfilEvaluation;
  isPending: boolean;
  error?: string | null;
  onSubmit: (values: CategorieFormValues) => void;
}

export function CategorieFormDialog({
  open,
  onOpenChange,
  categorie,
  applicableAParDefaut,
  isPending,
  error,
  onSubmit,
}: CategorieFormDialogProps) {
  const [form, setForm] = useState<CategorieFormValues>({ nom: '', applicableA: applicableAParDefaut ?? 'GERANT' });
  const estEdition = !!categorie;

  useEffect(() => {
    if (open) {
      setForm(
        categorie
          ? { nom: categorie.nom, applicableA: categorie.applicableA }
          : { nom: '', applicableA: applicableAParDefaut ?? 'GERANT' },
      );
    }
  }, [open, categorie, applicableAParDefaut]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{estEdition ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nom">Nom de la catégorie</Label>
            <Input
              id="nom"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex. Relations avec la clientèle"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Profil concerné</Label>
            <Select
              value={form.applicableA}
              onValueChange={(v) => setForm({ ...form, applicableA: v as ProfilEvaluation })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GERANT">Gérant(e)</SelectItem>
                <SelectItem value="VENDEUR">Vendeur(se)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-small text-danger">{error}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Enregistrement...' : estEdition ? 'Enregistrer' : 'Créer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}