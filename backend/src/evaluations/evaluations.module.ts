import { Module } from '@nestjs/common';
import { CategoriesController, CriteresController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { BoutiqueEvaluationsController, EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [ScoringModule],
  controllers: [CategoriesController, CriteresController, BoutiqueEvaluationsController, EvaluationsController],
  providers: [CategoriesService, EvaluationsService],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
