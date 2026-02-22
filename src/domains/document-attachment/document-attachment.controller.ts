import {
  Controller, Delete, Get, Param, ParseIntPipe, Post,
  Query, UploadedFile, UseGuards, UseInterceptors, Request, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DocumentAttachmentService } from './document-attachment.service';
import type { Response } from 'express';
import * as fs from 'fs';

const UPLOAD_DEST = './storage/attachments';

@ApiTags('Document Attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class DocumentAttachmentController {
  constructor(private readonly service: DocumentAttachmentService) {}

  @Get()
  findAll(
    @Query('module') module: string,
    @Query('reference_id') referenceId: string,
  ) {
    return this.service.findByModule(module as any, parseInt(referenceId));
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DEST,
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('module') module: string,
    @Query('reference_id') referenceId: string,
    @Request() req: any,
  ) {
    return this.service.create(module as any, parseInt(referenceId), file, req.user.id);
  }

  @Get('download/:id')
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const attachment = await this.service['prisma'].documentAttachment.findUnique({ where: { id } });
    if (!attachment || !fs.existsSync(attachment.file_path)) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.download(join(process.cwd(), attachment.file_path), attachment.file_name);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
