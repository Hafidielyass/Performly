import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RoleUtilisateur } from '@prisma/client';
import { PlansActionService } from './plans-action.service';
import { CreatePlanActionDto, UpdatePlanActionDto } from './dto/plan-action.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BoutiqueScopeGuard } from '../common/guards/boutique-scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';

@UseGuards(JwtAuthGuard, RolesGuard, BoutiqueScopeGuard)
@Controller('boutiques/:boutiqueId/plans-action')
export class BoutiquePlansActionController {
  constructor(private readonly plansActionService: PlansActionService) {}

  @Get()
  findAll(@Param('boutiqueId') boutiqueId: string) {
    return this.plansActionService.findAllForBoutique(boutiqueId);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleUtilisateur.ADMIN_RH, RoleUtilisateur.GERANT)
@Controller('plans-action')
export class PlansActionController {
  constructor(private readonly plansActionService: PlansActionService) {}

  @Post()
  create(@Body() dto: CreatePlanActionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.plansActionService.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanActionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.plansActionService.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.plansActionService.remove(id, user);
  }
}
