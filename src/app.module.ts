import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './domains/auth/auth.module';
import { UserModule } from './domains/user/user.module';
import { InventoryModule } from './domains/inventory/inventory.module';
import { ContactModule } from './domains/contact/contact.module';
import { SalesModule } from './domains/sales/sales.module';
import { ProcurementModule } from './domains/procurement/procurement.module';
import { DocumentAttachmentModule } from './domains/document-attachment/document-attachment.module';
import { DashboardModule } from './domains/dashboard/dashboard.module';
import { NotificationModule } from './domains/notification/notification.module';
import { PdfModule } from './infrastructure/pdf/pdf.module';
import { MulterModule } from '@nestjs/platform-express';
import * as fs from 'fs';

// Ensure upload directory exists at startup
const UPLOAD_DIR = './storage/attachments';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    MulterModule.register({ dest: UPLOAD_DIR }),
    PrismaModule,
    AuthModule,
    UserModule,
    InventoryModule,
    ContactModule,
    SalesModule,
    ProcurementModule,
    DocumentAttachmentModule,
    DashboardModule,
    NotificationModule,
    PdfModule,
  ],
})
export class AppModule {}
