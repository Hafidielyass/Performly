import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Poste, ProfilEvaluation, StatutEvaluation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { AuthenticatedUser } from '../auth/types';
import { assertBoutiqueAccess } from '../common/access-control';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpsertScoresDto } from './dto/upsert-scores.dto';

function profilPourPoste(poste: Poste): ProfilEvaluation | null {
  if (poste === Poste.GERANT) return ProfilEvaluation.GERANT;
  if (poste === Poste.VENDEUR) return ProfilEvaluation.VENDEUR;
  return null;
}

@Injectable()
export class EvaluationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  async findAllForBoutique(boutiqueId: string, filters: { personneId?: string; periode?: string }) {
    const evaluations = await this.prisma.evaluation.findMany({
      where: {
        personne: { boutiqueId },
        personneId: filters.personneId,
        periode: filters.periode,
      },
      include: { personne: true, scores: true },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(evaluations.map((evaluation) => this.enrichir(evaluation)));
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const evaluation = await this.getOrThrow(id);
    assertBoutiqueAccess(user, evaluation.personne.boutiqueId);
    return this.enrichir(evaluation);
  }

  async create(boutiqueId: string, dto: CreateEvaluationDto, user: AuthenticatedUser) {
    const personne = await this.prisma.personne.findUnique({ where: { id: dto.personneId } });
    if (!personne || personne.boutiqueId !== boutiqueId) {
      throw new NotFoundException('Personne introuvable dans cette boutique.');
    }
    if (!profilPourPoste(personne.poste)) {
      throw new BadRequestException("Ce poste n'a pas de grille d'évaluation (Gérant(e) ou Vendeur(se) uniquement).");
    }
    return this.prisma.evaluation.create({
      data: {
        personneId: personne.id,
        evaluateurId: user.id,
        periode: dto.periode,
        statut: StatutEvaluation.BROUILLON,
      },
      include: { personne: true, scores: true },
    });
  }

  async upsertScores(evaluationId: string, dto: UpsertScoresDto, user: AuthenticatedUser) {
    const evaluation = await this.getOrThrow(evaluationId);
    assertBoutiqueAccess(user, evaluation.personne.boutiqueId);
    if (evaluation.statut !== StatutEvaluation.BROUILLON) {
      throw new ForbiddenException('Impossible de modifier une évaluation déjà soumise.');
    }

    await this.prisma.$transaction(
      dto.scores.map((item) =>
        this.prisma.scoreCritere.upsert({
          where: { evaluationId_critereId: { evaluationId, critereId: item.critereId } },
          create: {
            evaluationId,
            critereId: item.critereId,
            score: item.score ?? null,
            commentaire: item.commentaire ?? null,
          },
          update: {
            score: item.score ?? null,
            commentaire: item.commentaire ?? null,
          },
        }),
      ),
    );

    return this.findOne(evaluationId, user);
  }

  async submit(evaluationId: string, user: AuthenticatedUser) {
    const evaluation = await this.getOrThrow(evaluationId);
    assertBoutiqueAccess(user, evaluation.personne.boutiqueId);
    if (evaluation.statut !== StatutEvaluation.BROUILLON) {
      throw new ForbiddenException('Cette évaluation a déjà été soumise.');
    }
    await this.prisma.evaluation.update({
      where: { id: evaluationId },
      data: { statut: StatutEvaluation.SOUMISE, dateSoumission: new Date() },
    });
    return this.findOne(evaluationId, user);
  }

  // Lets an admin correct a submitted evaluation that was saved incomplete (e.g. a client-side
  // race dropped a score before submit) without a direct database edit. Deliberately restricted to
  // SOUMISE: a VALIDEE evaluation may already have a PlanActionRH built from its decision, so
  // reopening it could silently invalidate RH decisions already acted on.
  async reouvrir(evaluationId: string) {
    const evaluation = await this.getOrThrow(evaluationId);
    if (evaluation.statut !== StatutEvaluation.SOUMISE) {
      throw new ForbiddenException('Seule une évaluation soumise (non validée) peut être réouverte.');
    }
    const planExistant = await this.prisma.planActionRH.findFirst({ where: { evaluationId } });
    if (planExistant) {
      throw new ForbiddenException(
        "Un plan d'action RH existe déjà pour cette évaluation ; elle ne peut plus être réouverte.",
      );
    }
    await this.prisma.evaluation.update({
      where: { id: evaluationId },
      data: { statut: StatutEvaluation.BROUILLON, dateSoumission: null },
    });
    return this.prisma.evaluation.findUnique({ where: { id: evaluationId } });
  }

  async valider(evaluationId: string) {
    const evaluation = await this.getOrThrow(evaluationId);
    if (evaluation.statut !== StatutEvaluation.SOUMISE) {
      throw new ForbiddenException('Seule une évaluation soumise peut être validée.');
    }
    await this.prisma.evaluation.update({
      where: { id: evaluationId },
      data: { statut: StatutEvaluation.VALIDEE },
    });
    return this.prisma.evaluation.findUnique({ where: { id: evaluationId } });
  }

  private async getOrThrow(id: string) {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id },
      include: { personne: true, scores: true },
    });
    if (!evaluation) throw new NotFoundException('Évaluation introuvable.');
    return evaluation;
  }

  private async enrichir<
    T extends { personne: { poste: Poste }; scores: { score: number | null }[] },
  >(evaluation: T) {
    const profil = profilPourPoste(evaluation.personne.poste);
    if (!profil) return { ...evaluation, scoreTotal: null, decisionRh: 'Non applicable' };

    const score = this.scoring.calculerScore(
      profil,
      evaluation.scores.map((s) => s.score),
    );
    const decisionRh = await this.scoring.resoudreDecision(score, profil);
    return { ...evaluation, scoreTotal: score, decisionRh };
  }
}
