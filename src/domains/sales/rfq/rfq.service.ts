import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RFQRepository } from './rfq.repository';
import { NotificationService } from '../../notification/notification.service';
import { PdfService } from '../../../infrastructure/pdf/pdf.service';
import { CreateRFQDto } from './dto/create-rfq.dto';
import { UpdateRFQStatusDto } from './dto/update-rfq.dto';

@Injectable()
export class RFQService {
  constructor(
    private readonly repo: RFQRepository,
    private readonly notificationService: NotificationService,
    private readonly pdfService: PdfService,
  ) {}

  async findAll(params: { page: number; limit: number; search?: string; status?: string }) {
    return this.repo.findAll(params);
  }

  async findById(id: number) {
    const rfq = await this.repo.findById(id);
    if (!rfq) throw new NotFoundException(`RFQ #${id} not found`);
    return rfq;
  }

  async create(dto: CreateRFQDto, userId: number) {
    return this.repo.create(dto, userId);
  }

  async update(id: number, dto: CreateRFQDto) {
    const rfq = await this.findById(id);
    if (rfq.status !== 'DRAFT') throw new BadRequestException('Only DRAFT RFQs can be edited');
    return this.repo.update(id, dto);
  }

  async updateStatus(id: number, dto: UpdateRFQStatusDto, actorId?: number) {
    const rfq = await this.findById(id);
    const updated = await this.repo.updateStatus(id, dto.status, actorId, dto.notes);

    if (dto.status === 'PENDING_PRICE_APPROVAL') {
      await this.notificationService.notifyAdmins({
        title: 'RFQ Needs Price Approval',
        message: `RFQ ${rfq.rfq_number} for ${rfq.customer?.customer_name ?? 'customer'} requires price approval.`,
        type: 'RFQ_PRICE_APPROVAL',
        reference_type: 'RFQ',
        reference_id: id,
      });
    }

    return updated;
  }

  async getLogs(id: number) {
    await this.findById(id);
    return this.repo.getLogs(id);
  }

  async revise(id: number, userId: number) {
    await this.findById(id);
    const newRfq = await this.repo.revise(id, userId);
    if (!newRfq) throw new NotFoundException(`RFQ #${id} not found`);
    return newRfq;
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }

  async convertToSO(id: number, userId: number) {
    await this.findById(id);
    const so = await this.repo.convertToSO(id, userId);
    if (!so) throw new NotFoundException(`RFQ #${id} not found`);
    return so;
  }

  async generatePdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const rfq = await this.findById(id);
    const customer = rfq.customer as any;
    const items = (rfq.items ?? []) as any[];

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
      ...items.map((item: any, idx: number) => [
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
        label: { fontSize: 9, color: '#6b7280' },
        value: { fontSize: 9 },
      },
      content: [
        { text: 'PENAWARAN HARGA', style: { fontSize: 20, bold: true, color: '#1e40af' } },
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
                { columns: [{ text: 'Nomor RFQ', style: 'label', width: 110 }, { text: (rfq as any).rfq_number, style: 'value' }] },
                { columns: [{ text: 'Tanggal', style: 'label', width: 110 }, { text: this.pdfService.formatDate((rfq as any).rfq_date), style: 'value' }] },
                { columns: [{ text: 'Berlaku Hingga', style: 'label', width: 110 }, { text: (rfq as any).valid_until ? this.pdfService.formatDate((rfq as any).valid_until) : '-', style: 'value' }] },
                { columns: [{ text: 'Status', style: 'label', width: 110 }, { text: (rfq as any).status, style: 'value' }] },
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
                { columns: [{ text: 'Subtotal (DPP)', style: 'label', width: 110 }, { text: this.pdfService.formatIDR(Number((rfq as any).subtotal ?? 0)), style: 'value', alignment: 'right' }] },
                { columns: [{ text: `PPN (${Number((rfq as any).ppn_rate ?? 0)}%)`, style: 'label', width: 110 }, { text: this.pdfService.formatIDR(Number((rfq as any).ppn_amount ?? 0)), style: 'value', alignment: 'right' }] },
                { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 220, y2: 4, lineWidth: 1, lineColor: '#1e40af' }], margin: [0, 4, 0, 4] },
                { columns: [{ text: 'TOTAL', style: { fontSize: 10, bold: true }, width: 110 }, { text: this.pdfService.formatIDR(Number((rfq as any).grand_total ?? 0)), style: { fontSize: 10, bold: true }, alignment: 'right' }] },
              ],
            },
          ],
          margin: [0, 8, 0, 0],
        },
        ...((rfq as any).notes ? [{ text: `Catatan: ${(rfq as any).notes}`, style: 'label', margin: [0, 12, 0, 0] }] : []),
      ],
    };

    const buffer = await this.pdfService.generate(docDef);
    return { buffer, filename: `${(rfq as any).rfq_number}.pdf` };
  }
}
