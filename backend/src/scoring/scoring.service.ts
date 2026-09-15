import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BaremeRange,
  ProfilEvaluation,
  calculerScoreGerant,
  calculerScoreVendeur,
  resoudreDecisionRH,
} from './scoring';

/**
 * Single entry point for all score computation. No controller/UI code should compute
 * scores itself - always go through this service so the Gerant(e)/Vendeur(se) formulas
 * and decision bands stay in one place.
 */
@Injectable()
export class ScoringService {
  constructor(private readonly prisma: PrismaService) {}

  calculerScore(profil: ProfilEvaluation, scores: (number | null)[]): number | null {
    return profil === 'GERANT' ? calculerScoreGerant(scores) : calculerScoreVendeur(scores);
  }

  async resoudreDecision(score: number | null, profil: ProfilEvaluation): Promise<string> {
    const baremes = await this.chargerBaremes(profil);
    return resoudreDecisionRH(score, profil, baremes);
  }

  private async chargerBaremes(typeProfil: ProfilEvaluation): Promise<BaremeRange[]> {
    const rows = await this.prisma.baremeNotation.findMany({ where: { typeProfil } });
    return rows.map((r) => ({
      typeProfil: r.typeProfil as ProfilEvaluation,
      borneMin: Number(r.borneMin),
      borneMax: Number(r.borneMax),
      decisionRh: r.decisionRh,
    }));
  }
}
