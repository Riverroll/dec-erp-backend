import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

type Module = 'RFQ' | 'SO' | 'DO' | 'INVOICE' | 'PO';

@Injectable()
export class DocumentAttachmentService {
  constructor(private readonly prisma: PrismaService) {}

  private getIdField(module: Module): string {
    const map: Record<Module, string> = {
      RFQ: 'rfq_id',
      SO: 'so_id',
      DO: 'do_id',
      INVOICE: 'invoice_id',
      PO: 'po_id',
    };
    return map[module];
  }

  async findByModule(module: Module, referenceId: number) {
    const idField = this.getIdField(module);
    return this.prisma.documentAttachment.findMany({
      where: { module, [idField]: referenceId },
      orderBy: { uploaded_at: 'desc' },
    });
  }

  async create(
    module: Module,
    referenceId: number,
    file: Express.Multer.File,
    uploadedBy: number,
  ) {
    const idField = this.getIdField(module);
    return this.prisma.documentAttachment.create({
      data: {
        module,
        [idField]: referenceId,
        file_name: file.originalname,
        file_path: file.path.replace(/\\/g, '/'),
        file_size: file.size,
        mime_type: file.mimetype,
        uploaded_by: uploadedBy,
      },
    });
  }

  async remove(id: number) {
    const attachment = await this.prisma.documentAttachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundException('Attachment not found');

    // Delete physical file
    try {
      if (fs.existsSync(attachment.file_path)) {
        fs.unlinkSync(attachment.file_path);
      }
    } catch {
      // Ignore file system errors
    }

    return this.prisma.documentAttachment.delete({ where: { id } });
  }
}
