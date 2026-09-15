'use client';

import { useEffect, useState } from 'react';
import { Personne, Poste, TypeContrat } from '@/lib/types';
import { POSTE_LABELS } from '@/lib/poste-labels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface PersonneFormValues {
  nomComplet: string;
  poste: Poste;
  typeContrat: TypeContrat;
  ancienneteAnnees: string;
  salaireNet: string;
}

const EMPTY_FORM: PersonneFormValues = {
  nomComplet: '',
  poste: 'VENDEUR',
  typeContrat: 'CDI',
  ancienneteAnnees: '0',
  salaireNet: '0',
};

function versFormulaire(personne: Personne): PersonneFormValues {
  return {
    nomComplet: personne.nomComplet,
    poste: personne.poste,
    typeContrat: personne.typeContrat,
    ancienneteAnnees: personne.ancienneteAnnees,
    salaireNet: personne.salaireNet,
  };
}

interface PersonneFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personne?: Personne | null;
  isPending: boolean;
  onSubmit: (values: PersonneFormValues) => void;
}

export function PersonneFormDialog({ open, onOpenChange, personne, isPending, onSubmit }: PersonneFormDialogProps) {
  const [form, setForm] = useState<PersonneFormValues>(EMPTY_FORM);
  const estEdition = !!personne;

  useEffect(() => {
    if (open) setForm(personne ? versFormulaire(personne) : EMPTY_FORM);
  }, [open, personne]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{estEdition ? 'Modifier la personne' : 'Ajouter une personne'}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nomComplet">Nom complet</Label>
            <Input
              id="nomComplet"
              value={form.nomComplet}
              onChange={(e) => setForm({ ...form, nomComplet: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Poste</Label>
            <Select value={form.poste} onValueChange={(v) => setForm({ ...form, poste: v as Poste })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(POSTE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Type de contrat</Label>
            <Select value={form.typeContrat} onValueChange={(v) => setForm({ ...form, typeContrat: v as TypeContrat })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CDI">CDI</SelectItem>
                <SelectItem value="CDD">CDD</SelectItem>
                <SelectItem value="PRESTATION">Prestation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="anciennete">Ancienneté (années)</Label>
              <Input
                id="anciennete"
                type="number"
                min={0}
                step="0.1"
                value={form.ancienneteAnnees}
                onChange={(e) => setForm({ ...form, ancienneteAnnees: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="salaire">Salaire net (MAD)</Label>
              <Input
                id="salaire"
                type="number"
                min={0}
                value={form.salaireNet}
                onChange={(e) => setForm({ ...form, salaireNet: e.target.value })}
              />
            </div>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Enregistrement...' : estEdition ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
