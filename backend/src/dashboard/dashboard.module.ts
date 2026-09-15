import { Module } from '@nestjs/common';
import { BoutiqueDashboardController, DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [ScoringModule],
  controllers: [BoutiqueDashboardController, DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
