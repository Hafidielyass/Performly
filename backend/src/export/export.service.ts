import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { AuthenticatedUser } from '../auth/types';
import { assertBoutiqueAccess } from '../common/access-control';
import { chargerDonneesExport, chargerDonneesExportBoutique } from './export-data';
import { genererEvaluationXlsx, genererBoutiqueExportXlsx } from './xlsx-export';
import { genererEvaluationPdf, genererBoutiqueExportPdf } from './pdf-export';

// Combining diacritical marks (U+0300-U+036F), built from char codes to keep this file plain ASCII.
const DIACRITIQUES = new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, 'g');

function slugifier(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(DIACRITIQUES, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  async exporterXlsx(evaluationId: string, user: AuthenticatedUser) {
    const data = await chargerDonneesExport(this.prisma, this.scoring, evaluationId);
    assertBoutiqueAccess(user, data.boutiqueId);
    const nom = `evaluation-${slugifier(data.personneNom)}-${data.periode}`;
    return { buffer: await genererEvaluationXlsx(data), nomFichier: `${nom}.xlsx` };
  }

  async exporterPdf(evaluationId: string, user: AuthenticatedUser) {
    const data = await chargerDonneesExport(this.prisma, this.scoring, evaluationId);
    assertBoutiqueAccess(user, data.boutiqueId);
    const nom = `evaluation-${slugifier(data.personneNom)}-${data.periode}`;
    return { buffer: await genererEvaluationPdf(data), nomFichier: `${nom}.pdf` };
  }

  async exporterBoutiqueXlsx(boutiqueId: string, periode: string, user: AuthenticatedUser) {
    assertBoutiqueAccess(user, boutiqueId);
    const data = await chargerDonneesExportBoutique(this.prisma, this.scoring, boutiqueId, periode);
    const nom = `evaluations-${slugifier(data.boutiqueNom)}-${periode}`;
    return { buffer: await genererBoutiqueExportXlsx(data), nomFichier: `${nom}.xlsx` };
  }

  async exporterBoutiquePdf(boutiqueId: string, periode: string, user: AuthenticatedUser) {
    assertBoutiqueAccess(user, boutiqueId);
    const data = await chargerDonneesExportBoutique(this.prisma, this.scoring, boutiqueId, periode);
    const nom = `evaluations-${slugifier(data.boutiqueNom)}-${periode}`;
    return { buffer: await genererBoutiqueExportPdf(data), nomFichier: `${nom}.pdf` };
  }
}
