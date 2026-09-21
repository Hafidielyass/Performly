import { Injectable, NotFoundException } from '@nestjs/common';
import { Poste, ProfilEvaluation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { categoriserDecision } from '../scoring/scoring';
import { AuthenticatedUser } from '../auth/types';
import { assertBoutiqueAccess } from '../common/access-control';

function profilPourPoste(poste: Poste): ProfilEvaluation | null {
  if (poste === Poste.GERANT) return ProfilEvaluation.GERANT;
  if (poste === Poste.VENDEUR) return ProfilEvaluation.VENDEUR;
  return null;
}

/**
 * Périodes mix two formats - "2026-09" (mois) et "2026-T2" (trimestre). A plain
 * lexicographic sort puts "2026-T2" after "2026-09" because 'T' > '0', so reversing it
 * made an April-June quarter look more recent than September. The dashboards default to
 * the first entry, which meant they opened on the wrong période. Ordering therefore has
 * to be chronological: a quarter is ranked by the last month it covers.
 */
function rangChronologique(periode: string): [number, number] {
  const trimestre = /^(\d{4})-T([1-4])$/.exec(periode);
  if (trimestre) return [Number(trimestre[1]), Number(trimestre[2]) * 3];
  const mois = /^(\d{4})-(\d{2})$/.exec(periode);
  if (mois) return [Number(mois[1]), Number(mois[2])];
  return [0, 0];
}

export function trierPeriodesDesc(periodes: string[]): string[] {
  return [...periodes].sort((a, b) => {
    const [anneeA, moisA] = rangChronologique(a);
    const [anneeB, moisB] = rangChronologique(b);
    if (anneeA !== anneeB) return anneeB - anneeA;
    if (moisA !== moisB) return moisB - moisA;
    return b.localeCompare(a);
  });
}

export interface LignePersonne {
  personneId: string;
  nomComplet: string;
  poste: Poste;
  scoreActuel: number | null;
  decisionRh: string;
  categorie: ReturnType<typeof categoriserDecision>;
  derniereEvaluationId: string | null;
  periode: string | null;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  /**
   * With no `periode`, each person's single most recent evaluation is used
   * (legacy "current status" view). With a `periode`, the dashboard becomes a
   * snapshot of that exact month/period - a person with no evaluation for it
   * shows as "Pas encore évalué(e)" rather than falling back to a different
   * period's score, so month-to-month comparisons stay honest.
   */
  async getForBoutique(boutiqueId: string, user: AuthenticatedUser, periode?: string) {
    assertBoutiqueAccess(user, boutiqueId);
    const boutique = await this.prisma.boutique.findUnique({ where: { id: boutiqueId } });
    if (!boutique) throw new NotFoundException('Boutique introuvable.');

    const personnes = await this.prisma.personne.findMany({
      where: { boutiqueId, actif: true },
      include: {
        evaluations: {
          where: periode ? { periode } : undefined,
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { scores: true },
        },
      },
    });

    const lignes: LignePersonne[] = [];
    for (const personne of personnes) {
      const profil = profilPourPoste(personne.poste);
      const derniereEvaluation = personne.evaluations[0] ?? null;
      if (!profil) {
        lignes.push({
          personneId: personne.id,
          nomComplet: personne.nomComplet,
          poste: personne.poste,
          scoreActuel: null,
          decisionRh: 'Non applicable',
          categorie: 'neutral',
          derniereEvaluationId: null,
          periode: null,
        });
        continue;
      }
      const score = derniereEvaluation
        ? this.scoring.calculerScore(
            profil,
            derniereEvaluation.scores.map((s) => s.score),
          )
        : null;
      const decisionRh = await this.scoring.resoudreDecision(score, profil);
      lignes.push({
        personneId: personne.id,
        nomComplet: personne.nomComplet,
        poste: personne.poste,
        scoreActuel: score,
        decisionRh,
        categorie: categoriserDecision(decisionRh),
        derniereEvaluationId: derniereEvaluation?.id ?? null,
        periode: derniereEvaluation?.periode ?? null,
      });
    }

    const repartition = { success: 0, warning: 0, danger: 0, neutral: 0 };
    for (const ligne of lignes) repartition[ligne.categorie] += 1;

    return {
      boutique,
      effectifTotal: personnes.length,
      repartition,
      personnes: lignes,
    };
  }

  async getConsolide(periode?: string) {
    const boutiques = await this.prisma.boutique.findMany({ orderBy: { nom: 'asc' } });
    const admin: AuthenticatedUser = { id: 'system', email: 'system', role: 'ADMIN_RH' as any, boutiqueId: null };
    return Promise.all(
      boutiques.map(async (boutique) => {
        const detail = await this.getForBoutique(boutique.id, admin, periode);
        return {
          boutiqueId: boutique.id,
          nom: boutique.nom,
          effectifTotal: detail.effectifTotal,
          repartition: detail.repartition,
        };
      }),
    );
  }

  async getPeriodesPourBoutique(boutiqueId: string, user: AuthenticatedUser): Promise<string[]> {
    assertBoutiqueAccess(user, boutiqueId);
    const rows = await this.prisma.evaluation.findMany({
      where: { personne: { boutiqueId } },
      select: { periode: true },
      distinct: ['periode'],
    });
    return trierPeriodesDesc(rows.map((r) => r.periode));
  }

  async getPeriodesReseau(): Promise<string[]> {
    const rows = await this.prisma.evaluation.findMany({
      select: { periode: true },
      distinct: ['periode'],
    });
    return trierPeriodesDesc(rows.map((r) => r.periode));
  }
}
