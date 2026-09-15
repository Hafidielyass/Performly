import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.utilisateur.findMany({
      select: { id: true, email: true, role: true, boutiqueId: true, actif: true, createdAt: true },
      orderBy: { email: 'asc' },
    });
  }

  async create(dto: CreateUserDto) {
    const motDePasseHash = await bcrypt.hash(dto.motDePasse, SALT_ROUNDS);
    return this.prisma.utilisateur.create({
      data: {
        email: dto.email,
        motDePasseHash,
        role: dto.role,
        boutiqueId: dto.boutiqueId ?? null,
        actif: dto.actif ?? true,
      },
      select: { id: true, email: true, role: true, boutiqueId: true, actif: true, createdAt: true },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.getOrThrow(id);
    return this.prisma.utilisateur.update({
      where: { id },
      data: dto,
      select: { id: true, email: true, role: true, boutiqueId: true, actif: true, createdAt: true },
    });
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    await this.prisma.utilisateur.delete({ where: { id } });
    return { success: true };
  }

  private async getOrThrow(id: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { id } });
    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable.');
    return utilisateur;
  }
}
