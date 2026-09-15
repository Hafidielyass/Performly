import { Injectable, NotFoundException } from '@nestjs/common';
import { Poste, ProfilEvaluation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { AuthenticatedUser } from '../auth/types';
import { assertBoutiqueAccess } from '../common/access-control';
import { CreatePlanActionDto, UpdatePlanActionDto } from './dto/plan-action.dto';

function profilPourPoste(poste: Poste): ProfilEvaluation | null {
  if (poste === Poste.GERANT) return ProfilEvaluation.GERANT;
  if (poste === Poste.VENDEUR) return ProfilEvaluation.VENDEUR;
  return null;
}

@Injectable()
export class PlansActionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  findAllForBoutique(boutiqueId: string) {
    return this.prisma.planActionRH.findMany({
      where: { personne: { boutiqueId } },
      include: { personne: true, evaluation: true },
      orderBy: { dateSuivi: 'asc' },
    });
  }

  async create(dto: CreatePlanActionDto, user: AuthenticatedUser) {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id: dto.evaluationId },
      include: { personne: true, scores: true },
    });
    if (!evaluation || evaluation.personneId !== dto.personneId) {
      throw new NotFoundException("Évaluation introuvable pour cette personne.");
    }
    assertBoutiqueAccess(user, evaluation.personne.boutiqueId);

    const profil = profilPourPoste(evaluation.personne.poste);
    const score = profil
      ? this.scoring.calculerScore(
          profil,
          evaluation.scores.map((s) => s.score),
        )
      : null;
    const decisionRh = profil ? await this.scoring.resoudreDecision(score, profil) : 'Non applicable';

    return this.prisma.planActionRH.create({
      data: {
        personneId: dto.personneId,
        evaluationId: dto.evaluationId,
        scoreActuel: score,
        decisionRh,
        formationPrioritaire: dto.formationPrioritaire,
        delaiRevue: dto.delaiRevue,
        dateSuivi: new Date(dto.dateSuivi),
        decisionFinale: dto.decisionFinale ?? null,
      },
    });
  }

  async update(id: string, dto: UpdatePlanActionDto, user: AuthenticatedUser) {
    const plan = await this.getOrThrow(id);
    assertBoutiqueAccess(user, plan.personne.boutiqueId);
    const { personneId, evaluationId, dateSuivi, ...rest } = dto;
    return this.prisma.planActionRH.update({
      where: { id },
      data: {
        ...rest,
        ...(dateSuivi ? { dateSuivi: new Date(dateSuivi) } : {}),
      },
    });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const plan = await this.getOrThrow(id);
    assertBoutiqueAccess(user, plan.personne.boutiqueId);
    await this.prisma.planActionRH.delete({ where: { id } });
    return { success: true };
  }

  private async getOrThrow(id: string) {
    const plan = await this.prisma.planActionRH.findUnique({
      where: { id },
      include: { personne: true },
    });
    if (!plan) throw new NotFoundException('Plan d\'action introuvable.');
    return plan;
  }
}
