/**
 * seed-credit-demo.ts
 * Demonstrates the full credit limit enforcement flow with 3 clear scenarios.
 * Run: npx ts-node prisma/seed-credit-demo.ts
 *
 * SCENARIO 1 — PT Kencana Abadi (CUST-D01)
 *   credit_limit = 150,000,000 | outstanding AR = 130,000,000 (87% — WARNING)
 *   → Has 1 unpaid invoice from 40 days ago (bucket 31-60)
 *   → New RFQ already created — confirming SO will trigger PENDING_CREDIT_APPROVAL
 *
 * SCENARIO 2 — PT Mega Konstruksi (CUST-D02)
 *   credit_limit = 200,000,000 | outstanding AR = 230,000,000 (EXCEEDED)
 *   → Invoice 1: 80M outstanding (overdue 100d → bucket >90)
 *   → Invoice 2: 150M outstanding (overdue 50d → bucket 31-60)
 *   → SO already stuck in PENDING_CREDIT_APPROVAL (50M new order)
 *
 * SCENARIO 3 — PT Sentosa Elektrindo (CUST-D03)
 *   credit_limit = 100,000,000 | outstanding AR = 15,000,000 (15% — SAFE)
 *   → Invoice 1: 80M PAID (completed, in total_revenue)
 *   → Invoice 2: 30M, partially paid 15M → 15M outstanding (overdue 20d → bucket 0-30)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  console.log('🌱  Seeding credit limit demo data...');

  // ─── Resolve references ────────────────────────────────────────
  const adminUser = await prisma.user.findFirst({ where: { username: 'admin' } });
  const salesUser = await prisma.user.findFirst({ where: { username: 'budi.sales' } });
  const product1  = await prisma.product.findFirst({ where: { flag: 1 } });
  const product2  = await prisma.product.findFirst({ where: { flag: 1 }, skip: 1 });
  const warehouse = await prisma.warehouse.findFirst({ where: { flag: 1 } });

  if (!adminUser || !product1 || !warehouse) {
    throw new Error('Run the main seed first — admin user, products, and warehouses must exist.');
  }

  const createdBy = adminUser.id;
  const salesPersonId = salesUser?.id ?? adminUser.id;
  const p1 = product1.id;
  const p2 = product2?.id ?? product1.id;
  const wh = warehouse.id;

  // ───────────────────────────────────────────────────────────────
  // SCENARIO 1 — PT Kencana Abadi: 87% credit used, orange warning
  // ───────────────────────────────────────────────────────────────
  console.log('  → Scenario 1: PT Kencana Abadi (approaching credit limit)...');

  const cust1 = await prisma.customer.upsert({
    where: { customer_code: 'CUST-D01' },
    update: { credit_limit: 150_000_000 },
    create: {
      customer_code: 'CUST-D01',
      customer_name: 'PT Kencana Abadi',
      business_type: 'PT',
      industry: 'Konstruksi',
      npwp: '01.234.567.8-001.000',
      billing_address: 'Jl. Kencana No. 1, Jakarta Selatan',
      payment_terms: 30,
      credit_limit: 150_000_000,
      status: 'ACTIVE',
      sales_person_id: salesPersonId,
      pics: {
        create: [{ pic_name: 'Bapak Hendra', position: 'Direktur', phone: '08111000001', email: 'hendra@kencana.co.id', is_primary: true }],
      },
    },
  });

  // RFQ (APPROVED — will be converted to SO)
  const rfq1 = await prisma.rFQ.upsert({
    where: { rfq_number: 'RFQ-D001' },
    update: {},
    create: {
      rfq_number: 'RFQ-D001',
      rfq_date: daysAgo(50),
      customer_id: cust1.id,
      notes: 'Pengadaan kabel dan MCB untuk proyek gedung Kencana Tower',
      subtotal: 117_117_117,
      ppn_rate: 11,
      ppn_amount: 12_882_883,
      grand_total: 130_000_000,
      status: 'APPROVED',
      created_by: createdBy,
      items: {
        create: [
          { product_id: p1, warehouse_id: wh, qty: 100, unit_price: 751_351, subtotal: 75_135_100 },
          { product_id: p2, warehouse_id: wh, qty: 50,  unit_price: 839_640, subtotal: 41_982_000 },
        ],
      },
    },
  });

  // SO (CONFIRMED — credit not yet exceeded when this SO was made)
  const so1 = await prisma.salesOrder.upsert({
    where: { so_number: 'SO-D001' },
    update: {},
    create: {
      so_number: 'SO-D001',
      so_date: daysAgo(48),
      customer_id: cust1.id,
      rfq_id: rfq1.id,
      subtotal: 117_117_117,
      ppn_rate: 11,
      ppn_amount: 12_882_883,
      grand_total: 130_000_000,
      status: 'COMPLETED',
      is_indent: false,
      created_by: createdBy,
      items: {
        create: [
          { product_id: p1, warehouse_id: wh, qty: 100, unit_price: 751_351, subtotal: 75_135_100 },
          { product_id: p2, warehouse_id: wh, qty: 50,  unit_price: 839_640, subtotal: 41_982_000 },
        ],
      },
    },
  });

  // DO (DELIVERED)
  const do1 = await prisma.deliveryOrder.upsert({
    where: { do_number: 'DO-D001' },
    update: {},
    create: {
      do_number: 'DO-D001',
      do_date: daysAgo(45),
      so_id: so1.id,
      customer_id: cust1.id,
      warehouse_id: wh,
      delivery_address: 'Jl. Kencana No. 1, Jakarta Selatan',
      recipient_name: 'Bapak Hendra',
      status: 'DELIVERED',
      created_by: createdBy,
      items: {
        create: [
          { product_id: p1, qty: 100, unit_price: 751_351, subtotal: 75_135_100 },
          { product_id: p2, qty: 50,  unit_price: 839_640, subtotal: 41_982_000 },
        ],
      },
    },
  });

  // Invoice (ISSUED — unpaid, due 40 days ago → bucket 31-60)
  await prisma.salesInvoice.upsert({
    where: { invoice_number: 'INV-D001' },
    update: {},
    create: {
      invoice_number: 'INV-D001',
      invoice_date: daysAgo(45),
      due_date: daysAgo(15),   // overdue 15 days → bucket 0-30
      do_id: do1.id,
      customer_id: cust1.id,
      subtotal: 117_117_117,
      ppn_rate: 11,
      ppn_amount: 12_882_883,
      grand_total: 130_000_000,
      status: 'ISSUED',   // UNPAID → shows in outstanding AR
      created_by: createdBy,
      items: {
        create: [
          { product_id: p1, qty: 100, unit_price: 751_351, subtotal: 75_135_100 },
          { product_id: p2, qty: 50,  unit_price: 839_640, subtotal: 41_982_000 },
        ],
      },
    },
  });

  // New RFQ for follow-up order (30M) — if SO is confirmed → 130+30=160M > 150M limit → triggers approval
  const rfq1b = await prisma.rFQ.upsert({
    where: { rfq_number: 'RFQ-D001B' },
    update: {},
    create: {
      rfq_number: 'RFQ-D001B',
      rfq_date: daysAgo(5),
      customer_id: cust1.id,
      notes: 'Follow-up order — tambahan kabel untuk fase 2 proyek Kencana Tower',
      subtotal: 27_027_027,
      ppn_rate: 11,
      ppn_amount: 2_972_973,
      grand_total: 30_000_000,
      status: 'APPROVED',
      created_by: createdBy,
      items: {
        create: [
          { product_id: p1, warehouse_id: wh, qty: 36, unit_price: 750_751, subtotal: 27_027_036 },
        ],
      },
    },
  });

  // New SO (DRAFT) — waiting to be confirmed — will trigger PENDING_CREDIT_APPROVAL on confirm
  await prisma.salesOrder.upsert({
    where: { so_number: 'SO-D001B' },
    update: {},
    create: {
      so_number: 'SO-D001B',
      so_date: daysAgo(4),
      customer_id: cust1.id,
      rfq_id: rfq1b.id,
      subtotal: 27_027_027,
      ppn_rate: 11,
      ppn_amount: 2_972_973,
      grand_total: 30_000_000,
      status: 'DRAFT',   // ← CONFIRM THIS to see credit warning trigger
      is_indent: false,
      created_by: createdBy,
      items: {
        create: [
          { product_id: p1, warehouse_id: wh, qty: 36, unit_price: 750_751, subtotal: 27_027_036 },
        ],
      },
    },
  });

  // ───────────────────────────────────────────────────────────────
  // SCENARIO 2 — PT Mega Konstruksi: EXCEEDED, SO pending approval
  // ───────────────────────────────────────────────────────────────
  console.log('  → Scenario 2: PT Mega Konstruksi (credit exceeded, approval pending)...');

  const cust2 = await prisma.customer.upsert({
    where: { customer_code: 'CUST-D02' },
    update: { credit_limit: 200_000_000 },
    create: {
      customer_code: 'CUST-D02',
      customer_name: 'PT Mega Konstruksi',
      business_type: 'PT',
      industry: 'Infrastruktur',
      npwp: '02.345.678.9-002.000',
      billing_address: 'Jl. Mega Kuningan Blok E, Jakarta Selatan',
      payment_terms: 45,
      credit_limit: 200_000_000,
      status: 'ACTIVE',
      sales_person_id: salesPersonId,
      pics: {
        create: [{ pic_name: 'Ibu Wulandari', position: 'Finance Manager', phone: '08111000002', email: 'wulan@megakonstruksi.co.id', is_primary: true }],
      },
    },
  });

  // Invoice A — 80M outstanding, overdue 100 days → bucket >90
  const do2a = await prisma.deliveryOrder.upsert({
    where: { do_number: 'DO-D002A' },
    update: {},
    create: {
      do_number: 'DO-D002A',
      do_date: daysAgo(120),
      so_id: (await prisma.salesOrder.upsert({
        where: { so_number: 'SO-D002A' },
        update: {},
        create: {
          so_number: 'SO-D002A',
          so_date: daysAgo(125),
          customer_id: cust2.id,
          subtotal: 72_072_072,
          ppn_rate: 11, ppn_amount: 7_927_928, grand_total: 80_000_000,
          status: 'COMPLETED', is_indent: false, created_by: createdBy,
          items: { create: [{ product_id: p1, warehouse_id: wh, qty: 96, unit_price: 750_751, subtotal: 72_072_096 }] },
        },
      })).id,
      customer_id: cust2.id,
      warehouse_id: wh,
      delivery_address: 'Jl. Mega Kuningan Blok E, Jakarta Selatan',
      status: 'DELIVERED', created_by: createdBy,
      items: { create: [{ product_id: p1, qty: 96, unit_price: 750_751, subtotal: 72_072_096 }] },
    },
  });

  await prisma.salesInvoice.upsert({
    where: { invoice_number: 'INV-D002A' },
    update: {},
    create: {
      invoice_number: 'INV-D002A',
      invoice_date: daysAgo(115),
      due_date: daysAgo(100),   // overdue 100 days → bucket >90
      do_id: do2a.id,
      customer_id: cust2.id,
      subtotal: 72_072_072, ppn_rate: 11, ppn_amount: 7_927_928, grand_total: 80_000_000,
      status: 'OVERDUE',   // UNPAID → outstanding AR 80M
      created_by: createdBy,
      items: { create: [{ product_id: p1, qty: 96, unit_price: 750_751, subtotal: 72_072_096 }] },
    },
  });

  // Invoice B — 150M outstanding, overdue 50 days → bucket 31-60
  const do2b = await prisma.deliveryOrder.upsert({
    where: { do_number: 'DO-D002B' },
    update: {},
    create: {
      do_number: 'DO-D002B',
      do_date: daysAgo(65),
      so_id: (await prisma.salesOrder.upsert({
        where: { so_number: 'SO-D002B' },
        update: {},
        create: {
          so_number: 'SO-D002B',
          so_date: daysAgo(70),
          customer_id: cust2.id,
          subtotal: 135_135_135,
          ppn_rate: 11, ppn_amount: 14_864_865, grand_total: 150_000_000,
          status: 'COMPLETED', is_indent: false, created_by: createdBy,
          items: { create: [{ product_id: p2, warehouse_id: wh, qty: 178, unit_price: 759_412, subtotal: 135_175_336 }] },
        },
      })).id,
      customer_id: cust2.id,
      warehouse_id: wh,
      delivery_address: 'Jl. Mega Kuningan Blok E, Jakarta Selatan',
      status: 'DELIVERED', created_by: createdBy,
      items: { create: [{ product_id: p2, qty: 178, unit_price: 759_412, subtotal: 135_175_336 }] },
    },
  });

  await prisma.salesInvoice.upsert({
    where: { invoice_number: 'INV-D002B' },
    update: {},
    create: {
      invoice_number: 'INV-D002B',
      invoice_date: daysAgo(62),
      due_date: daysAgo(50),   // overdue 50 days → bucket 31-60
      do_id: do2b.id,
      customer_id: cust2.id,
      subtotal: 135_135_135, ppn_rate: 11, ppn_amount: 14_864_865, grand_total: 150_000_000,
      status: 'ISSUED',   // UNPAID → outstanding AR 150M
      created_by: createdBy,
      items: { create: [{ product_id: p2, qty: 178, unit_price: 759_412, subtotal: 135_175_336 }] },
    },
  });

  // Total outstanding for cust2: 80M + 150M = 230M > 200M EXCEEDED
  // SO that was submitted and auto-blocked at PENDING_CREDIT_APPROVAL
  const rfq2c = await prisma.rFQ.upsert({
    where: { rfq_number: 'RFQ-D002C' },
    update: {},
    create: {
      rfq_number: 'RFQ-D002C',
      rfq_date: daysAgo(10),
      customer_id: cust2.id,
      notes: 'Order baru panel listrik untuk proyek tol. Sudah disetujui teknis.',
      subtotal: 45_045_045,
      ppn_rate: 11, ppn_amount: 4_954_955, grand_total: 50_000_000,
      status: 'APPROVED',
      created_by: createdBy,
      items: { create: [{ product_id: p1, warehouse_id: wh, qty: 60, unit_price: 750_751, subtotal: 45_045_060 }] },
    },
  });

  // SO in PENDING_CREDIT_APPROVAL — submitted and auto-rejected to approval queue
  await prisma.salesOrder.upsert({
    where: { so_number: 'SO-D002C' },
    update: {},
    create: {
      so_number: 'SO-D002C',
      so_date: daysAgo(8),
      customer_id: cust2.id,
      rfq_id: rfq2c.id,
      subtotal: 45_045_045,
      ppn_rate: 11, ppn_amount: 4_954_955, grand_total: 50_000_000,
      status: 'PENDING_CREDIT_APPROVAL',  // ← blocked by credit system
      is_indent: false,
      created_by: createdBy,
      items: { create: [{ product_id: p1, warehouse_id: wh, qty: 60, unit_price: 750_751, subtotal: 45_045_060 }] },
    },
  });

  // ───────────────────────────────────────────────────────────────
  // SCENARIO 3 — PT Sentosa Elektrindo: safe, aging mix, partly paid
  // ───────────────────────────────────────────────────────────────
  console.log('  → Scenario 3: PT Sentosa Elektrindo (safe credit, aging mix)...');

  const cust3 = await prisma.customer.upsert({
    where: { customer_code: 'CUST-D03' },
    update: { credit_limit: 100_000_000 },
    create: {
      customer_code: 'CUST-D03',
      customer_name: 'PT Sentosa Elektrindo',
      business_type: 'PT',
      industry: 'Elektrikal',
      npwp: '03.456.789.0-003.000',
      billing_address: 'Jl. Sentosa Raya No. 99, Tangerang',
      payment_terms: 30,
      credit_limit: 100_000_000,
      status: 'ACTIVE',
      sales_person_id: salesPersonId,
      pics: {
        create: [{ pic_name: 'Pak Santoso', position: 'Procurement', phone: '08111000003', email: 'santoso@sentosa.co.id', is_primary: true }],
      },
    },
  });

  // Invoice 1 — 80M FULLY PAID (closed, contributes to total_revenue only)
  const do3a = await prisma.deliveryOrder.upsert({
    where: { do_number: 'DO-D003A' },
    update: {},
    create: {
      do_number: 'DO-D003A',
      do_date: daysAgo(90),
      so_id: (await prisma.salesOrder.upsert({
        where: { so_number: 'SO-D003A' },
        update: {},
        create: {
          so_number: 'SO-D003A',
          so_date: daysAgo(95),
          customer_id: cust3.id,
          subtotal: 72_072_072, ppn_rate: 11, ppn_amount: 7_927_928, grand_total: 80_000_000,
          status: 'COMPLETED', is_indent: false, created_by: createdBy,
          items: { create: [{ product_id: p1, warehouse_id: wh, qty: 96, unit_price: 750_751, subtotal: 72_072_096 }] },
        },
      })).id,
      customer_id: cust3.id,
      warehouse_id: wh,
      delivery_address: 'Jl. Sentosa Raya No. 99, Tangerang',
      status: 'DELIVERED', created_by: createdBy,
      items: { create: [{ product_id: p1, qty: 96, unit_price: 750_751, subtotal: 72_072_096 }] },
    },
  });

  const inv3a = await prisma.salesInvoice.upsert({
    where: { invoice_number: 'INV-D003A' },
    update: {},
    create: {
      invoice_number: 'INV-D003A',
      invoice_date: daysAgo(88),
      due_date: daysAgo(58),
      do_id: do3a.id,
      customer_id: cust3.id,
      subtotal: 72_072_072, ppn_rate: 11, ppn_amount: 7_927_928, grand_total: 80_000_000,
      status: 'PAID',   // FULLY PAID → no outstanding AR
      created_by: createdBy,
      items: { create: [{ product_id: p1, qty: 96, unit_price: 750_751, subtotal: 72_072_096 }] },
    },
  });

  // AR Payment for invoice 3A (80M — full payment)
  await prisma.aRPayment.upsert({
    where: { payment_number: 'PAY-D003A' },
    update: {},
    create: {
      payment_number: 'PAY-D003A',
      payment_date: daysAgo(55),
      invoice_id: inv3a.id,
      customer_id: cust3.id,
      amount: 80_000_000,
      method: 'TRANSFER',
      notes: 'Pelunasan invoice INV-D003A — Pembayaran penuh via transfer BCA',
      status: 'CONFIRMED',
      created_by: createdBy,
    },
  });

  // Invoice 2 — 30M, partially paid 15M → 15M outstanding (overdue 20 days → bucket 0-30)
  const do3b = await prisma.deliveryOrder.upsert({
    where: { do_number: 'DO-D003B' },
    update: {},
    create: {
      do_number: 'DO-D003B',
      do_date: daysAgo(35),
      so_id: (await prisma.salesOrder.upsert({
        where: { so_number: 'SO-D003B' },
        update: {},
        create: {
          so_number: 'SO-D003B',
          so_date: daysAgo(38),
          customer_id: cust3.id,
          subtotal: 27_027_027, ppn_rate: 11, ppn_amount: 2_972_973, grand_total: 30_000_000,
          status: 'COMPLETED', is_indent: false, created_by: createdBy,
          items: { create: [{ product_id: p2, warehouse_id: wh, qty: 36, unit_price: 750_751, subtotal: 27_027_036 }] },
        },
      })).id,
      customer_id: cust3.id,
      warehouse_id: wh,
      delivery_address: 'Jl. Sentosa Raya No. 99, Tangerang',
      status: 'DELIVERED', created_by: createdBy,
      items: { create: [{ product_id: p2, qty: 36, unit_price: 750_751, subtotal: 27_027_036 }] },
    },
  });

  const inv3b = await prisma.salesInvoice.upsert({
    where: { invoice_number: 'INV-D003B' },
    update: {},
    create: {
      invoice_number: 'INV-D003B',
      invoice_date: daysAgo(33),
      due_date: daysAgo(20),   // overdue 20 days → bucket 0-30
      do_id: do3b.id,
      customer_id: cust3.id,
      subtotal: 27_027_027, ppn_rate: 11, ppn_amount: 2_972_973, grand_total: 30_000_000,
      status: 'PARTIAL',   // PARTIALLY PAID → 15M outstanding
      created_by: createdBy,
      items: { create: [{ product_id: p2, qty: 36, unit_price: 750_751, subtotal: 27_027_036 }] },
    },
  });

  // Partial payment of 15M
  await prisma.aRPayment.upsert({
    where: { payment_number: 'PAY-D003B' },
    update: {},
    create: {
      payment_number: 'PAY-D003B',
      payment_date: daysAgo(10),
      invoice_id: inv3b.id,
      customer_id: cust3.id,
      amount: 15_000_000,
      method: 'TRANSFER',
      notes: 'Pembayaran sebagian — 50% dari invoice INV-D003B',
      status: 'CONFIRMED',
      created_by: createdBy,
    },
  });

  // New RFQ for scenario 3 (safe — 15M used of 100M, new order 20M → still only 35M = 35% used)
  await prisma.rFQ.upsert({
    where: { rfq_number: 'RFQ-D003C' },
    update: {},
    create: {
      rfq_number: 'RFQ-D003C',
      rfq_date: daysAgo(2),
      customer_id: cust3.id,
      notes: 'Order rutin bulanan — kabel dan accessories',
      subtotal: 18_018_018, ppn_rate: 11, ppn_amount: 1_981_982, grand_total: 20_000_000,
      status: 'DRAFT',
      created_by: createdBy,
      items: { create: [{ product_id: p1, warehouse_id: wh, qty: 24, unit_price: 750_751, subtotal: 18_018_024 }] },
    },
  });

  // ─── Done ───────────────────────────────────────────────────────
  console.log('\n✅  Credit demo seed complete!\n');
  console.log('Demo customers created:');
  console.log('  CUST-D01  PT Kencana Abadi       — credit_limit: 150M, outstanding: 130M (87%)');
  console.log('            → SO-D001B (DRAFT) — confirm it to trigger PENDING_CREDIT_APPROVAL');
  console.log('  CUST-D02  PT Mega Konstruksi      — credit_limit: 200M, outstanding: 230M (EXCEEDED)');
  console.log('            → SO-D002C (PENDING_CREDIT_APPROVAL) — go to Approvals page to act');
  console.log('  CUST-D03  PT Sentosa Elektrindo   — credit_limit: 100M, outstanding: 15M (15%, safe)');
  console.log('            → Invoice 80M PAID, Invoice 30M partial (15M remaining)');
  console.log('\nLogin as admin/admin or uzlah/123123 to access all features.\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
