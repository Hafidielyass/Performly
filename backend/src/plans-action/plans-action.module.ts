import { Module } from '@nestjs/common';
import { BoutiquePlansActionController, PlansActionController } from './plans-action.controller';
import { PlansActionService } from './plans-action.service';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [ScoringModule],
  controllers: [BoutiquePlansActionController, PlansActionController],
  providers: [PlansActionService],
})
export class PlansActionModule {}
