'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Users } from 'lucide-react';
import { api } from '@/lib/api-client';
import { periodeCourante } from '@/lib/periode';
import { Evaluation, Personne } from '@/lib/types';
import { POSTE_ICONS, POSTE_LABELS } from '@/lib/poste-labels';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATUT_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  SOUMISE: 'Soumise',
  VALIDEE: 'Validée',
};

export default function EvaluationsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [periode, setPeriode] = useState(periodeCourante());

  const { data: personnes } = useQuery({
    queryKey: ['personnes', params.id],
    queryFn: () => api.get<Personne[]>(`/boutiques/${params.id}/personnes`),
  });

  const { data: evaluations } = useQuery({
    queryKey: ['evaluations', params.id, periode],
    queryFn: () => api.get<Evaluation[]>(`/boutiques/${params.id}/evaluations?periode=${encodeURIComponent(periode)}`),
  });

  const evaluationParPersonne = useMemo(() => {
    const map = new Map<string, Evaluation>();
    evaluations?.forEach((e) => map.set(e.personneId, e));
    return map;
  }, [evaluations]);

  const personnesEvaluables = personnes?.filter((p) => p.poste === 'GERANT' || p.poste === 'VENDEUR');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="periode">Mois</Label>
          <Input id="periode" type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} className="w-40" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {personnesEvaluables?.map((personne) => {
          const evaluation = evaluationParPersonne.get(personne.id);
          const Icon = POSTE_ICONS[personne.poste];
          return (
            <div
              key={personne.id}
              className="flex items-center justify-between rounded-lg border border-border bg-brand-tint/40 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-surface text-brand-primary">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-label text-text-primary">{personne.nomComplet}</p>
                  <p className="text-small text-text-muted">{POSTE_LABELS[personne.poste]}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {evaluation ? (
                  <Badge variant="neutral">{STATUT_LABELS[evaluation.statut]}</Badge>
                ) : (
                  <Badge variant="neutral">Pas commencée</Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => router.push(`/boutiques/${params.id}/evaluations/${personne.id}?periode=${encodeURIComponent(periode)}`)}
                >
                  {evaluation ? 'Ouvrir' : 'Démarrer'}
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Button>
              </div>
            </div>
          );
        })}
        {personnesEvaluables?.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-bg-surface py-16 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-tint text-brand-primary">
              <Users className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="text-body text-text-muted">Aucun Gérant(e) ou Vendeur(se) dans cette boutique.</p>
          </div>
        )}
      </div>
    </div>
  );
}
