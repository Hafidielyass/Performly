import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser, JwtPayload } from './types';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, motDePasse: string): Promise<LoginResult> {
    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { email } });
    if (!utilisateur || !utilisateur.actif) {
      throw new UnauthorizedException('Identifiants invalides.');
    }
    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasseHash);
    if (!motDePasseValide) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const user: AuthenticatedUser = {
      id: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role,
      boutiqueId: utilisateur.boutiqueId,
    };
    return { ...this.emettreJetons(user), user };
  }

  async rafraichir(refreshToken: string): Promise<LoginResult> {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Jeton de rafraîchissement invalide.');
    }

    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { id: payload.sub } });
    if (!utilisateur || !utilisateur.actif) {
      throw new UnauthorizedException('Utilisateur introuvable ou désactivé.');
    }

    const user: AuthenticatedUser = {
      id: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role,
      boutiqueId: utilisateur.boutiqueId,
    };
    return { ...this.emettreJetons(user), user };
  }

  private emettreJetons(user: AuthenticatedUser): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      boutiqueId: user.boutiqueId,
    };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
    return { accessToken, refreshToken };
  }
}
