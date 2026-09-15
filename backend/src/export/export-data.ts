import { NotFoundException } from '@nestjs/common';
import { Poste, ProfilEvaluation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { categoriserDecision, CategorieDecision } from '../scoring/scoring';

/** Gérant(e) scores are always whole (a sum); Vendeur(se) scores are an average and can repeat
 * forever (e.g. 11/3) - round only when needed so exports never print "3.6666666666666665". */
export function formaterScore(score: number | null): string {
  if (score === null) return '—';
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}

function profilPourPoste(poste: Poste): ProfilEvaluation | null {
  if (poste === Poste.GERANT) return ProfilEvaluation.GERANT;
  if (poste === Poste.VENDEUR) return ProfilEvaluation.VENDEUR;
  return null;
}

export interface LigneExport {
  libelle: string;
  score: number | null;
  commentaire: string | null;
}

export interface CategorieExport {
  nom: string;
  criteres: LigneExport[];
}

export interface EvaluationExportData {
  evaluationId: string;
  boutiqueId: string;
  boutiqueNom: string;
  personneNom: string;
  posteLabel: string;
  profil: ProfilEvaluation | null;
  periode: string;
  statutLabel: string;
  evaluateurEmail: string;
  dateSoumission: Date | null;
  categories: CategorieExport[];
  scoreTotal: number | null;
  scoreMax: number | null;
  decisionRh: string;
  categorieDecision: CategorieDecision;
}

const POSTE_LABELS: Record<Poste, string> = {
  GERANT: 'Gérant(e)',
  ADJOINT: 'Adjoint(e)',
  VENDEUR: 'Vendeur(se)',
  FEMME_MENAGE: 'Femme de Ménage',
  VOITURIER: 'Voiturier',
  CHAUFFEUR: 'Chauffeur',
};

const STATUT_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  SOUMISE: 'Soumise',
  VALIDEE: 'Validée',
};

export interface LignePersonneExport {
  personneNom: string;
  posteLabel: string;
  scoreTotal: number | null;
  scoreMax: number | null;
  decisionRh: string;
  categorieDecision: CategorieDecision;
  detail: EvaluationExportData | null;
}

export interface BoutiqueExportData {
  boutiqueId: string;
  boutiqueNom: string;
  periode: string;
  genereLe: Date;
  lignes: LignePersonneExport[];
}

/**
 * Single source of truth for what goes into an evaluation export - both the
 * XLSX and PDF generators read from this so the two formats never drift
 * apart on numbers or wording.
 */
export async function chargerDonneesExport(
  prisma: PrismaService,
  scoring: ScoringService,
  evaluationId: string,
): Promise<EvaluationExportData> {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      personne: { include: { boutique: true } },
      evaluateur: true,
      scores: { include: { critere: { include: { categorie: true } } } },
    },
  });
  if (!evaluation) throw new NotFoundException('Évaluation introuvable.');

  const profil = profilPourPoste(evaluation.personne.poste);

  const categoriesMap = new Map<string, CategorieExport & { ordre: number }>();
  for (const score of evaluation.scores) {
    const categorie = score.critere.categorie;
    if (!categoriesMap.has(categorie.id)) {
      categoriesMap.set(categorie.id, { nom: categorie.nom, ordre: categorie.ordreAffichage, criteres: [] });
    }
    categoriesMap.get(categorie.id)!.criteres.push({
      libelle: score.critere.libelle,
      score: score.score,
      commentaire: score.commentaire,
    });
  }
  const categories = [...categoriesMap.values()]
    .sort((a, b) => a.ordre - b.ordre)
    .map(({ nom, criteres }) => ({ nom, criteres }));

  const scoreTotal = profil
    ? scoring.calculerScore(
        profil,
        evaluation.scores.map((s) => s.score),
      )
    : null;
  const decisionRh = profil ? await scoring.resoudreDecision(scoreTotal, profil) : 'Non applicable';

  return {
    evaluationId: evaluation.id,
    boutiqueId: evaluation.personne.boutiqueId,
    boutiqueNom: evaluation.personne.boutique.nom,
    personneNom: evaluation.personne.nomComplet,
    posteLabel: POSTE_LABELS[evaluation.personne.poste],
    profil,
    periode: evaluation.periode,
    statutLabel: STATUT_LABELS[evaluation.statut] ?? evaluation.statut,
    evaluateurEmail: evaluation.evaluateur.email,
    dateSoumission: evaluation.dateSoumission,
    categories,
    scoreTotal,
    scoreMax: profil === 'GERANT' ? 145 : profil === 'VENDEUR' ? 5 : null,
    decisionRh,
    categorieDecision: categoriserDecision(decisionRh),
  };
}

/**
 * One boutique, one period: every active Gérant(e)/Vendeur(se) with their
 * score/décision for that exact month, plus the full criterion breakdown for
 * whoever actually has an evaluation submitted for it. People without one
 * still show up ("Pas encore évalué(e)") so the export doubles as a
 * completion checklist for the month, not just a report of what's done.
 */
export async function chargerDonneesExportBoutique(
  prisma: PrismaService,
  scoring: ScoringService,
  boutiqueId: string,
  periode: string,
): Promise<BoutiqueExportData> {
  const boutique = await prisma.boutique.findUnique({ where: { id: boutiqueId } });
  if (!boutique) throw new NotFoundException('Boutique introuvable.');

  const personnes = await prisma.personne.findMany({
    where: { boutiqueId, actif: true },
    include: {
      evaluations: { where: { periode }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: [{ poste: 'asc' }, { nomComplet: 'asc' }],
  });

  const lignes: LignePersonneExport[] = [];
  for (const personne of personnes) {
    const profil = profilPourPoste(personne.poste);
    const posteLabel = POSTE_LABELS[personne.poste];
    if (!profil) {
      lignes.push({
        personneNom: personne.nomComplet,
        posteLabel,
        scoreTotal: null,
        scoreMax: null,
        decisionRh: 'Non applicable',
        categorieDecision: 'neutral',
        detail: null,
      });
      continue;
    }
    const evaluation = personne.evaluations[0];
    if (!evaluation) {
      lignes.push({
        personneNom: personne.nomComplet,
        posteLabel,
        scoreTotal: null,
        scoreMax: profil === 'GERANT' ? 145 : 5,
        decisionRh: 'Pas encore évalué(e)',
        categorieDecision: 'neutral',
        detail: null,
      });
      continue;
    }
    const detail = await chargerDonneesExport(prisma, scoring, evaluation.id);
    lignes.push({
      personneNom: personne.nomComplet,
      posteLabel,
      scoreTotal: detail.scoreTotal,
      scoreMax: detail.scoreMax,
      decisionRh: detail.decisionRh,
      categorieDecision: detail.categorieDecision,
      detail,
    });
  }

  return { boutiqueId: boutique.id, boutiqueNom: boutique.nom, periode, genereLe: new Date(), lignes };
}
