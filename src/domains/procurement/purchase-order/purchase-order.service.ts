import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PurchaseOrderRepository } from './purchase-order.repository';
import { NotificationService } from '../../notification/notification.service';
import { PdfService } from '../../../infrastructure/pdf/pdf.service';
import { CreatePODto } from './dto/create-po.dto';
import { UpdatePOStatusDto } from './dto/update-po.dto';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly repo: PurchaseOrderRepository,
    private readonly notificationService: NotificationService,
    private readonly pdfService: PdfService,
  ) {}

  async findAll(params: { page: number; limit: number; search?: string; status?: string }) {
    return this.repo.findAll(params);
  }

  async findById(id: number) {
    const po = await this.repo.findById(id);
    if (!po) throw new NotFoundException(`Purchase Order #${id} not found`);
    return po;
  }

  async create(dto: CreatePODto, userId: number) {
    return this.repo.create(dto, userId);
  }

  async update(id: number, dto: CreatePODto) {
    const po = await this.findById(id);
    if (po.status !== 'DRAFT') throw new BadRequestException('Only DRAFT POs can be edited');
    return this.repo.update(id, dto);
  }

  async updateStatus(id: number, dto: UpdatePOStatusDto, actorId?: number) {
    const po = await this.findById(id);
    const updated = await this.repo.updateStatus(id, dto.status, actorId, dto.notes);

    // Notify admins when PO needs approval
    if (dto.status === 'PENDING_APPROVAL' || dto.status === 'PENDING_PRICE_APPROVAL') {
      const label = dto.status === 'PENDING_APPROVAL' ? 'Approval' : 'Price Approval';
      await this.notificationService.notifyAdmins({
        title: `[${po.po_number}] Needs ${label}`,
        message: `Purchase Order ${po.po_number} from ${po.supplier?.supplier_name ?? 'supplier'} is pending ${label.toLowerCase()}.`,
        type: dto.status === 'PENDING_APPROVAL' ? 'PO_APPROVAL' : 'PO_PRICE_APPROVAL',
        reference_type: 'PO',
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
    const newPo = await this.repo.revise(id, userId);
    if (!newPo) throw new NotFoundException(`Purchase Order #${id} not found`);
    return newPo;
  }

  async remove(id: number) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }

  async generatePdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const po = await this.findById(id);
    const supplier = po.supplier as any;
    const items = (po.items ?? []) as any[];

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

    const grandTotal = items.reduce((s: number, i: any) => s + Number(i.subtotal), 0);

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
        { text: 'PURCHASE ORDER', style: { fontSize: 20, bold: true, color: '#1e40af' } },
        { text: 'PT DEC', style: { fontSize: 11, color: '#374151', margin: [0, 2, 0, 0] } },
        { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 1, lineColor: '#1e40af' }], margin: [0, 6, 0, 12] },
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'KEPADA (SUPPLIER):', style: 'label' },
                { text: supplier?.supplier_name ?? '-', style: { fontSize: 10, bold: true } },
                { text: supplier?.address ?? '', style: { fontSize: 9, color: '#374151' } },
                { text: `NPWP: ${supplier?.npwp ?? '-'}`, style: 'label', margin: [0, 2, 0, 0] },
              ],
            },
            {
              width: '50%',
              stack: [
                { columns: [{ text: 'Nomor PO', style: 'label', width: 110 }, { text: (po as any).po_number, style: 'value' }] },
                { columns: [{ text: 'Tanggal PO', style: 'label', width: 110 }, { text: this.pdfService.formatDate((po as any).po_date), style: 'value' }] },
                { columns: [{ text: 'Tanggal Kirim', style: 'label', width: 110 }, { text: (po as any).expected_delivery ? this.pdfService.formatDate((po as any).expected_delivery) : '-', style: 'value' }] },
                { columns: [{ text: 'Status', style: 'label', width: 110 }, { text: (po as any).status, style: 'value' }] },
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
                { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 220, y2: 4, lineWidth: 1, lineColor: '#1e40af' }], margin: [0, 4, 0, 4] },
                { columns: [{ text: 'TOTAL', style: { fontSize: 10, bold: true }, width: 110 }, { text: this.pdfService.formatIDR(grandTotal), style: { fontSize: 10, bold: true }, alignment: 'right' }] },
              ],
            },
          ],
          margin: [0, 8, 0, 0],
        },
        ...((po as any).notes ? [{ text: `Catatan: ${(po as any).notes}`, style: 'label', margin: [0, 12, 0, 0] }] : []),
      ],
    };

    const buffer = await this.pdfService.generate(docDef);
    return { buffer, filename: `${(po as any).po_number}.pdf` };
  }
}
