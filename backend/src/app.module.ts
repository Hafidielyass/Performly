import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateConfig } from './config/validate';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BoutiquesModule } from './boutiques/boutiques.module';
import { PersonnesModule } from './personnes/personnes.module';
import { GrillePostesModule } from './grille-postes/grille-postes.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { ScoringModule } from './scoring/scoring.module';
import { BaremesModule } from './baremes/baremes.module';
import { PlansActionModule } from './plans-action/plans-action.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExportModule } from './export/export.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }),
    // General DoS safety net for every route; login overrides this with a much stricter
    // limit (see AuthController) since it's the one endpoint worth brute-forcing.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
    PrismaModule,
    ScoringModule,
    AuthModule,
    UsersModule,
    BoutiquesModule,
    PersonnesModule,
    GrillePostesModule,
    EvaluationsModule,
    BaremesModule,
    PlansActionModule,
    DashboardModule,
    ExportModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
