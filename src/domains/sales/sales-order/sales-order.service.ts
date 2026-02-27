import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesOrderRepository } from './sales-order.repository';
import { NotificationService } from '../../notification/notification.service';
import { PdfService } from '../../../infrastructure/pdf/pdf.service';
import { CreateSODto } from './dto/create-so.dto';
import { UpdateSOStatusDto } from './dto/update-so.dto';

@Injectable()
export class SalesOrderService {
  constructor(
    private readonly repo: SalesOrderRepository,
    private readonly notificationService: NotificationService,
    private readonly pdfService: PdfService,
  ) {}

  async findAll(params: { page: number; limit: number; search?: string; status?: string }) {
    return this.repo.findAll(params);
  }

  async findById(id: number) {
    const so = await this.repo.findById(id);
    if (!so) throw new NotFoundException(`Sales Order #${id} not found`);
    return so;
  }

  async create(dto: CreateSODto, userId: number) {
    return this.repo.create(dto, userId);
  }

  async updateStatus(id: number, dto: UpdateSOStatusDto) {
    const so = await this.findById(id);

    // Credit limit check when confirming an SO
    if (dto.status === 'CONFIRMED') {
      const credit = await this.repo.checkCreditLimit(so.customer_id, Number(so.grand_total), id);
      if (credit.exceeded) {
        const updated = await this.repo.updateStatus(id, 'PENDING_CREDIT_APPROVAL');
        const fmt = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
        await this.notificationService.notifyAdmins({
          title: 'SO Requires Credit Approval',
          message: `SO ${so.so_number} for ${so.customer?.customer_name ?? 'customer'} exceeds credit limit (outstanding ${fmt(credit.outstanding)} + SO ${fmt(Number(so.grand_total))} > limit ${fmt(credit.limit)}).`,
          type: 'CREDIT_LIMIT',
          reference_type: 'SO',
          reference_id: id,
        });
        return updated;
      }
    }

    return this.repo.updateStatus(id, dto.status);
  }

  /** Big boss credit approval: approve, reject, or increase limit + approve */
  async creditApproval(id: number, action: 'APPROVE' | 'REJECT', newCreditLimit?: number) {
    const so = await this.findById(id);
    if (so.status !== 'PENDING_CREDIT_APPROVAL') {
      throw new BadRequestException('SO is not pending credit approval');
    }
    if (action === 'REJECT') {
      return this.repo.updateStatus(id, 'CANCELLED');
    }
    if (newCreditLimit !== undefined && newCreditLimit > 0) {
      await this.repo.updateCustomerCreditLimit(so.customer_id, newCreditLimit);
    }
    return this.repo.updateStatus(id, 'CONFIRMED');
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }

  async createDO(id: number, userId: number) {
    await this.findById(id);
    const doc = await this.repo.createDO(id, userId);
    if (!doc) throw new NotFoundException(`Sales Order #${id} not found`);
    return doc;
  }

  async generatePdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const so = await this.findById(id);
    const customer = so.customer as any;
    const rfq = so.rfq as any;
    const items = so.items as any[];

    const tableBody = [
      [
        { text: 'No', style: 'tableHeader' },
        { text: 'Kode Produk', style: 'tableHeader' },
        { text: 'Nama Produk', style: 'tableHeader' },
        { text: 'Qty', style: 'tableHeader' },
        { text: 'UOM', style: 'tableHeader' },
        { text: 'Harga Satuan', style: 'tableHeader' },
        { text: 'Subtotal', style: 'tableHeader' },
      ],
      ...items.map((item, idx) => [
        { text: String(idx + 1), style: 'tableCell' },
        { text: item.product?.product_code ?? '-', style: 'tableCell' },
        { text: item.product?.product_name ?? '-', style: 'tableCell' },
        { text: Number(item.qty).toLocaleString('id-ID'), style: 'tableCell', alignment: 'right' },
        { text: item.product?.uom ?? '-', style: 'tableCell' },
        { text: this.pdfService.formatIDR(Number(item.unit_price)), style: 'tableCell', alignment: 'right' },
        { text: this.pdfService.formatIDR(Number(item.subtotal)), style: 'tableCell', alignment: 'right' },
      ]),
    ];

