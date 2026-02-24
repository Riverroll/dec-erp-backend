import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { UomController } from './uom.controller';
import { UomService } from './uom.service';
import { UomRepository } from './uom.repository';

@Module({
  imports: [PrismaModule],
  controllers: [UomController],
  providers: [UomService, UomRepository],
  exports: [UomService],
})
export class UomModule {}
