import { Module } from '@nestjs/common';
import { BoutiquePersonnesController, PersonnesController } from './personnes.controller';
import { PersonnesService } from './personnes.service';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [ScoringModule],
  controllers: [BoutiquePersonnesController, PersonnesController],
  providers: [PersonnesService],
  exports: [PersonnesService],
})
export class PersonnesModule {}
