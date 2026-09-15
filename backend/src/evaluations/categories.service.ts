import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProfilEvaluation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategorieDto, UpdateCategorieDto } from './dto/categorie.dto';
import { CreateCritereDto, UpdateCritereDto } from './dto/critere.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(applicableA?: ProfilEvaluation) {
    return this.prisma.categorieEvaluation.findMany({
      where: applicableA ? { applicableA } : undefined,
      orderBy: { ordreAffichage: 'asc' },
      include: { criteres: { orderBy: { ordreAffichage: 'asc' } } },
    });
  }

  async createCategorie(dto: CreateCategorieDto) {
    await this.verifierNomCategorieUnique(dto.nom, dto.applicableA);
    const ordreAffichage = dto.ordreAffichage ?? (await this.prochainOrdreCategorie(dto.applicableA));
    return this.prisma.categorieEvaluation.create({ data: { ...dto, ordreAffichage } });
  }

  async updateCategorie(id: string, dto: UpdateCategorieDto) {
    const categorie = await this.getCategorieOrThrow(id);
    if (dto.nom !== undefined || dto.applicableA !== undefined) {
      await this.verifierNomCategorieUnique(
        dto.nom ?? categorie.nom,
        dto.applicableA ?? categorie.applicableA,
        id,
      );
    }
    return this.prisma.categorieEvaluation.update({ where: { id }, data: dto });
  }

  async removeCategorie(id: string) {
    await this.getCategorieOrThrow(id);
    const criteres = await this.prisma.critereEvaluation.findMany({
      where: { categorieId: id },
      select: { scores: { select: { id: true, score: true, evaluation: { select: { statut: true } } } } },
    });

    // Une évaluation brouillon pré-crée une ligne de score vide (score NULL) pour chaque
    // critère de la grille : ces références ne portent aucune donnée et ne doivent pas
    // empêcher la suppression. En revanche un score renseigné ou une évaluation soumise/
    // validée rend la suppression impossible.
    const referencesVides = criteres.flatMap((c) =>
      c.scores.filter((s) => s.score === null && s.evaluation.statut === 'BROUILLON').map((s) => s.id),
    );
    if (referencesVides.length > 0) {
      await this.prisma.scoreCritere.deleteMany({ where: { id: { in: referencesVides } } });
    }

    const referencesReelles = criteres.reduce((n, c) => n + c.scores.length, 0) - referencesVides.length;
    if (referencesReelles > 0) {
      throw new ConflictException(
        `Des critères de cette catégorie sont notés ou référencés dans ${referencesReelles} évaluation(s) ` +
          `existante(s) (soumises ou validées). Clôturez ces évaluations avant de supprimer la catégorie.`,
      );
    }
    await this.prisma.categorieEvaluation.delete({ where: { id } });
    return { success: true };
  }

  async createCritere(dto: CreateCritereDto) {
    await this.getCategorieOrThrow(dto.categorieId);
    await this.verifierLibelleCritereUnique(dto.categorieId, dto.libelle);
    const ordreAffichage = dto.ordreAffichage ?? (await this.prochainOrdreCritere(dto.categorieId));
    return this.prisma.critereEvaluation.create({ data: { ...dto, ordreAffichage } });
  }

  async updateCritere(id: string, dto: UpdateCritereDto) {
    const critere = await this.getCritereOrThrow(id);
    if (dto.categorieId !== undefined) {
      await this.getCategorieOrThrow(dto.categorieId);
    }
    if (dto.libelle !== undefined || dto.categorieId !== undefined) {
      await this.verifierLibelleCritereUnique(
        dto.categorieId ?? critere.categorieId,
        dto.libelle ?? critere.libelle,
        id,
      );
    }
    return this.prisma.critereEvaluation.update({ where: { id }, data: dto });
  }

  async removeCritere(id: string) {
    const critere = await this.getCritereOrThrow(id);
    const references = await this.prisma.scoreCritere.findMany({
      where: { critereId: id },
      select: { id: true, score: true, evaluation: { select: { statut: true } } },
    });

    // Voir removeCategorie : les lignes de score vides créées par des évaluations brouillon
    // sont retirées avec le critère (aucune donnée perdue) ; toute référence réelle bloque.
    const referencesVides = references.filter((r) => r.score === null && r.evaluation.statut === 'BROUILLON');
    if (referencesVides.length > 0) {
      await this.prisma.scoreCritere.deleteMany({ where: { id: { in: referencesVides.map((r) => r.id) } } });
    }

    const referencesReelles = references.length - referencesVides.length;
    if (referencesReelles > 0) {
      throw new ConflictException(
        `Ce critère est noté ou référencé dans ${referencesReelles} évaluation(s) existante(s) ` +
          `(soumises ou validées). Clôturez ces évaluations avant de supprimer ce critère.`,
      );
    }
    await this.prisma.critereEvaluation.delete({ where: { id } });
    return { success: true };
  }

  private async getCategorieOrThrow(id: string) {
    const categorie = await this.prisma.categorieEvaluation.findUnique({ where: { id } });
    if (!categorie) throw new NotFoundException('Catégorie introuvable.');
    return categorie;
  }

  private async getCritereOrThrow(id: string) {
    const critere = await this.prisma.critereEvaluation.findUnique({ where: { id } });
    if (!critere) throw new NotFoundException('Critère introuvable.');
    return critere;
  }

  private async verifierNomCategorieUnique(nom: string, applicableA: ProfilEvaluation, exclureId?: string) {
    const doublon = await this.prisma.categorieEvaluation.findFirst({
      where: {
        nom: { equals: nom.trim(), mode: 'insensitive' },
        applicableA,
        id: exclureId ? { not: exclureId } : undefined,
      },
    });
    if (doublon) {
      throw new ConflictException(
        `Une catégorie « ${nom.trim()} » existe déjà pour ce profil. Choisissez un nom différent.`,
      );
    }
  }

  private async verifierLibelleCritereUnique(categorieId: string, libelle: string, exclureId?: string) {
    const doublon = await this.prisma.critereEvaluation.findFirst({
      where: {
        categorieId,
        libelle: { equals: libelle.trim(), mode: 'insensitive' },
        id: exclureId ? { not: exclureId } : undefined,
      },
    });
    if (doublon) {
      throw new ConflictException(
        `Le critère « ${libelle.trim()} » existe déjà dans cette catégorie. Choisissez un libellé différent.`,
      );
    }
  }

  private async prochainOrdreCategorie(applicableA: ProfilEvaluation) {
    const dernier = await this.prisma.categorieEvaluation.findFirst({
      where: { applicableA },
      orderBy: { ordreAffichage: 'desc' },
    });
    return (dernier?.ordreAffichage ?? 0) + 1;
  }

  private async prochainOrdreCritere(categorieId: string) {
    const dernier = await this.prisma.critereEvaluation.findFirst({
      where: { categorieId },
      orderBy: { ordreAffichage: 'desc' },
    });
    return (dernier?.ordreAffichage ?? 0) + 1;
  }
}