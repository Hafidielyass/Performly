import { Module } from '@nestjs/common';
import { GrillePostesController } from './grille-postes.controller';
import { GrillePostesService } from './grille-postes.service';

@Module({
  controllers: [GrillePostesController],
  providers: [GrillePostesService],
})
export class GrillePostesModule {}
