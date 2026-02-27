import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceRepository } from './invoice.repository';
import { PdfService } from '../../../infrastructure/pdf/pdf.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly repo: InvoiceRepository,
    private readonly pdfService: PdfService,
  ) {}

  async findAll(params: { page: number; limit: number; search?: string; status?: string }) {
    return this.repo.findAll(params);
  }

  async findById(id: number) {
    const inv = await this.repo.findById(id);
    if (!inv) throw new NotFoundException(`Invoice #${id} not found`);
    return inv;
  }

  async create(dto: CreateInvoiceDto, userId: number) {
    return this.repo.create(dto, userId);
  }

  async updateStatus(id: number, dto: UpdateInvoiceStatusDto) {
    await this.findById(id);
    return this.repo.updateStatus(id, dto.status);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }

  async generatePdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const inv = await this.findById(id);
    const customer = inv.customer as any;
    const items = (inv.items ?? []) as any[];
    const payments = (inv.payments ?? []) as any[];

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

    const totalPaid = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
    const outstanding = Number((inv as any).grand_total) - totalPaid;

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
        { text: 'INVOICE', style: { fontSize: 20, bold: true, color: '#1e40af' } },
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
                { columns: [{ text: 'No Invoice', style: 'label', width: 110 }, { text: (inv as any).invoice_number, style: 'value' }] },
                { columns: [{ text: 'Tanggal Invoice', style: 'label', width: 110 }, { text: this.pdfService.formatDate((inv as any).invoice_date), style: 'value' }] },
                { columns: [{ text: 'Jatuh Tempo', style: 'label', width: 110 }, { text: (inv as any).due_date ? this.pdfService.formatDate((inv as any).due_date) : '-', style: 'value' }] },
                { columns: [{ text: 'Ref DO', style: 'label', width: 110 }, { text: (inv as any).do?.do_number ?? '-', style: 'value' }] },
                { columns: [{ text: 'Sales Person', style: 'label', width: 110 }, { text: (inv as any).sales_person?.full_name ?? '-', style: 'value' }] },
                { columns: [{ text: 'Status', style: 'label', width: 110 }, { text: (inv as any).status, style: 'value' }] },
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
                { columns: [{ text: 'Subtotal (DPP)', style: 'label', width: 110 }, { text: this.pdfService.formatIDR(Number((inv as any).subtotal)), style: 'value', alignment: 'right' }] },
                { columns: [{ text: `PPN (${Number((inv as any).ppn_rate)}%)`, style: 'label', width: 110 }, { text: this.pdfService.formatIDR(Number((inv as any).ppn_amount)), style: 'value', alignment: 'right' }] },
                { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 220, y2: 4, lineWidth: 1, lineColor: '#1e40af' }], margin: [0, 4, 0, 4] },
                { columns: [{ text: 'TOTAL', style: { fontSize: 10, bold: true }, width: 110 }, { text: this.pdfService.formatIDR(Number((inv as any).grand_total)), style: { fontSize: 10, bold: true }, alignment: 'right' }] },
                ...(payments.length > 0 ? [
                  { columns: [{ text: 'Total Dibayar', style: 'label', width: 110 }, { text: this.pdfService.formatIDR(totalPaid), style: { fontSize: 9, color: '#16a34a' }, alignment: 'right' }] },
                  { columns: [{ text: 'Sisa Tagihan', style: { fontSize: 9, bold: true, color: '#dc2626' }, width: 110 }, { text: this.pdfService.formatIDR(outstanding), style: { fontSize: 9, bold: true, color: '#dc2626' }, alignment: 'right' }] },
                ] : []),
              ],
            },
          ],
          margin: [0, 8, 0, 0],
        },
      ],
    };

    const buffer = await this.pdfService.generate(docDef);
    return { buffer, filename: `${(inv as any).invoice_number}.pdf` };
  }

  async getAgingData(customerId?: number) {
    const rows = await this.repo.findAgingData(customerId);

    const summary = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '>90': 0,
      total: 0,
    };

    for (const row of rows) {
      summary[row.bucket as keyof typeof summary] =
        (summary[row.bucket as keyof typeof summary] as number) + row.outstanding;
      summary.total += row.outstanding;
    }

    return { summary, rows };
  }
}
