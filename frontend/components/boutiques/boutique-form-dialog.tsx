'use client';

import { useEffect, useState } from 'react';
import { Boutique } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface BoutiqueFormValues {
  nom: string;
}

const EMPTY_FORM: BoutiqueFormValues = { nom: '' };

interface BoutiqueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boutique?: Boutique | null;
  isPending: boolean;
  error?: string | null;
  onSubmit: (values: BoutiqueFormValues) => void;
}

export function BoutiqueFormDialog({ open, onOpenChange, boutique, isPending, error, onSubmit }: BoutiqueFormDialogProps) {
  const [form, setForm] = useState<BoutiqueFormValues>(EMPTY_FORM);
  const estEdition = !!boutique;

  useEffect(() => {
    if (open) setForm(boutique ? { nom: boutique.nom } : EMPTY_FORM);
  }, [open, boutique]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{estEdition ? 'Modifier la boutique' : 'Nouvelle boutique'}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
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
