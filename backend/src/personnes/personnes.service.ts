import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Poste, ProfilEvaluation, TypeContrat } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { categoriserDecision } from '../scoring/scoring';
import { AuthenticatedUser } from '../auth/types';
import { assertBoutiqueAccess } from '../common/access-control';
import { CreatePersonneDto } from './dto/create-personne.dto';
import { UpdatePersonneDto } from './dto/update-personne.dto';
import { genererModeleImportXlsx, parserFeuillePersonnes, resoudrePoste, resoudreTypeContrat } from './personnes-import';

function profilPourPoste(poste: Poste): ProfilEvaluation | null {
  if (poste === Poste.GERANT) return ProfilEvaluation.GERANT;
  if (poste === Poste.VENDEUR) return ProfilEvaluation.VENDEUR;
  return null;
}

const POSTE_LABELS: Record<Poste, string> = {
  GERANT: 'Gérant(e)',
  ADJOINT: 'Adjoint(e)',
  VENDEUR: 'Vendeur(se)',
  FEMME_MENAGE: 'Femme de Ménage',
  VOITURIER: 'Voiturier',
  CHAUFFEUR: 'Chauffeur',
};

export interface LigneIgnoree {
  ligne: number;
  nom: string;
  raison: string;
}

export interface ResultatImport {
  ajoutes: number;
  ignorees: LigneIgnoree[];
}

