import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types';
import { assertBoutiqueAccess } from '../common/access-control';
import { CreateBoutiqueDto } from './dto/create-boutique.dto';
import { UpdateBoutiqueDto } from './dto/update-boutique.dto';

@Injectable()
export class BoutiquesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(user: AuthenticatedUser) {
    return this.prisma.boutique.findMany({
      where: user.boutiqueId ? { id: user.boutiqueId } : undefined,
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    assertBoutiqueAccess(user, id);
    const boutique = await this.prisma.boutique.findUnique({ where: { id } });
    if (!boutique) throw new NotFoundException('Boutique introuvable.');
    return boutique;
  }

  create(dto: CreateBoutiqueDto) {
    return this.prisma.boutique.create({ data: dto });
  }

  async update(id: string, dto: UpdateBoutiqueDto) {
    await this.getOrThrow(id);
    return this.prisma.boutique.update({ where: { id }, data: dto });
  }

  /**
   * A boutique with staff can't be deleted outright: Personne cascades to Evaluation/PlanActionRH
   * at the DB level, so a stray delete would silently wipe years of evaluation history. Admins
   * must empty the roster first (Effectif tab) - an explicit, visible step instead of a hidden
   * cascade. Any Utilisateur (GERANT) still scoped to this boutique is deactivated before the
   * delete, since the FK is ON DELETE SET NULL and a null boutiqueId means unrestricted
   * multi-boutique access (the same value ADMIN_RH/DIRECTEUR_REGIONAL use) - leaving that account
   * active would silently upgrade its access instead of removing it.
   */
  async remove(id: string) {
    await this.getOrThrow(id);

    const effectif = await this.prisma.personne.count({ where: { boutiqueId: id } });
    if (effectif > 0) {
      throw new BadRequestException(
        `Impossible de supprimer cette boutique : ${effectif} personne(s) y sont encore rattachée(s). Videz d'abord l'effectif.`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.utilisateur.updateMany({ where: { boutiqueId: id }, data: { actif: false } }),
      this.prisma.boutique.delete({ where: { id } }),
    ]);
    return { success: true };
  }

  private async getOrThrow(id: string) {
    const boutique = await this.prisma.boutique.findUnique({ where: { id } });
    if (!boutique) throw new NotFoundException('Boutique introuvable.');
    return boutique;
  }
}
