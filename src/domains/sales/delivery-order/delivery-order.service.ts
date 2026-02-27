import { Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryOrderRepository } from './delivery-order.repository';
import { PdfService } from '../../../infrastructure/pdf/pdf.service';
import { CreateDODto } from './dto/create-do.dto';
import { UpdateDOStatusDto } from './dto/update-do.dto';

@Injectable()
export class DeliveryOrderService {
  constructor(
    private readonly repo: DeliveryOrderRepository,
    private readonly pdfService: PdfService,
  ) {}

  async findAll(params: { page: number; limit: number; search?: string; status?: string }) {
    return this.repo.findAll(params);
  }

  async findById(id: number) {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException(`Delivery Order #${id} not found`);
    return doc;
  }

  async create(dto: CreateDODto, userId: number) {
    return this.repo.create(dto, userId);
  }

  async updateStatus(id: number, dto: UpdateDOStatusDto) {
    await this.findById(id);
    return this.repo.updateStatus(id, dto.status);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }

  async createInvoice(id: number, userId: number, ppnRate?: number) {
    await this.findById(id);
    const inv = await this.repo.createInvoice(id, userId, ppnRate);
    if (!inv) throw new NotFoundException(`Delivery Order #${id} not found`);
    return inv;
  }

  async generatePdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const doc = await this.findById(id);
    const customer = (doc as any).customer;
    const so = (doc as any).so;
    const items = (doc as any).items as any[];

    const tableBody = [
      [
        { text: 'No', style: 'tableHeader' },
        { text: 'Kode Produk', style: 'tableHeader' },
        { text: 'Nama Produk', style: 'tableHeader' },
        { text: 'Qty', style: 'tableHeader' },
        { text: 'UOM', style: 'tableHeader' },
      ],
      ...items.map((item, idx) => [
        { text: String(idx + 1), style: 'tableCell' },
        { text: item.product?.product_code ?? '-', style: 'tableCell' },
        { text: item.product?.product_name ?? '-', style: 'tableCell' },
        { text: Number(item.qty).toLocaleString('id-ID'), style: 'tableCell', alignment: 'right' },
        { text: item.product?.uom ?? '-', style: 'tableCell' },
      ]),
    ];

    const signatureBlock = {
      columns: [
        {
          width: '33%',
          stack: [
            { text: 'Pemeriksa Barang', style: { fontSize: 9, bold: true, alignment: 'center' } },
            { text: '(QC / DO Approval)', style: { fontSize: 8, color: '#6b7280', alignment: 'center' } },
            { text: '\n\n\n\n', fontSize: 9 },
            { canvas: [{ type: 'line', x1: 10, y1: 0, x2: 150, y2: 0, lineWidth: 0.5, lineColor: '#374151' }] },
            { text: '(                                    )', style: { fontSize: 8, alignment: 'center', margin: [0, 2, 0, 0] } },
            { text: 'Nama:', style: { fontSize: 8, margin: [10, 2, 0, 0] } },
          ],
        },
        {
          width: '33%',
          stack: [
            { text: 'Pengirim', style: { fontSize: 9, bold: true, alignment: 'center' } },
            { text: '(Shipper / Driver)', style: { fontSize: 8, color: '#6b7280', alignment: 'center' } },
            { text: '\n\n\n\n', fontSize: 9 },
            { canvas: [{ type: 'line', x1: 10, y1: 0, x2: 150, y2: 0, lineWidth: 0.5, lineColor: '#374151' }] },
            { text: '(                                    )', style: { fontSize: 8, alignment: 'center', margin: [0, 2, 0, 0] } },
            { text: 'Nama:', style: { fontSize: 8, margin: [10, 2, 0, 0] } },
          ],
        },
        {
          width: '33%',
          stack: [
            { text: 'Penerima', style: { fontSize: 9, bold: true, alignment: 'center' } },
            { text: '(Customer Receiver)', style: { fontSize: 8, color: '#6b7280', alignment: 'center' } },
            { text: '\n\n\n\n', fontSize: 9 },
            { canvas: [{ type: 'line', x1: 10, y1: 0, x2: 150, y2: 0, lineWidth: 0.5, lineColor: '#374151' }] },
            { text: '(                                    )', style: { fontSize: 8, alignment: 'center', margin: [0, 2, 0, 0] } },
            { text: 'Nama:', style: { fontSize: 8, margin: [10, 2, 0, 0] } },
          ],
        },
      ],
      margin: [0, 24, 0, 0],
    };

    const termsAndConditions = {
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#e5e7eb' }], margin: [0, 16, 0, 8] },
        { text: 'SYARAT DAN KETENTUAN / TERMS & CONDITIONS', style: { fontSize: 8, bold: true, color: '#374151' } },
        {
          ul: [
            'Barang yang sudah diterima tidak dapat dikembalikan tanpa persetujuan tertulis dari perusahaan.',
            'Kerusakan barang saat pengiriman harus dilaporkan dalam 24 jam setelah penerimaan.',
            'Tanda tangan penerima merupakan bukti bahwa barang telah diterima dalam kondisi baik.',
            'Dokumen ini merupakan dokumen resmi perusahaan dan harus disimpan dengan baik.',
          ],
          style: { fontSize: 7, color: '#6b7280' },
          margin: [0, 4, 0, 0],
        },
      ],
    };

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
        { text: 'SURAT JALAN / DELIVERY ORDER', style: { fontSize: 18, bold: true, color: '#1e40af' } },
        { text: 'PT DEC', style: { fontSize: 11, color: '#374151', margin: [0, 2, 0, 0] } },
        { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 1, lineColor: '#1e40af' }], margin: [0, 6, 0, 12] },
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'DIKIRIM KEPADA:', style: 'label' },
                { text: customer?.customer_name ?? '-', style: { fontSize: 10, bold: true } },
                { text: (doc as any).delivery_address ?? customer?.shipping_address ?? '-', style: { fontSize: 9 } },
                { text: `Penerima: ${(doc as any).recipient_name ?? '-'}`, style: 'label', margin: [0, 4, 0, 0] },
                { text: `Telp: ${(doc as any).recipient_phone ?? '-'}`, style: 'label' },
              ],
            },
            {
              width: '50%',
              stack: [
                { columns: [{ text: 'Nomor DO', style: 'label', width: 110 }, { text: (doc as any).do_number, style: 'value' }] },
                { columns: [{ text: 'Nomor SJ', style: 'label', width: 110 }, { text: (doc as any).surat_jalan_number ?? '-', style: 'value' }] },
                { columns: [{ text: 'Tanggal', style: 'label', width: 110 }, { text: this.pdfService.formatDate((doc as any).do_date), style: 'value' }] },
                { columns: [{ text: 'Ref SO', style: 'label', width: 110 }, { text: so?.so_number ?? '-', style: 'value' }] },
                { columns: [{ text: 'Kendaraan', style: 'label', width: 110 }, { text: (doc as any).vehicle_number ?? '-', style: 'value' }] },
                { columns: [{ text: 'Driver', style: 'label', width: 110 }, { text: (doc as any).driver_name ?? '-', style: 'value' }] },
              ],
            },
          ],
          margin: [0, 0, 0, 16],
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', '*', 'auto', 'auto'],
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
        ...((doc as any).notes ? [{ text: `Catatan: ${(doc as any).notes}`, style: 'label', margin: [0, 8, 0, 0] }] : []),
        signatureBlock,
        termsAndConditions,
      ],
    };

    const buffer = await this.pdfService.generate(docDef);
    return { buffer, filename: `${(doc as any).do_number}.pdf` };
  }
}
