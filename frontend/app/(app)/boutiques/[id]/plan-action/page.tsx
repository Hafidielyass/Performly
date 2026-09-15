'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Evaluation, PlanActionRH, StatutPlanAction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const STATUT_LABELS: Record<StatutPlanAction, string> = {
  OUVERT: 'Ouvert',
  EN_COURS: 'En cours',
  CLOS: 'Clos',
};

export default function PlanActionPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [evaluationId, setEvaluationId] = useState('');
  const [formationPrioritaire, setFormationPrioritaire] = useState('');
  const [delaiRevue, setDelaiRevue] = useState('30 jours');
  const [dateSuivi, setDateSuivi] = useState('');

  const { data: plans } = useQuery({
    queryKey: ['plans-action', params.id],
    queryFn: () => api.get<PlanActionRH[]>(`/boutiques/${params.id}/plans-action`),
  });

  const { data: evaluations } = useQuery({
    queryKey: ['evaluations-toutes', params.id],
    queryFn: () => api.get<Evaluation[]>(`/boutiques/${params.id}/evaluations`),
  });

  const evaluationsSoumises = evaluations?.filter((e) => e.statut !== 'BROUILLON');

  const createMutation = useMutation({
    mutationFn: () => {
      const evaluation = evaluationsSoumises?.find((e) => e.id === evaluationId);
      if (!evaluation) throw new Error('Évaluation introuvable.');
      return api.post('/plans-action', {
        personneId: evaluation.personneId,
        evaluationId,
        formationPrioritaire,
        delaiRevue,
        dateSuivi,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans-action', params.id] });
      setOpen(false);
      setEvaluationId('');
      setFormationPrioritaire('');
      setDateSuivi('');
    },
  });

  const updateStatutMutation = useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: StatutPlanAction }) => api.patch(`/plans-action/${id}`, { statut }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans-action', params.id] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nouveau plan d&apos;action
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau plan d&apos;action RH</DialogTitle>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
            >
              <div className="flex flex-col gap-1.5">
                <Label>Évaluation</Label>
                <Select value={evaluationId} onValueChange={setEvaluationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une évaluation soumise" />
                  </SelectTrigger>
                  <SelectContent>
                    {evaluationsSoumises?.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.personne?.nomComplet ?? e.personneId} ({e.periode}) : {e.decisionRh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="formation">Formation prioritaire</Label>
                <Textarea
                  id="formation"
                  value={formationPrioritaire}
                  onChange={(e) => setFormationPrioritaire(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="delai">Délai de revue</Label>
                  <Input id="delai" value={delaiRevue} onChange={(e) => setDelaiRevue(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dateSuivi">Date de suivi</Label>
                  <Input
                    id="dateSuivi"
                    type="date"
                    value={dateSuivi}
                    onChange={(e) => setDateSuivi(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending || !evaluationId}>
                {createMutation.isPending ? 'Création...' : 'Créer le plan'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {plans?.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-bg-surface py-16 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-tint text-brand-primary">
            <ClipboardList className="h-5 w-5" strokeWidth={2} />
          </span>
          <p className="text-body text-text-muted">Aucun plan d&apos;action pour le moment.</p>
        </div>
      ) : (
      <div className="rounded-lg border border-border bg-bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Personne</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Décision RH</TableHead>
              <TableHead>Formation prioritaire</TableHead>
              <TableHead>Délai</TableHead>
              <TableHead>Date de suivi</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans?.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>{plan.personne?.nomComplet}</TableCell>
                <TableCell>{plan.scoreActuel ?? '—'}</TableCell>
                <TableCell>{plan.decisionRh}</TableCell>
                <TableCell>{plan.formationPrioritaire}</TableCell>
                <TableCell>{plan.delaiRevue}</TableCell>
                <TableCell>{new Date(plan.dateSuivi).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>
                  <Select
                    value={plan.statut}
                    onValueChange={(v) => updateStatutMutation.mutate({ id: plan.id, statut: v as StatutPlanAction })}
                  >
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUT_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  );
}
