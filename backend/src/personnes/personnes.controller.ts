import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { PersonnesService } from './personnes.service';
import { CreatePersonneDto } from './dto/create-personne.dto';
import { UpdatePersonneDto } from './dto/update-personne.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BoutiqueScopeGuard } from '../common/guards/boutique-scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024; // 5MB - generous for a roster spreadsheet, small enough to bound memory use

@UseGuards(JwtAuthGuard, RolesGuard, BoutiqueScopeGuard)
@Controller('boutiques/:boutiqueId/personnes')
export class BoutiquePersonnesController {
  constructor(private readonly personnesService: PersonnesService) {}

  @Get()
  findAll(@Param('boutiqueId') boutiqueId: string) {
    return this.personnesService.findAllForBoutique(boutiqueId);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Post()
  create(@Param('boutiqueId') boutiqueId: string, @Body() dto: CreatePersonneDto) {
    return this.personnesService.create(boutiqueId, dto);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Get('import/modele')
  async modele(@Res() res: Response) {
    const buffer = await this.personnesService.genererModeleImport();
    res.set({
      'Content-Type': XLSX_CONTENT_TYPE,
      'Content-Disposition': 'attachment; filename="modele-import-personnes.xlsx"',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Roles(RoleUtilisateur.ADMIN_RH)
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMPORT_FILE_SIZE, files: 1 },
      fileFilter: (_req, file, callback) => {
        const nomValide = /\.xlsx$/i.test(file.originalname);
        const typeValide = file.mimetype === XLSX_CONTENT_TYPE;
        callback(nomValide && typeValide ? null : new BadRequestException('Le fichier doit être un classeur .xlsx.'), nomValide && typeValide);
      },
    }),
  )
  importer(@Param('boutiqueId') boutiqueId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    return this.personnesService.importerDepuisXlsx(boutiqueId, file.buffer);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleUtilisateur.ADMIN_RH)
@Controller('personnes')
export class PersonnesController {
  constructor(private readonly personnesService: PersonnesService) {}

  @Roles(RoleUtilisateur.ADMIN_RH, RoleUtilisateur.DIRECTEUR_REGIONAL, RoleUtilisateur.GERANT)
  @Get(':id/historique')
  historique(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.personnesService.getHistorique(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePersonneDto, @CurrentUser() user: AuthenticatedUser) {
    return this.personnesService.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.personnesService.remove(id, user);
  }
}