    const docDef = {
      pageMargins: this.pdfService.pageMargins(),
      footer: this.pdfService.footerFn('DEC'),
      styles: {
        tableHeader: { ...this.pdfService.headerStyle() },
        tableCell: { ...this.pdfService.cellStyle() },
        sectionTitle: { fontSize: 10, bold: true, margin: [0, 8, 0, 2] },
        label: { fontSize: 9, color: '#6b7280' },
        value: { fontSize: 9 },
      },
      content: [
        { text: 'SALES ORDER', style: { fontSize: 20, bold: true, color: '#1e40af' } },
        { text: 'PT DEC', style: { fontSize: 11, color: '#374151', margin: [0, 2, 0, 0] } },
        { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 1, lineColor: '#1e40af' }], margin: [0, 6, 0, 12] },
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'KEPADA:', style: 'label' },
                { text: customer?.customer_name ?? '-', style: { fontSize: 10, bold: true } },
                { text: customer?.billing_address ?? '', style: { fontSize: 9, color: '#374151' } },
                { text: `NPWP: ${customer?.npwp ?? '-'}`, style: 'label', margin: [0, 2, 0, 0] },
              ],
            },
            {
              width: '50%',
              stack: [
                { columns: [{ text: 'Nomor SO', style: 'label', width: 100 }, { text: (so as any).so_number, style: 'value' }] },
                { columns: [{ text: 'Tanggal', style: 'label', width: 100 }, { text: this.pdfService.formatDate((so as any).so_date), style: 'value' }] },
                { columns: [{ text: 'No PO Customer', style: 'label', width: 100 }, { text: (so as any).customer_po_number ?? '-', style: 'value' }] },
                { columns: [{ text: 'Referensi RFQ', style: 'label', width: 100 }, { text: rfq?.rfq_number ?? '-', style: 'value' }] },
                { columns: [{ text: 'Status', style: 'label', width: 100 }, { text: (so as any).status, style: 'value' }] },
              ],
            },
          ],
          margin: [0, 0, 0, 16],
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto', 'auto'],
            body: tableBody,
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb',
            fillColor: (rowIndex: number) => (rowIndex === 0 ? '#1e40af' : rowIndex % 2 === 0 ? '#f9fafb' : null),
          },
        },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 220,
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 220, y2: 4, lineWidth: 0.5, lineColor: '#e5e7eb' }], margin: [0, 8, 0, 4] },
                { columns: [{ text: 'Subtotal', style: 'label', width: 100 }, { text: this.pdfService.formatIDR(Number((so as any).subtotal)), style: 'value', alignment: 'right' }] },
                { columns: [{ text: `PPN (${Number((so as any).ppn_rate)}%)`, style: 'label', width: 100 }, { text: this.pdfService.formatIDR(Number((so as any).ppn_amount)), style: 'value', alignment: 'right' }] },
                { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 220, y2: 4, lineWidth: 1, lineColor: '#1e40af' }], margin: [0, 4, 0, 4] },
                { columns: [{ text: 'TOTAL', style: { fontSize: 10, bold: true }, width: 100 }, { text: this.pdfService.formatIDR(Number((so as any).grand_total)), style: { fontSize: 10, bold: true }, alignment: 'right' }] },
              ],
            },
          ],
          margin: [0, 8, 0, 0],
        },
        ...((so as any).notes ? [{ text: `Catatan: ${(so as any).notes}`, style: 'label', margin: [0, 12, 0, 0] }] : []),
      ],
    };

    const buffer = await this.pdfService.generate(docDef);
    return { buffer, filename: `${(so as any).so_number}.pdf` };
  }
}
