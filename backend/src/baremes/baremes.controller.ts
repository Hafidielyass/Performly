import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ProfilEvaluation, RoleUtilisateur } from '@prisma/client';
import { BaremesService } from './baremes.service';
import { CreateBaremeDto, UpdateBaremeDto } from './dto/bareme.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('baremes')
export class BaremesController {
  constructor(private readonly baremesService: BaremesService) {}

  @Get()
  findAll(@Query('typeProfil') typeProfil?: ProfilEvaluation) {
    return this.baremesService.findAll(typeProfil);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Post()
  create(@Body() dto: CreateBaremeDto) {
    return this.baremesService.create(dto);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBaremeDto) {
    return this.baremesService.update(id, dto);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.baremesService.remove(id);
  }
}
