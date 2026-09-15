import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RoleUtilisateur } from '@prisma/client';
import { GrillePostesService } from './grille-postes.service';
import { CreateGrillePosteDto, UpdateGrillePosteDto } from './dto/grille-poste.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grille-postes')
export class GrillePostesController {
  constructor(private readonly grillePostesService: GrillePostesService) {}

  @Get()
  findAll() {
    return this.grillePostesService.findAll();
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Post()
  create(@Body() dto: CreateGrillePosteDto) {
    return this.grillePostesService.create(dto);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGrillePosteDto) {
    return this.grillePostesService.update(id, dto);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.grillePostesService.remove(id);
  }
}
