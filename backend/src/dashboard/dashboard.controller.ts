import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RoleUtilisateur } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BoutiqueScopeGuard } from '../common/guards/boutique-scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';

@UseGuards(JwtAuthGuard, RolesGuard, BoutiqueScopeGuard)
@Controller('boutiques/:boutiqueId/dashboard')
export class BoutiqueDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  get(
    @Param('boutiqueId') boutiqueId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('periode') periode?: string,
  ) {
    return this.dashboardService.getForBoutique(boutiqueId, user, periode);
  }

  @Get('periodes')
  getPeriodes(@Param('boutiqueId') boutiqueId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getPeriodesPourBoutique(boutiqueId, user);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleUtilisateur.ADMIN_RH, RoleUtilisateur.DIRECTEUR_REGIONAL)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('consolide')
  getConsolide(@Query('periode') periode?: string) {
    return this.dashboardService.getConsolide(periode);
  }

  @Get('periodes')
  getPeriodes() {
    return this.dashboardService.getPeriodesReseau();
  }
}
