'use client';

import { useRef, useState } from 'react';
import { AlertTriangle, Download, FileUp, Upload } from 'lucide-react';
import { api, downloadFile, ApiError } from '@/lib/api-client';
import { ResultatImportPersonnes } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PersonneImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boutiqueId: string;
  onImported: () => void;
}

export function PersonneImportDialog({ open, onOpenChange, boutiqueId, onImported }: PersonneImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fichier, setFichier] = useState<File | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultat, setResultat] = useState<ResultatImportPersonnes | null>(null);

  function reinitialiser() {
    setFichier(null);
    setErreur(null);
    setResultat(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function fermer(open: boolean) {
    if (!open) reinitialiser();
    onOpenChange(open);
  }

  async function telechargerModele() {
    await downloadFile(`/boutiques/${boutiqueId}/personnes/import/modele`, 'modele-import-personnes.xlsx');
  }

  async function importer() {
    if (!fichier) return;
    setEnCours(true);
    setErreur(null);
    try {
      const formData = new FormData();
      formData.append('file', fichier);
      const resultat = await api.postFormData<ResultatImportPersonnes>(
        `/boutiques/${boutiqueId}/personnes/import`,
        formData,
      );
      setResultat(resultat);
      if (resultat.ajoutes > 0) onImported();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "L'import a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={fermer}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importer un fichier Excel</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-body text-text-muted">
            Fichier .xlsx avec les colonnes <strong className="text-text-primary">Nom Prénom</strong>,{' '}
            <strong className="text-text-primary">Fonction / Grade</strong>,{' '}
            <strong className="text-text-primary">Type contrat</strong>,{' '}
            <strong className="text-text-primary">Ancienneté (ans)</strong> et{' '}
            <strong className="text-text-primary">Salaire Net actuel (DH)</strong>. Seuls le nom et la fonction
            sont obligatoires ; le reste est optionnel.
          </p>

          <Button variant="outline" size="sm" className="w-fit gap-1.5" onClick={telechargerModele}>
            <Download className="h-3.5 w-3.5" strokeWidth={2} />
            Télécharger le modèle
          </Button>

          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-border bg-bg-page px-4 py-6 text-center hover:bg-brand-tint/40">
            <FileUp className="h-6 w-6 text-brand-primary" strokeWidth={2} />
            <span className="text-body text-text-primary">{fichier ? fichier.name : 'Choisir un fichier .xlsx'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                setResultat(null);
                setErreur(null);
                setFichier(e.target.files?.[0] ?? null);
              }}
            />
          </label>

          {erreur && <p className="text-small text-danger">{erreur}</p>}

          {resultat && (
            <div className="flex flex-col gap-2 rounded-md border border-border bg-bg-page p-3">
              <p className="text-label text-success">{resultat.ajoutes} personne(s) ajoutée(s).</p>
              {resultat.ignorees.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="flex items-center gap-1.5 text-label text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
                    {resultat.ignorees.length} ligne(s) ignorée(s)
                  </p>
                  <ul className="max-h-40 overflow-y-auto text-small text-text-muted">
                    {resultat.ignorees.map((l, i) => (
                      <li key={i}>
                        Ligne {l.ligne}
                        {l.nom ? ` (${l.nom})` : ''} : {l.raison}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => fermer(false)}>
              Fermer
            </Button>
            <Button className="gap-1.5" onClick={importer} disabled={!fichier || enCours}>
              <Upload className="h-4 w-4" strokeWidth={2} />
              {enCours ? 'Import...' : 'Importer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
