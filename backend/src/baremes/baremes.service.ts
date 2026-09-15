import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfilEvaluation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBaremeDto, UpdateBaremeDto } from './dto/bareme.dto';

@Injectable()
export class BaremesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(typeProfil?: ProfilEvaluation) {
    return this.prisma.baremeNotation.findMany({
      where: typeProfil ? { typeProfil } : undefined,
      orderBy: [{ typeProfil: 'asc' }, { ordre: 'asc' }],
    });
  }

  create(dto: CreateBaremeDto) {
    return this.prisma.baremeNotation.create({ data: dto });
  }

  async update(id: string, dto: UpdateBaremeDto) {
    await this.getOrThrow(id);
    return this.prisma.baremeNotation.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    await this.prisma.baremeNotation.delete({ where: { id } });
    return { success: true };
  }

  private async getOrThrow(id: string) {
    const bareme = await this.prisma.baremeNotation.findUnique({ where: { id } });
    if (!bareme) throw new NotFoundException('Barème introuvable.');
    return bareme;
  }
}
