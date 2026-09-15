import { Module } from '@nestjs/common';
import { BoutiqueExportController, ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [ScoringModule],
  controllers: [ExportController, BoutiqueExportController],
  providers: [ExportService],
})
export class ExportModule {}
