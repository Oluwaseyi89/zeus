import { Module, Global } from '@nestjs/common';
import { StellarService } from './stellar.service';

@Global() // Makes it accessible everywhere without manual imports
@Module({
  providers: [StellarService],
  exports: [StellarService],
})
export class StellarModule {}