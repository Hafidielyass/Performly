import { BadRequestException, Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BoutiqueScopeGuard } from '../common/guards/boutique-scope.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';

function envoyerFichier(res: Response, contentType: string, buffer: Buffer, nomFichier: string) {
  res.set({
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${nomFichier}"`,
    'Content-Length': buffer.length,
  });
  res.send(buffer);
}

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('evaluations/:id/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('xlsx')
  async xlsx(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const { buffer, nomFichier } = await this.exportService.exporterXlsx(id, user);
    envoyerFichier(res, XLSX_CONTENT_TYPE, buffer, nomFichier);
  }

  @Get('pdf')
  async pdf(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const { buffer, nomFichier } = await this.exportService.exporterPdf(id, user);
    envoyerFichier(res, 'application/pdf', buffer, nomFichier);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard, BoutiqueScopeGuard)
@Controller('boutiques/:boutiqueId/export')
export class BoutiqueExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('xlsx')
  async xlsx(
    @Param('boutiqueId') boutiqueId: string,
    @Query('periode') periode: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    if (!periode) throw new BadRequestException('Le paramètre periode est requis.');
    const { buffer, nomFichier } = await this.exportService.exporterBoutiqueXlsx(boutiqueId, periode, user);
    envoyerFichier(res, XLSX_CONTENT_TYPE, buffer, nomFichier);
  }

  @Get('pdf')
  async pdf(
    @Param('boutiqueId') boutiqueId: string,
    @Query('periode') periode: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    if (!periode) throw new BadRequestException('Le paramètre periode est requis.');
    const { buffer, nomFichier } = await this.exportService.exporterBoutiquePdf(boutiqueId, periode, user);
    envoyerFichier(res, 'application/pdf', buffer, nomFichier);
  }
}
