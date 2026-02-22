import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Sales MTD — sum of invoice grand_total this month (ISSUED/PARTIAL/PAID)
    const salesMtdRaw = await this.prisma.salesInvoice.aggregate({
      where: {
        flag: 1,
        invoice_date: { gte: startOfMonth },
        status: { in: ['ISSUED', 'PARTIAL', 'PAID', 'OVERDUE'] },
      },
      _sum: { grand_total: true },
    });
    const sales_mtd = Number(salesMtdRaw._sum.grand_total ?? 0);

    // 2. AR Outstanding — invoices not yet fully paid
    const openInvoices = await this.prisma.salesInvoice.findMany({
      where: { flag: 1, status: { in: ['ISSUED', 'PARTIAL', 'OVERDUE'] } },
      include: { payments: { where: { flag: 1 } } },
    });
    const ar_outstanding = openInvoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      return sum + (Number(inv.grand_total) - paid);
    }, 0);

    // 3. Stock value — sum(quantity * default_selling_price)
    const stocks = await this.prisma.warehouseStock.findMany({
      include: { product: { select: { default_selling_price: true } } },
    });
    const stock_value = stocks.reduce(
      (sum, s) => sum + Number(s.quantity) * Number(s.product.default_selling_price),
      0,
    );

    // 4. Pending approvals — POs with PENDING_APPROVAL or PENDING_PRICE_APPROVAL
    const pending_approvals = await this.prisma.purchaseOrder.count({
      where: {
        flag: 1,
        status: { in: ['PENDING_APPROVAL', 'PENDING_PRICE_APPROVAL'] },
      },
    });

    // 5. Sales trend — last 12 months, grouped by month
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const invoices = await this.prisma.salesInvoice.findMany({
      where: {
        flag: 1,
        invoice_date: { gte: twelveMonthsAgo },
        status: { in: ['ISSUED', 'PARTIAL', 'PAID', 'OVERDUE'] },
      },
      select: { invoice_date: true, grand_total: true },
    });

    const trendMap = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      trendMap.set(key, 0);
    }
    for (const inv of invoices) {
      const d = new Date(inv.invoice_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + Number(inv.grand_total));
    }
    const sales_trend = Array.from(trendMap.entries()).map(([month, sales]) => ({ month, sales }));

    // 6. AR aging buckets (from open invoices already loaded)
    const aging = { '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0 };
    const today = new Date();
    for (const inv of openInvoices) {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      const outstanding = Number(inv.grand_total) - paid;
      if (outstanding <= 0) continue;
      const due = inv.due_date ? new Date(inv.due_date) : new Date(inv.invoice_date);
      const days = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 30) aging['0-30'] += outstanding;
      else if (days <= 60) aging['31-60'] += outstanding;
      else if (days <= 90) aging['61-90'] += outstanding;
      else aging['>90'] += outstanding;
    }

    // 7. Low stock — quantity < low_stock_threshold (threshold > 0)
    const low_stock = await this.prisma.warehouseStock.findMany({
      where: {
        low_stock_threshold: { gt: 0 },
      },
      include: {
        product: { select: { product_name: true, product_code: true, uom: true } },
        warehouse: { select: { warehouse_name: true } },
      },
      orderBy: { quantity: 'asc' },
    });
    const low_stock_alerts = low_stock
      .filter((s) => Number(s.quantity) < Number(s.low_stock_threshold))
      .map((s) => ({
        product_name: s.product.product_name,
        product_code: s.product.product_code,
        uom: s.product.uom,
        warehouse_name: s.warehouse.warehouse_name,
        quantity: Number(s.quantity),
        low_stock_threshold: Number(s.low_stock_threshold),
      }));

    // 8. Top sold products — SO items from last 90 days, grouped by product
    const ninetyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
    const soItems = await this.prisma.sOItem.findMany({
      where: {
        so: {
          flag: 1,
          so_date: { gte: ninetyDaysAgo },
          status: { in: ['CONFIRMED', 'PROCESSING', 'COMPLETED'] },
        },
      },
      include: {
        product: { select: { product_name: true, product_code: true, uom: true } },
      },
    });

    const productMap = new Map<number, { product_name: string; product_code: string; uom: string; total_qty: number; total_revenue: number }>();
    for (const item of soItems) {
      const existing = productMap.get(item.product_id) ?? {
        product_name: item.product.product_name,
        product_code: item.product.product_code,
        uom: item.product.uom,
        total_qty: 0,
        total_revenue: 0,
      };
      existing.total_qty += Number(item.qty);
      existing.total_revenue += Number(item.subtotal);
      productMap.set(item.product_id, existing);
    }
    const top_products = Array.from(productMap.entries())
      .map(([product_id, data]) => ({ product_id, ...data }))
      .sort((a, b) => b.total_qty - a.total_qty)
      .slice(0, 10);

    return {
      sales_mtd,
      ar_outstanding,
      stock_value,
      pending_approvals,
      sales_trend,
      ar_aging: aging,
      low_stock_alerts,
      top_products,
    };
  }

  async getPendingApprovals() {
    const [pos, rfqs] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: { flag: 1, status: { in: ['PENDING_APPROVAL', 'PENDING_PRICE_APPROVAL'] } },
        include: { supplier: { select: { supplier_name: true } } },
        orderBy: { updated_at: 'desc' },
      }),
      this.prisma.rFQ.findMany({
        where: { flag: 1, status: 'PENDING_PRICE_APPROVAL' },
        include: { customer: { select: { customer_name: true } } },
        orderBy: { updated_at: 'desc' },
      }),
    ]);
    return { pos, rfqs };
  }
}
