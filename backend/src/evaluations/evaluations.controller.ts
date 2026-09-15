import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RoleUtilisateur } from '@prisma/client';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpsertScoresDto } from './dto/upsert-scores.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BoutiqueScopeGuard } from '../common/guards/boutique-scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';

@UseGuards(JwtAuthGuard, RolesGuard, BoutiqueScopeGuard)
@Controller('boutiques/:boutiqueId/evaluations')
export class BoutiqueEvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Get()
  findAll(
    @Param('boutiqueId') boutiqueId: string,
    @Query('personneId') personneId?: string,
    @Query('periode') periode?: string,
  ) {
    return this.evaluationsService.findAllForBoutique(boutiqueId, { personneId, periode });
  }

  @Roles(RoleUtilisateur.ADMIN_RH, RoleUtilisateur.GERANT)
  @Post()
  create(
    @Param('boutiqueId') boutiqueId: string,
    @Body() dto: CreateEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.evaluationsService.create(boutiqueId, dto, user);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.evaluationsService.findOne(id, user);
  }

  @Roles(RoleUtilisateur.ADMIN_RH, RoleUtilisateur.GERANT)
  @Patch(':id/scores')
  upsertScores(
    @Param('id') id: string,
    @Body() dto: UpsertScoresDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.evaluationsService.upsertScores(id, dto, user);
  }

  @Roles(RoleUtilisateur.ADMIN_RH, RoleUtilisateur.GERANT)
  @Post(':id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.evaluationsService.submit(id, user);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Post(':id/valider')
  valider(@Param('id') id: string) {
    return this.evaluationsService.valider(id);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Post(':id/reouvrir')
  reouvrir(@Param('id') id: string) {
    return this.evaluationsService.reouvrir(id);
  }
}
