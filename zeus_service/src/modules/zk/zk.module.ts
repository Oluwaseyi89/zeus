import { Module } from '@nestjs/common';
import { ZkService } from './zk.service';
import { ZkController } from './zk.controller';
import { AuthModule } from '../auth/auth.module'; // <-- Added this import

@Module({
  imports: [AuthModule], // <-- Added AuthModule to imports
  providers: [ZkService],
  controllers: [ZkController],
  exports: [ZkService],
})
export class ZkModule {}
