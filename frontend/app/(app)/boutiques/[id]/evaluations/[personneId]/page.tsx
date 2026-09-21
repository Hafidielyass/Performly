'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ChevronLeft, ChevronRight, MessageSquarePlus, RotateCcw, Send } from 'lucide-react';
import { api } from '@/lib/api-client';
import { invalidateDashboards } from '@/lib/invalidate-dashboards';
import { periodeCourante, formaterPeriode } from '@/lib/periode';
import { CategorieEvaluation, Evaluation, Personne } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { RecommendationBadge } from '@/components/evaluations/recommendation-badge';
import { ScoreScaleLegend } from '@/components/evaluations/score-scale-legend';
import { ExportButtons } from '@/components/exports/export-buttons';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { categoriserDecision } from '@/lib/categoriser-decision';
import { formaterScore } from '@/lib/format-score';
import { cn } from '@/lib/utils';

type ProfilLocal = 'GERANT' | 'VENDEUR';
type ScoresState = Record<string, { score: number | null; commentaire: string }>;

function profilPourPoste(poste: string): ProfilLocal | null {
  if (poste === 'GERANT') return 'GERANT';
  if (poste === 'VENDEUR') return 'VENDEUR';
  return null;
}

export default function EvaluationFormPage() {
  const params = useParams<{ id: string; personneId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN_RH';
  const periode = searchParams.get('periode') ?? periodeCourante();
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);

  const { data: personnes } = useQuery({
    queryKey: ['personnes', params.id],
    queryFn: () => api.get<Personne[]>(`/boutiques/${params.id}/personnes`),
  });
  const personne = personnes?.find((p) => p.id === params.personneId);
  const profil = personne ? profilPourPoste(personne.poste) : null;

  const { data: categories } = useQuery({
    queryKey: ['categories-evaluation', profil],
    queryFn: () => api.get<CategorieEvaluation[]>(`/categories-evaluation?applicableA=${profil}`),
    enabled: !!profil,
  });

  const { data: evaluations, isLoading: isLoadingEvaluations } = useQuery({
    queryKey: ['evaluations', params.id, periode, params.personneId],
    queryFn: () =>
      api.get<Evaluation[]>(
        `/boutiques/${params.id}/evaluations?periode=${encodeURIComponent(periode)}&personneId=${params.personneId}`,
      ),
  });
  const evaluation = evaluations?.[0];
  const readOnly = evaluation && evaluation.statut !== 'BROUILLON';

  const createMutation = useMutation({
    mutationFn: () => api.post<Evaluation>(`/boutiques/${params.id}/evaluations`, { personneId: params.personneId, periode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations', params.id, periode, params.personneId] });
      invalidateDashboards(queryClient);
    },
  });

  const [scores, setScores] = useState<ScoresState>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [stepIndex, setStepIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'enregistrement' | 'enregistre'>('idle');

  useEffect(() => {
    if (!evaluation) return;
    const next: ScoresState = {};
    const expanded = new Set<string>();
    evaluation.scores.forEach((s) => {
      next[s.critereId] = { score: s.score, commentaire: s.commentaire ?? '' };
      if (s.commentaire) expanded.add(s.critereId);
    });
    setScores(next);
    setExpandedComments(expanded);
    setStepIndex(0);
  }, [evaluation?.id]);

  const criteresPlats = useMemo(() => categories?.flatMap((c) => c.criteres) ?? [], [categories]);
  const nombreNotes = criteresPlats.filter((c) => scores[c.id]?.score != null).length;
  const progression = criteresPlats.length ? Math.round((nombreNotes / criteresPlats.length) * 100) : 0;

  const saveMutation = useMutation({
    mutationFn: (payload: { critereId: string; score: number | null; commentaire: string | null }[]) =>
      api.patch<Evaluation>(`/evaluations/${evaluation?.id}/scores`, { scores: payload }),
    onMutate: () => setSaveStatus('enregistrement'),
    onSuccess: (data) => {
      queryClient.setQueryData(['evaluations', params.id, periode, params.personneId], [data]);
      invalidateDashboards(queryClient);
      setSaveStatus('enregistre');
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => api.post<Evaluation>(`/evaluations/${evaluation?.id}/submit`),
    onSuccess: (data) => {
      queryClient.setQueryData(['evaluations', params.id, periode, params.personneId], [data]);
      invalidateDashboards(queryClient);
    },
  });

  const reopenMutation = useMutation({
    mutationFn: () => api.post<Evaluation>(`/evaluations/${evaluation?.id}/reouvrir`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations', params.id, periode, params.personneId] });
      invalidateDashboards(queryClient);
      setReopenDialogOpen(false);
    },
  });

  function buildPayload() {
    return criteresPlats.map((c) => ({
      critereId: c.id,
      score: scores[c.id]?.score ?? null,
      commentaire: scores[c.id]?.commentaire || null,
    }));
  }

  // Saves are chained through this ref so two PATCH /scores requests are never in flight at
  // once for this evaluation. Without this, a debounced autosave that was already on the wire
  // when "Soumettre" was clicked could resolve *after* the submit-time save and silently
  // overwrite the very last score the manager entered with a stale (pre-click) value - exactly
  // the kind of lost-update race that produced an incomplete submitted evaluation in prod.
  const derniereSauvegardeRef = useRef<Promise<unknown>>(Promise.resolve());
  function enregistrerScores(payload: ReturnType<typeof buildPayload>) {
    const promesse = derniereSauvegardeRef.current.catch(() => {}).then(() => saveMutation.mutateAsync(payload));
    derniereSauvegardeRef.current = promesse;
    return promesse;
  }

  // Autosave: debounce so the manager never has to think about saving while filling the form.
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!evaluation || readOnly) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      enregistrerScores(buildPayload());
    }, 1000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores]);

  function handleScoreChange(critereId: string, score: number) {
    setScores((prev) => ({ ...prev, [critereId]: { score, commentaire: prev[critereId]?.commentaire ?? '' } }));
  }

  function handleCommentChange(critereId: string, commentaire: string) {
    setScores((prev) => ({ ...prev, [critereId]: { score: prev[critereId]?.score ?? null, commentaire } }));
  }

  function toggleComment(critereId: string) {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(critereId)) next.delete(critereId);
      else next.add(critereId);
      return next;
    });
  }

  async function handleSubmit() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    // Waits for any autosave already on the wire to finish, then sends the freshest scores as
    // the last write - never the other way around.
    await enregistrerScores(buildPayload());
    submitMutation.mutate();
  }


  if (!personne) return <p className="text-body text-text-muted">Chargement...</p>;

  if (!profil) {
    return <p className="text-body text-text-muted">Ce poste n&apos;a pas de grille d&apos;évaluation.</p>;
  }

  if (isLoadingEvaluations) return <p className="text-body text-text-muted">Chargement...</p>;

  if (!evaluation) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-body text-text-muted">
          Aucune évaluation pour {personne.nomComplet} en {formaterPeriode(periode)}.
        </p>
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Création...' : "Démarrer l'évaluation"}
        </Button>
      </div>
    );
  }

  const categorieActuelle = categories?.[stepIndex];
  const dernierStep = (categories?.length ?? 1) - 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 flex flex-col gap-3 rounded-lg border border-border bg-bg-surface p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-h3 text-text-primary">{personne.nomComplet}</p>
            <p className="text-small text-text-muted">{formaterPeriode(periode)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-label text-text-muted">
              Score: {formaterScore(evaluation.scoreTotal)}
              {profil === 'VENDEUR' ? ' / 5' : ''}
            </span>
            {readOnly || progression === 100 ? (
              <RecommendationBadge decisionRh={evaluation.decisionRh} categorie={categoriserDecision(evaluation.decisionRh)} />
            ) : (
              <RecommendationBadge decisionRh="Notation en cours" categorie="neutral" />
            )}
            <ExportButtons
              className="flex items-center gap-1.5 border-l border-border pl-3"
              xlsxPath={`/evaluations/${evaluation.id}/export/xlsx`}
              pdfPath={`/evaluations/${evaluation.id}/export/pdf`}
              fallbackName={`evaluation-${periode}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Progress value={progression} className="flex-1" />
          <span className="whitespace-nowrap text-small text-text-muted">
            {nombreNotes}/{criteresPlats.length} critères notés
          </span>
        </div>

        {!readOnly && (
          <p className="text-small text-text-muted">
            {saveStatus === 'enregistrement' && 'Enregistrement...'}
            {saveStatus === 'enregistre' && 'Brouillon enregistré automatiquement'}
            {saveStatus === 'idle' && 'Les réponses sont enregistrées automatiquement'}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {categories?.map((categorie, index) => {
            const criteresCat = categorie.criteres;
            const notesCat = criteresCat.filter((c) => scores[c.id]?.score != null).length;
            const complet = notesCat === criteresCat.length;
            return (
              <button
                key={categorie.id}
                type="button"
                onClick={() => setStepIndex(index)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-small transition-colors',
                  index === stepIndex
                    ? 'border-brand-primary bg-brand-tint text-brand-primary'
                    : complet
                      ? 'border-border bg-bg-page text-success'
                      : 'border-border bg-bg-page text-text-muted hover:text-text-primary',
                )}
              >
                {complet ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                ) : (
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-small">{index + 1}</span>
                )}
                {categorie.nom}
              </button>
            );
          })}
        </div>
      </div>

      {categorieActuelle && (
        <div className="rounded-lg border border-border bg-bg-surface">
          <div className="flex flex-col gap-3 border-b border-border p-4">
            <p className="text-h3 text-text-primary">{categorieActuelle.nom}</p>
            <ScoreScaleLegend />
          </div>
          <div className="divide-y divide-border">
            {categorieActuelle.criteres.map((critere) => (
              <div key={critere.id} className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-body text-text-primary">{critere.libelle}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          disabled={readOnly}
                          onClick={() => handleScoreChange(critere.id, n)}
                          className={cn(
                            'h-8 w-8 rounded-md border text-label transition-colors',
                            scores[critere.id]?.score === n
                              ? 'border-brand-primary bg-brand-primary text-white'
                              : 'border-border bg-bg-surface text-text-muted hover:bg-bg-page',
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => toggleComment(critere.id)}
                        className="flex items-center gap-1 whitespace-nowrap text-small text-brand-primary hover:underline"
                      >
                        <MessageSquarePlus className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        {expandedComments.has(critere.id) ? 'Masquer le commentaire' : 'Ajouter un commentaire'}
                      </button>
                    )}
                  </div>
                </div>
                {(expandedComments.has(critere.id) || readOnly) && (scores[critere.id]?.commentaire || !readOnly) && (
                  <Textarea
                    placeholder="Commentaire (optionnel)"
                    value={scores[critere.id]?.commentaire ?? ''}
                    onChange={(e) => handleCommentChange(critere.id, e.target.value)}
                    disabled={readOnly}
                    className="min-h-10"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStepIndex((s) => Math.max(0, s - 1))}
          disabled={stepIndex === 0}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          Précédent
        </Button>

        {!readOnly && stepIndex < dernierStep && (
          <Button onClick={() => setStepIndex((s) => Math.min(dernierStep, s + 1))} className="gap-1.5">
            Suivant
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Button>
        )}

        {!readOnly && stepIndex === dernierStep && (
          <Button onClick={handleSubmit} disabled={saveMutation.isPending || submitMutation.isPending} className="gap-1.5">
            <Send className="h-4 w-4" strokeWidth={2} />
            {submitMutation.isPending ? 'Soumission...' : "Soumettre l'évaluation"}
          </Button>
        )}

        {readOnly && stepIndex < dernierStep && (
          <Button
            variant="outline"
            onClick={() => setStepIndex((s) => Math.min(dernierStep, s + 1))}
            className="gap-1.5"
          >
            Suivant
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Button>
        )}
      </div>

      {readOnly && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-small text-text-muted">
            Cette évaluation est {evaluation.statut === 'VALIDEE' ? 'validée' : 'soumise'} et ne peut plus être modifiée.
          </p>
          {isAdmin && evaluation.statut === 'SOUMISE' && (
            <Button variant="outline" onClick={() => setReopenDialogOpen(true)} className="gap-1.5 shrink-0">
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
              Réouvrir
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={reopenDialogOpen}
        onOpenChange={setReopenDialogOpen}
        title="Réouvrir cette évaluation ?"
        description="L'évaluation repasse en brouillon pour permettre de compléter ou corriger les notes, puis devra être resoumise."
        confirmLabel={reopenMutation.isPending ? 'Réouverture...' : 'Réouvrir'}
        isPending={reopenMutation.isPending}
        error={reopenMutation.isError ? (reopenMutation.error as Error).message : null}
        onConfirm={() => reopenMutation.mutate()}
      />
    </div>
  );
}