@Injectable()
export class PersonnesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  findAllForBoutique(boutiqueId: string) {
    return this.prisma.personne.findMany({
      where: { boutiqueId },
      orderBy: [{ poste: 'asc' }, { nomComplet: 'asc' }],
    });
  }

  create(boutiqueId: string, dto: CreatePersonneDto) {
    return this.prisma.personne.create({ data: { ...dto, boutiqueId } });
  }

  async update(id: string, dto: UpdatePersonneDto, user: AuthenticatedUser) {
    const personne = await this.getOrThrow(id);
    assertBoutiqueAccess(user, personne.boutiqueId);
    return this.prisma.personne.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const personne = await this.getOrThrow(id);
    assertBoutiqueAccess(user, personne.boutiqueId);
    await this.prisma.personne.delete({ where: { id } });
    return { success: true };
  }

  async importerDepuisXlsx(boutiqueId: string, buffer: Buffer): Promise<ResultatImport> {
    const { lignes, erreurStructure } = await parserFeuillePersonnes(buffer);
    if (erreurStructure) throw new BadRequestException(erreurStructure);
    if (lignes.length === 0) {
      throw new BadRequestException('Aucune ligne à importer dans ce fichier.');
    }

    const grilles = await this.prisma.grillePoste.findMany();
    const salaireParPoste = new Map<Poste, number>();
    for (const [poste, label] of Object.entries(POSTE_LABELS) as [Poste, string][]) {
      const grille = grilles.find((g) => g.nomPoste === label);
      if (grille) salaireParPoste.set(poste, Number(grille.salaireNetMoyen));
    }

    const existants = new Set(
      (await this.prisma.personne.findMany({ where: { boutiqueId }, select: { nomComplet: true } })).map((p) =>
        p.nomComplet.trim().toLowerCase(),
      ),
    );

    const ignorees: LigneIgnoree[] = [];
    const aCreer: { nomComplet: string; poste: Poste; typeContrat: TypeContrat; ancienneteAnnees: number; salaireNet: number; boutiqueId: string; actif: boolean }[] = [];
    const vusDansLeFichier = new Set<string>();

    for (const ligneBrute of lignes) {
      const nom = ligneBrute.nomComplet;
      if (!nom) {
        ignorees.push({ ligne: ligneBrute.ligne, nom: '', raison: 'Nom manquant.' });
        continue;
      }
      if (!ligneBrute.posteRaw) {
        ignorees.push({ ligne: ligneBrute.ligne, nom, raison: 'Poste manquant.' });
        continue;
      }
      const poste = resoudrePoste(ligneBrute.posteRaw);
      if (!poste) {
        ignorees.push({
          ligne: ligneBrute.ligne,
          nom,
          raison: `Fonction / Grade "${ligneBrute.posteRaw}" non reconnu.`,
        });
        continue;
      }

      let typeContrat: TypeContrat = TypeContrat.CDI;
      if (ligneBrute.typeContratRaw) {
        const resolu = resoudreTypeContrat(ligneBrute.typeContratRaw);
        if (!resolu) {
          ignorees.push({
            ligne: ligneBrute.ligne,
            nom,
            raison: `Type contrat "${ligneBrute.typeContratRaw}" non reconnu (CDI, CDD ou Prestation).`,
          });
          continue;
        }
        typeContrat = resolu;
      }

      let ancienneteAnnees = 0;
      if (ligneBrute.ancienneteRaw) {
        const valeur = Number(ligneBrute.ancienneteRaw.replace(',', '.'));
        if (Number.isNaN(valeur) || valeur < 0) {
          ignorees.push({ ligne: ligneBrute.ligne, nom, raison: `Ancienneté "${ligneBrute.ancienneteRaw}" invalide.` });
          continue;
        }
        ancienneteAnnees = valeur;
      }

      let salaireNet = salaireParPoste.get(poste) ?? 0;
      if (ligneBrute.salaireRaw) {
        const valeur = Number(ligneBrute.salaireRaw.replace(/[^0-9,.-]/g, '').replace(',', '.'));
        if (Number.isNaN(valeur) || valeur < 0) {
          ignorees.push({ ligne: ligneBrute.ligne, nom, raison: `Salaire "${ligneBrute.salaireRaw}" invalide.` });
          continue;
        }
        salaireNet = valeur;
      }

      const cle = nom.trim().toLowerCase();
      if (existants.has(cle) || vusDansLeFichier.has(cle)) {
        ignorees.push({ ligne: ligneBrute.ligne, nom, raison: 'Une personne du même nom existe déjà.' });
        continue;
      }
      vusDansLeFichier.add(cle);
      aCreer.push({
        nomComplet: nom,
        poste,
        typeContrat,
        ancienneteAnnees,
        salaireNet,
        boutiqueId,
        actif: true,
      });
    }

    if (aCreer.length > 0) {
      await this.prisma.personne.createMany({ data: aCreer });
    }

    return { ajoutes: aCreer.length, ignorees };
  }

  async genererModeleImport(): Promise<Buffer> {
    return genererModeleImportXlsx();
  }

  /**
   * Full evaluation history for one person: every evaluation they've had, oldest first, each with
   * its computed score/décision and the full critère-by-critère breakdown - the raw material for
   * the per-personne trend chart and per-critère heatmap on the frontend.
   */
  async getHistorique(id: string, user: AuthenticatedUser) {
    const personne = await this.prisma.personne.findUnique({
      where: { id },
      include: {
        evaluations: {
          orderBy: [{ periode: 'asc' }, { createdAt: 'asc' }],
          include: { scores: { include: { critere: { include: { categorie: true } } } } },
        },
      },
    });
    if (!personne) throw new NotFoundException('Personne introuvable.');
    assertBoutiqueAccess(user, personne.boutiqueId);

    const profil = profilPourPoste(personne.poste);
    const scoreMax = profil === 'GERANT' ? 145 : profil === 'VENDEUR' ? 5 : null;

    const evaluations = await Promise.all(
      personne.evaluations.map(async (evaluation) => {
        const scoreTotal = profil
          ? this.scoring.calculerScore(
              profil,
              evaluation.scores.map((s) => s.score),
            )
          : null;
        const decisionRh = profil ? await this.scoring.resoudreDecision(scoreTotal, profil) : 'Non applicable';
        const criteres = evaluation.scores
          .map((s) => ({
            critereId: s.critereId,
            libelle: s.critere.libelle,
            categorieNom: s.critere.categorie.nom,
            categorieOrdre: s.critere.categorie.ordreAffichage,
            ordreAffichage: s.critere.ordreAffichage,
            score: s.score,
          }))
          .sort((a, b) => a.categorieOrdre - b.categorieOrdre || a.ordreAffichage - b.ordreAffichage);

        return {
          id: evaluation.id,
          periode: evaluation.periode,
          statut: evaluation.statut,
          dateSoumission: evaluation.dateSoumission,
          scoreTotal,
          decisionRh,
          categorieDecision: categoriserDecision(decisionRh),
          criteres,
        };
      }),
    );

    const { evaluations: _omit, ...personneSansEvaluations } = personne;
    return { personne: personneSansEvaluations, profil, scoreMax, evaluations };
  }

  private async getOrThrow(id: string) {
    const personne = await this.prisma.personne.findUnique({ where: { id } });
    if (!personne) throw new NotFoundException('Personne introuvable.');
    return personne;
  }
}
