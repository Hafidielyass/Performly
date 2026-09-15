import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RoleUtilisateur } from '@prisma/client';
import { BoutiquesService } from './boutiques.service';
import { CreateBoutiqueDto } from './dto/create-boutique.dto';
import { UpdateBoutiqueDto } from './dto/update-boutique.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('boutiques')
export class BoutiquesController {
  constructor(private readonly boutiquesService: BoutiquesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.boutiquesService.findAllForUser(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.boutiquesService.findOne(id, user);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Post()
  create(@Body() dto: CreateBoutiqueDto) {
    return this.boutiquesService.create(dto);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBoutiqueDto) {
    return this.boutiquesService.update(id, dto);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.boutiquesService.remove(id);
  }
}
