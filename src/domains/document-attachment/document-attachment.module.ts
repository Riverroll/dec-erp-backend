import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DocumentAttachmentController } from './document-attachment.controller';
import { DocumentAttachmentService } from './document-attachment.service';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentAttachmentController],
  providers: [DocumentAttachmentService],
  exports: [DocumentAttachmentService],
})
export class DocumentAttachmentModule {}
