import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ProfilEvaluation, RoleUtilisateur } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { CreateCategorieDto, UpdateCategorieDto } from './dto/categorie.dto';
import { CreateCritereDto, UpdateCritereDto } from './dto/critere.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories-evaluation')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Query('applicableA') applicableA?: ProfilEvaluation) {
    return this.categoriesService.findAll(applicableA);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Post()
  create(@Body() dto: CreateCategorieDto) {
    return this.categoriesService.createCategorie(dto);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategorieDto) {
    return this.categoriesService.updateCategorie(id, dto);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.removeCategorie(id);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleUtilisateur.ADMIN_RH)
@Controller('criteres-evaluation')
export class CriteresController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() dto: CreateCritereDto) {
    return this.categoriesService.createCritere(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCritereDto) {
    return this.categoriesService.updateCritere(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.removeCritere(id);
  }
}
