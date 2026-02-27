import { Injectable, NotFoundException } from '@nestjs/common';
import { GoodsReceiptRepository } from './goods-receipt.repository';
import { PdfService } from '../../../infrastructure/pdf/pdf.service';
import { CreateGRDto } from './dto/create-gr.dto';

@Injectable()
export class GoodsReceiptService {
  constructor(
    private readonly repo: GoodsReceiptRepository,
    private readonly pdfService: PdfService,
  ) {}

  async findAll(params: { page: number; limit: number; search?: string; status?: string }) {
    return this.repo.findAll(params);
  }

  async findById(id: number) {
    const gr = await this.repo.findById(id);
    if (!gr) throw new NotFoundException(`Goods Receipt #${id} not found`);
    return gr;
  }

  async create(dto: CreateGRDto, userId: number) {
    return this.repo.create(dto, userId);
  }

  async confirm(id: number, confirmedBy: number) {
    await this.findById(id);
    return this.repo.confirm(id, confirmedBy);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }

  async generatePaymentVoucherPdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const gr = await this.findById(id);
    const supplier = (gr as any).supplier;
    const po = (gr as any).po;
    const items = (gr as any).items as any[];

    const subtotal = items.reduce((s, i) => s + Number(i.qty_received) * Number(i.unit_cost), 0);
    const ppn_rate = 11;
    const ppn_amount = subtotal * (ppn_rate / 100);
    const grand_total = subtotal + ppn_amount;

    const tableBody = [
      [
        { text: 'No', style: 'tableHeader' },
        { text: 'Nama Barang', style: 'tableHeader' },
        { text: 'Kode Produk', style: 'tableHeader' },
        { text: 'Qty Diterima', style: 'tableHeader' },
        { text: 'UOM', style: 'tableHeader' },
        { text: 'Harga Satuan', style: 'tableHeader' },
        { text: 'Jumlah', style: 'tableHeader' },
      ],
      ...items.map((item, idx) => [
        { text: String(idx + 1), style: 'tableCell' },
        { text: item.product?.product_name ?? '-', style: 'tableCell' },
        { text: item.product?.product_code ?? '-', style: 'tableCell' },
        { text: Number(item.qty_received).toLocaleString('id-ID'), style: 'tableCell', alignment: 'right' },
        { text: item.product?.uom ?? '-', style: 'tableCell' },
        { text: this.pdfService.formatIDR(Number(item.unit_cost)), style: 'tableCell', alignment: 'right' },
        { text: this.pdfService.formatIDR(Number(item.qty_received) * Number(item.unit_cost)), style: 'tableCell', alignment: 'right' },
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
        { text: 'BUKTI PEMBAYARAN / PAYMENT VOUCHER', style: { fontSize: 16, bold: true, color: '#1e40af' } },
        { text: 'PT DEC', style: { fontSize: 11, color: '#374151', margin: [0, 2, 0, 0] } },
        { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 1, lineColor: '#1e40af' }], margin: [0, 6, 0, 12] },
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'DIBAYARKAN KEPADA:', style: 'label' },
                { text: supplier?.supplier_name ?? '-', style: { fontSize: 10, bold: true } },
                { text: `Kode Supplier: ${supplier?.supplier_code ?? '-'}`, style: 'label', margin: [0, 2, 0, 0] },
              ],
            },
            {
              width: '50%',
              stack: [
                { columns: [{ text: 'No Voucher/GR', style: 'label', width: 120 }, { text: (gr as any).receipt_number, style: 'value' }] },
                { columns: [{ text: 'Tanggal Terima', style: 'label', width: 120 }, { text: this.pdfService.formatDate((gr as any).receipt_date), style: 'value' }] },
                { columns: [{ text: 'No PO (kita)', style: 'label', width: 120 }, { text: po?.po_number ?? '-', style: 'value' }] },
                { columns: [{ text: 'Status', style: 'label', width: 120 }, { text: (gr as any).status, style: 'value' }] },
              ],
            },
          ],
          margin: [0, 0, 0, 16],
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
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
                { columns: [{ text: 'DPP (Subtotal)', style: 'label', width: 110 }, { text: this.pdfService.formatIDR(subtotal), style: 'value', alignment: 'right' }] },
                { columns: [{ text: `PPN (${ppn_rate}%)`, style: 'label', width: 110 }, { text: this.pdfService.formatIDR(ppn_amount), style: 'value', alignment: 'right' }] },
                { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 220, y2: 4, lineWidth: 1, lineColor: '#1e40af' }], margin: [0, 4, 0, 4] },
                { columns: [{ text: 'TOTAL BAYAR', style: { fontSize: 10, bold: true }, width: 110 }, { text: this.pdfService.formatIDR(grand_total), style: { fontSize: 10, bold: true }, alignment: 'right' }] },
              ],
            },
          ],
          margin: [0, 8, 0, 0],
        },
        ...((gr as any).notes ? [{ text: `Catatan: ${(gr as any).notes}`, style: 'label', margin: [0, 12, 0, 0] }] : []),
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 160,
              stack: [
                { text: '\n\n\n\n' },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 160, y2: 0, lineWidth: 0.5, lineColor: '#374151' }] },
                { text: 'Dibuat oleh / Approved by', style: { fontSize: 8, alignment: 'center', margin: [0, 2, 0, 0] } },
              ],
              margin: [0, 24, 0, 0],
            },
          ],
        },
      ],
    };

    const buffer = await this.pdfService.generate(docDef);
    return { buffer, filename: `VOUCHER-${(gr as any).receipt_number}.pdf` };
  }
}
