import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrillePosteDto, UpdateGrillePosteDto } from './dto/grille-poste.dto';

@Injectable()
export class GrillePostesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.grillePoste.findMany({ orderBy: { nomPoste: 'asc' } });
  }

  create(dto: CreateGrillePosteDto) {
    return this.prisma.grillePoste.create({ data: dto });
  }

  async update(id: string, dto: UpdateGrillePosteDto) {
    await this.getOrThrow(id);
    return this.prisma.grillePoste.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    await this.prisma.grillePoste.delete({ where: { id } });
    return { success: true };
  }

  private async getOrThrow(id: string) {
    const grille = await this.prisma.grillePoste.findUnique({ where: { id } });
    if (!grille) throw new NotFoundException('Grille de poste introuvable.');
    return grille;
  }
}
