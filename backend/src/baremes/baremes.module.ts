import { Module } from '@nestjs/common';
import { BaremesController } from './baremes.controller';
import { BaremesService } from './baremes.service';

@Module({
  controllers: [BaremesController],
  providers: [BaremesService],
  exports: [BaremesService],
})
export class BaremesModule {}
