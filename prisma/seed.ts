import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────
const d = (daysAgo: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - daysAgo);
  return dt;
};

async function main() {
  // ─── ROLES ───────────────────────────────────────────────────
  const roleData = [
    { name: 'SUPER_USER', description: 'Super User — full system access' },
    { name: 'SUPER_ADMIN', description: 'Super Admin — manages users and config' },
    { name: 'SALES', description: 'Sales team — manages sales cycle' },
    { name: 'FINANCE', description: 'Finance team — manages invoices and payments' },
  ];
  for (const r of roleData) {
    await prisma.role.upsert({ where: { name: r.name }, update: {}, create: r });
  }
  console.log('✔ Roles seeded');

  // ─── USERS ───────────────────────────────────────────────────
  const hash = await bcrypt.hash('123123', 12);
  const users = [
    { username: 'uzlah', full_name: 'Uzlah', email: 'uzlah@codenito.id', department: 'Management', role: 'SUPER_USER' },
    { username: 'admin', full_name: 'Admin DEC', email: 'admin@dec.co.id', department: 'IT', role: 'SUPER_ADMIN' },
    { username: 'budi.sales', full_name: 'Budi Santoso', email: 'budi@dec.co.id', department: 'Sales', role: 'SALES' },
    { username: 'sari.finance', full_name: 'Sari Dewi', email: 'sari@dec.co.id', department: 'Finance', role: 'FINANCE' },
    { username: 'eko.sales', full_name: 'Eko Prasetyo', email: 'eko@dec.co.id', department: 'Sales', role: 'SALES' },
  ];
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { username: u.username, full_name: u.full_name, email: u.email, password: hash, department: u.department, status: 'ACTIVE' },
    });
    const role = await prisma.role.findUnique({ where: { name: u.role } });
    if (role) {
      await prisma.userRole.upsert({
        where: { user_id_role_id: { user_id: user.id, role_id: role.id } },
        update: {},
        create: { user_id: user.id, role_id: role.id },
      });
    }
  }
  console.log('✔ Users seeded (5 users)');

  // ─── PRODUCT CATEGORIES ──────────────────────────────────────
  const categories = [
    'Kabel & Wiring',
    'Panel & Switchgear',
    'MCB, MCCB & Circuit Breaker',
    'Lampu & Lighting',
    'Konektor & Terminal',
  ];
  const catMap: Record<string, number> = {};
  for (const name of categories) {
    const cat = await prisma.productCategory.upsert({ where: { name }, update: {}, create: { name } });
    catMap[name] = cat.id;
  }
  console.log('✔ Product categories seeded (5)');

  // ─── PRODUCTS ────────────────────────────────────────────────
  const products = [
    { product_code: 'KBL-001', product_name: 'Kabel NYY 4x10mm', uom: 'Meter', category: 'Kabel & Wiring', sell: 45000, buy: 38000, desc: 'Kabel listrik 4 core 10mm persegi' },
    { product_code: 'KBL-002', product_name: 'Kabel NYM 3x2.5mm', uom: 'Meter', category: 'Kabel & Wiring', sell: 12000, buy: 9500, desc: 'Kabel NYM 3 core 2.5mm persegi' },
    { product_code: 'KBL-003', product_name: 'Kabel NYY 4x25mm', uom: 'Meter', category: 'Kabel & Wiring', sell: 95000, buy: 78000, desc: 'Kabel listrik 4 core 25mm persegi' },
    { product_code: 'KBL-004', product_name: 'Kabel NYFGBY 4x16mm', uom: 'Meter', category: 'Kabel & Wiring', sell: 72000, buy: 59000, desc: 'Kabel tanah armored 4x16mm' },
    { product_code: 'KBL-005', product_name: 'Kabel Coaxial RG6', uom: 'Meter', category: 'Kabel & Wiring', sell: 8500, buy: 6500 },
    { product_code: 'PNL-001', product_name: 'Panel Box 12 Group IP44', uom: 'Unit', category: 'Panel & Switchgear', sell: 850000, buy: 680000, desc: 'Panel distribusi 12 grup IP44' },
    { product_code: 'PNL-002', product_name: 'Panel Box 24 Group IP65', uom: 'Unit', category: 'Panel & Switchgear', sell: 1450000, buy: 1150000, desc: 'Panel distribusi 24 grup IP65' },
    { product_code: 'PNL-003', product_name: 'MDP Panel 200A', uom: 'Unit', category: 'Panel & Switchgear', sell: 8500000, buy: 6800000, desc: 'Main Distribution Panel 200A' },
    { product_code: 'MCB-001', product_name: 'MCB 1P 10A Schneider', uom: 'Pcs', category: 'MCB, MCCB & Circuit Breaker', sell: 85000, buy: 65000 },
    { product_code: 'MCB-002', product_name: 'MCB 1P 16A Schneider', uom: 'Pcs', category: 'MCB, MCCB & Circuit Breaker', sell: 90000, buy: 70000 },
    { product_code: 'MCB-003', product_name: 'MCB 3P 32A Schneider', uom: 'Pcs', category: 'MCB, MCCB & Circuit Breaker', sell: 280000, buy: 220000 },
    { product_code: 'MCB-004', product_name: 'MCCB 3P 100A Schneider', uom: 'Pcs', category: 'MCB, MCCB & Circuit Breaker', sell: 1850000, buy: 1480000 },
    { product_code: 'LMP-001', product_name: 'Lampu LED Bulb 18W Philips', uom: 'Pcs', category: 'Lampu & Lighting', sell: 65000, buy: 48000 },
    { product_code: 'LMP-002', product_name: 'Lampu TL LED T8 18W 120cm', uom: 'Pcs', category: 'Lampu & Lighting', sell: 85000, buy: 65000 },
    { product_code: 'LMP-003', product_name: 'Lampu Sorot LED 100W Outdoor', uom: 'Pcs', category: 'Lampu & Lighting', sell: 350000, buy: 270000 },
    { product_code: 'KNK-001', product_name: 'Terminal Block 4mm² (per box 100pcs)', uom: 'Box', category: 'Konektor & Terminal', sell: 125000, buy: 95000 },
    { product_code: 'KNK-002', product_name: 'Konektor Sepatu 10mm² (50pcs)', uom: 'Pack', category: 'Konektor & Terminal', sell: 45000, buy: 32000 },
    { product_code: 'KNK-003', product_name: 'Conduit PVC 20mm (3m)', uom: 'Batang', category: 'Konektor & Terminal', sell: 15000, buy: 11000 },
    { product_code: 'KNK-004', product_name: 'Trunking PVC 60x40mm (2m)', uom: 'Batang', category: 'Konektor & Terminal', sell: 55000, buy: 42000 },
    { product_code: 'KNK-005', product_name: 'Isolasi Tape 3M (roll)', uom: 'Roll', category: 'Konektor & Terminal', sell: 22000, buy: 16000 },
  ];

  const productMap: Record<string, number> = {};
  for (const p of products) {
    const prod = await prisma.product.upsert({
      where: { product_code: p.product_code },
      update: {},
      create: {
        product_code: p.product_code,
        product_name: p.product_name,
        uom: p.uom,
        description: p.desc,
        default_selling_price: p.sell,
        default_purchase_price: p.buy,
        category_id: catMap[p.category],
      },
    });
    productMap[p.product_code] = prod.id;
  }
  console.log('✔ Products seeded (20)');

  // ─── WAREHOUSES ──────────────────────────────────────────────
  const warehouses = [
    { warehouse_code: 'WH-JKT', warehouse_name: 'Gudang Pusat Jakarta', address: 'Jl. Industri Raya No.12, Cengkareng, Jakarta Barat', contact_phone: '+6221-5555-1234', manager_name: 'Hendro Wijaya' },
    { warehouse_code: 'WH-BKS', warehouse_name: 'Gudang Bekasi', address: 'Kawasan Industri MM2100, Bekasi, Jawa Barat', contact_phone: '+6221-8888-5678', manager_name: 'Agus Prasetyo' },
    { warehouse_code: 'WH-SBY', warehouse_name: 'Gudang Surabaya', address: 'Jl. Margomulyo No.3, Surabaya, Jawa Timur', contact_phone: '+6231-7777-9012', manager_name: 'Dwi Santoso' },
  ];
  const whMap: Record<string, number> = {};
  for (const w of warehouses) {
    const wh = await prisma.warehouse.upsert({
      where: { warehouse_code: w.warehouse_code },
      update: {},
      create: w,
    });
    whMap[w.warehouse_code] = wh.id;
  }
  console.log('✔ Warehouses seeded (3)');

  // ─── WAREHOUSE STOCKS + STOCK MOVEMENTS (Initial Stock) ──────
  const stockData = [
    { code: 'KBL-001', wh: 'WH-JKT', qty: 5000, low: 500, cost: 38000 },
    { code: 'KBL-002', wh: 'WH-JKT', qty: 8000, low: 1000, cost: 9500 },
    { code: 'KBL-003', wh: 'WH-JKT', qty: 2500, low: 300, cost: 78000 },
    { code: 'KBL-004', wh: 'WH-JKT', qty: 1800, low: 200, cost: 59000 },
    { code: 'KBL-005', wh: 'WH-JKT', qty: 3000, low: 500, cost: 6500 },
    { code: 'PNL-001', wh: 'WH-JKT', qty: 150, low: 20, cost: 680000 },
    { code: 'PNL-002', wh: 'WH-JKT', qty: 80, low: 10, cost: 1150000 },
    { code: 'PNL-003', wh: 'WH-JKT', qty: 25, low: 5, cost: 6800000 },
    { code: 'MCB-001', wh: 'WH-JKT', qty: 500, low: 50, cost: 65000 },
    { code: 'MCB-002', wh: 'WH-JKT', qty: 450, low: 50, cost: 70000 },
    { code: 'MCB-003', wh: 'WH-JKT', qty: 200, low: 30, cost: 220000 },
    { code: 'MCB-004', wh: 'WH-JKT', qty: 80, low: 10, cost: 1480000 },
    { code: 'LMP-001', wh: 'WH-JKT', qty: 300, low: 50, cost: 48000 },
    { code: 'LMP-002', wh: 'WH-JKT', qty: 250, low: 50, cost: 65000 },
    { code: 'LMP-003', wh: 'WH-JKT', qty: 120, low: 20, cost: 270000 },
    { code: 'KNK-001', wh: 'WH-JKT', qty: 100, low: 15, cost: 95000 },
    { code: 'KNK-002', wh: 'WH-JKT', qty: 200, low: 30, cost: 32000 },
    { code: 'KNK-003', wh: 'WH-JKT', qty: 1000, low: 150, cost: 11000 },
    { code: 'KNK-004', wh: 'WH-JKT', qty: 500, low: 80, cost: 42000 },
    { code: 'KNK-005', wh: 'WH-JKT', qty: 400, low: 80, cost: 16000 },
    // Bekasi warehouse — subset of items
    { code: 'KBL-001', wh: 'WH-BKS', qty: 2000, low: 300, cost: 38000 },
    { code: 'KBL-002', wh: 'WH-BKS', qty: 3000, low: 500, cost: 9500 },
    { code: 'MCB-001', wh: 'WH-BKS', qty: 200, low: 30, cost: 65000 },
    { code: 'MCB-002', wh: 'WH-BKS', qty: 180, low: 30, cost: 70000 },
    { code: 'LMP-001', wh: 'WH-BKS', qty: 150, low: 30, cost: 48000 },
  ];

  for (const s of stockData) {
    const pid = productMap[s.code];
    const wid = whMap[s.wh];
    if (!pid || !wid) continue;

    // Upsert warehouse stock
    await prisma.warehouseStock.upsert({
      where: { product_id_warehouse_id: { product_id: pid, warehouse_id: wid } },
      update: { quantity: s.qty, low_stock_threshold: s.low },
      create: { product_id: pid, warehouse_id: wid, quantity: s.qty, low_stock_threshold: s.low },
    });

    // Initial IN stock movement
    const existingMovement = await prisma.stockMovement.findFirst({
      where: { product_id: pid, warehouse_id: wid, reference_type: 'ADJUST', notes: 'Initial stock' },
    });
    if (!existingMovement) {
      await prisma.stockMovement.create({
        data: {
          product_id: pid, warehouse_id: wid,
          movement_type: 'IN', quantity: s.qty,
          reference_type: 'ADJUST', reference_number: 'INIT-STOCK',
          unit_cost: s.cost, notes: 'Initial stock',
          created_at: d(60),
        },
      });
    }
  }
  console.log('✔ Warehouse stocks + initial movements seeded');

  // ─── CUSTOMERS ───────────────────────────────────────────────
  const customers = [
    {
      customer_code: 'CUST-001', customer_name: 'PT Sumber Makmur Jaya', business_type: 'PT',
      industry: 'Konstruksi', npwp: '01.234.567.8-021.000',
      billing_address: 'Jl. Sudirman Kav.52, Jakarta Selatan', payment_terms: 30, credit_limit: 500000000,
      pics: [
        { pic_name: 'Bpk. Hendra Gunawan', position: 'Procurement Manager', phone: '+628111234567', email: 'hendra@sumber.co.id', is_primary: true },
        { pic_name: 'Ibu Rina Marlina', position: 'Finance', phone: '+628111234568', email: 'rina@sumber.co.id', is_primary: false },
      ],
    },
    {
      customer_code: 'CUST-002', customer_name: 'PT Bangunan Indah Persada', business_type: 'PT',
      industry: 'Konstruksi', npwp: '02.345.678.9-022.000',
      billing_address: 'Jl. Gatot Subroto No.18, Jakarta', payment_terms: 45, credit_limit: 750000000,
      pics: [
        { pic_name: 'Bpk. Anton Susilo', position: 'Site Manager', phone: '+628122345678', email: 'anton@bangunan.co.id', is_primary: true },
      ],
    },
    {
      customer_code: 'CUST-003', customer_name: 'CV Karya Listrik Mandiri', business_type: 'CV',
      industry: 'Elektrikal', payment_terms: 14, credit_limit: 150000000,
      pics: [
        { pic_name: 'Bpk. Wawan Setiawan', position: 'Owner', phone: '+628133456789', email: 'wawan@karyalistrik.com', is_primary: true },
      ],
    },
    {
      customer_code: 'CUST-004', customer_name: 'PT Elektro Nusantara', business_type: 'PT',
      industry: 'Manufaktur', npwp: '04.567.890.1-024.000',
      billing_address: 'Kawasan EJIP, Cikarang', payment_terms: 30, credit_limit: 1000000000,
      pics: [
        { pic_name: 'Bpk. Joko Widodo', position: 'Purchasing Manager', phone: '+628144567890', email: 'joko@elektro.co.id', is_primary: true },
        { pic_name: 'Ibu Sri Mulyani', position: 'Finance Manager', phone: '+628144567891', email: 'sri@elektro.co.id', is_primary: false },
      ],
    },
    {
      customer_code: 'CUST-005', customer_name: 'PT Graha Konstruksi Utama', business_type: 'PT',
      industry: 'Properti', payment_terms: 60, credit_limit: 2000000000,
      pics: [
        { pic_name: 'Bpk. Bambang Hartono', position: 'Project Director', phone: '+628155678901', email: 'bambang@graha.co.id', is_primary: true },
      ],
    },
    {
      customer_code: 'CUST-006', customer_name: 'CV Multi Teknik Elektrindo', business_type: 'CV',
      industry: 'Elektrikal', payment_terms: 14, credit_limit: 100000000,
      pics: [
        { pic_name: 'Bpk. Dedi Suryana', position: 'Owner/Direktur', phone: '+628166789012', email: 'dedi@multiteknik.com', is_primary: true },
      ],
    },
    {
      customer_code: 'CUST-007', customer_name: 'PT Duta Sarana Perkasa', business_type: 'PT',
      industry: 'Pertambangan', npwp: '07.890.123.4-027.000',
      billing_address: 'Jl. TB Simatupang No.5, Jakarta', payment_terms: 45, credit_limit: 500000000,
      pics: [
        { pic_name: 'Bpk. Andi Rachmat', position: 'Procurement Head', phone: '+628177890123', email: 'andi@duta.co.id', is_primary: true },
      ],
    },
    {
      customer_code: 'CUST-008', customer_name: 'PT Mitra Sejahtera Abadi', business_type: 'PT',
      industry: 'Pemerintahan', payment_terms: 30, credit_limit: 300000000,
      pics: [
        { pic_name: 'Bpk. Rudi Hermawan', position: 'Kepala Bagian', phone: '+628188901234', email: 'rudi@mitra.co.id', is_primary: true },
      ],
    },
  ];

  const custMap: Record<string, number> = {};
  for (const c of customers) {
    const { pics, ...custData } = c;
    const cust = await prisma.customer.upsert({
      where: { customer_code: c.customer_code },
      update: {},
      create: { ...custData },
    });
    custMap[c.customer_code] = cust.id;
    // PICs
    const existingPICs = await prisma.customerPIC.count({ where: { customer_id: cust.id } });
    if (existingPICs === 0) {
      await prisma.customerPIC.createMany({
        data: pics.map((p) => ({ ...p, customer_id: cust.id })),
      });
    }
  }
  console.log('✔ Customers seeded (8)');

  // ─── CUSTOMER PRODUCT CODES ───────────────────────────────────
  // 8 customers × 20 products = 160 entries
  const custPrefixes: Record<string, string> = {
    'CUST-001': 'SMJ', 'CUST-002': 'BIP', 'CUST-003': 'KLM', 'CUST-004': 'EN',
    'CUST-005': 'GKU', 'CUST-006': 'MTE', 'CUST-007': 'DSP', 'CUST-008': 'MSA',
  };
  const allProductCodes = [
    'KBL-001','KBL-002','KBL-003','KBL-004','KBL-005',
    'PNL-001','PNL-002','PNL-003',
    'MCB-001','MCB-002','MCB-003','MCB-004',
    'LMP-001','LMP-002','LMP-003',
    'KNK-001','KNK-002','KNK-003','KNK-004','KNK-005',
  ];

  let cpcCount = 0;
  for (const [custCode, prefix] of Object.entries(custPrefixes)) {
    const custId = custMap[custCode];
    if (!custId) continue;
    for (const prodCode of allProductCodes) {
      const prodId = productMap[prodCode];
      if (!prodId) continue;
      const existing = await prisma.customerProductCode.findFirst({
        where: { customer_id: custId, product_id: prodId },
      });
      if (!existing) {
        await prisma.customerProductCode.create({
          data: {
            customer_id: custId,
            product_id: prodId,
            customer_product_code: `${prefix}-${prodCode}`,
          },
        });
        cpcCount++;
      }
    }
  }
  console.log(`✔ Customer product codes seeded (${cpcCount} new, 160 total)`);

  // ─── SUPPLIERS ───────────────────────────────────────────────
  const suppliers = [
    {
      supplier_code: 'SUPP-001', supplier_name: 'PT Kabel Indonesia', business_type: 'PT',
      npwp: '10.111.222.3-031.000', address: 'Jl. Industri Kabel No.1, Tangerang',
      payment_terms: 30,
      pics: [
        { pic_name: 'Ibu Dewi Rahayu', position: 'Account Manager', phone: '+628111100001', email: 'dewi@kabelindonesia.co.id', is_primary: true },
      ],
    },
    {
      supplier_code: 'SUPP-002', supplier_name: 'PT Schneider Distribusi', business_type: 'PT',
      npwp: '11.222.333.4-032.000', address: 'Sudirman Business District, Jakarta',
      payment_terms: 45,
      pics: [
        { pic_name: 'Bpk. Michael Chen', position: 'Sales Director', phone: '+628122200002', email: 'michael@schneider.co.id', is_primary: true },
        { pic_name: 'Ibu Linda Sari', position: 'Account Executive', phone: '+628122200003', email: 'linda@schneider.co.id', is_primary: false },
      ],
    },
    {
      supplier_code: 'SUPP-003', supplier_name: 'PT Philips Lighting Indonesia', business_type: 'PT',
      npwp: '12.333.444.5-033.000', address: 'Pulogadung Industrial Estate, Jakarta Timur',
      payment_terms: 30,
      pics: [
        { pic_name: 'Bpk. David Tan', position: 'Regional Sales Manager', phone: '+628133300003', email: 'david.tan@philips.com', is_primary: true },
      ],
    },
    {
      supplier_code: 'SUPP-004', supplier_name: 'CV Panel Mandiri', business_type: 'CV',
      address: 'Jl. Raya Bogor KM 35, Depok', payment_terms: 14,
      pics: [
        { pic_name: 'Bpk. Surya Hidayat', position: 'Owner', phone: '+628144400004', email: 'surya@panelmandiri.com', is_primary: true },
      ],
    },
    {
      supplier_code: 'SUPP-005', supplier_name: 'PT Wira Kabel Nusantara', business_type: 'PT',
      npwp: '14.555.666.7-035.000', address: 'Kawasan Industri Pulogadung, Jakarta',
      payment_terms: 30,
      pics: [
        { pic_name: 'Ibu Yanti Kusuma', position: 'Sales Manager', phone: '+628155500005', email: 'yanti@wirakabel.co.id', is_primary: true },
      ],
    },
  ];

  const suppMap: Record<string, number> = {};
  for (const s of suppliers) {
    const { pics, ...suppData } = s;
    const supp = await prisma.supplier.upsert({
      where: { supplier_code: s.supplier_code },
      update: {},
      create: { ...suppData },
    });
    suppMap[s.supplier_code] = supp.id;
    const existingPICs = await prisma.supplierPIC.count({ where: { supplier_id: supp.id } });
    if (existingPICs === 0) {
      await prisma.supplierPIC.createMany({
        data: pics.map((p) => ({ ...p, supplier_id: supp.id })),
      });
    }
  }
  console.log('✔ Suppliers seeded (5)');

  // ─── PURCHASE ORDERS ─────────────────────────────────────────
  const existingPO = await prisma.purchaseOrder.count();
  if (existingPO === 0) {
    const po1 = await prisma.purchaseOrder.create({
      data: {
        po_number: 'PO-2025-001', po_date: d(45), supplier_id: suppMap['SUPP-001'],
        subtotal: 38000 * 2000, ppn_amount: 38000 * 2000 * 0.11,
        grand_total: 38000 * 2000 * 1.11, status: 'RECEIVED',
        items: {
          create: [
            { product_id: productMap['KBL-001'], qty: 2000, unit_price: 38000, subtotal: 38000 * 2000 },
            { product_id: productMap['KBL-002'], qty: 3000, unit_price: 9500, subtotal: 9500 * 3000, warehouse_id: whMap['WH-JKT'] },
          ],
        },
      },
    });

    await prisma.purchaseOrder.create({
      data: {
        po_number: 'PO-2025-002', po_date: d(30), supplier_id: suppMap['SUPP-002'],
        subtotal: 65000 * 300 + 70000 * 200, ppn_amount: (65000 * 300 + 70000 * 200) * 0.11,
        grand_total: (65000 * 300 + 70000 * 200) * 1.11, status: 'APPROVED',
        items: {
          create: [
            { product_id: productMap['MCB-001'], qty: 300, unit_price: 65000, subtotal: 65000 * 300, warehouse_id: whMap['WH-JKT'] },
            { product_id: productMap['MCB-002'], qty: 200, unit_price: 70000, subtotal: 70000 * 200, warehouse_id: whMap['WH-JKT'] },
            { product_id: productMap['MCB-003'], qty: 100, unit_price: 220000, subtotal: 220000 * 100, warehouse_id: whMap['WH-JKT'] },
          ],
        },
      },
    });

    await prisma.purchaseOrder.create({
      data: {
        po_number: 'PO-2025-003', po_date: d(15), supplier_id: suppMap['SUPP-003'],
        subtotal: 48000 * 200 + 65000 * 150, ppn_amount: (48000 * 200 + 65000 * 150) * 0.11,
        grand_total: (48000 * 200 + 65000 * 150) * 1.11, status: 'PENDING_APPROVAL',
        items: {
          create: [
            { product_id: productMap['LMP-001'], qty: 200, unit_price: 48000, subtotal: 48000 * 200 },
            { product_id: productMap['LMP-002'], qty: 150, unit_price: 65000, subtotal: 65000 * 150 },
          ],
        },
      },
    });

    await prisma.purchaseOrder.create({
      data: {
        po_number: 'PO-2025-004', po_date: d(5), supplier_id: suppMap['SUPP-001'],
        subtotal: 78000 * 1000, ppn_amount: 78000 * 1000 * 0.11,
        grand_total: 78000 * 1000 * 1.11, status: 'DRAFT',
        items: {
          create: [
            { product_id: productMap['KBL-003'], qty: 1000, unit_price: 78000, subtotal: 78000 * 1000, warehouse_id: whMap['WH-JKT'] },
          ],
        },
      },
    });

    // Goods Receipt for PO-001
    await prisma.goodsReceipt.create({
      data: {
        receipt_number: 'GR-2025-001', receipt_date: d(42), po_id: po1.id,
        supplier_id: suppMap['SUPP-001'], warehouse_id: whMap['WH-JKT'],
        status: 'CONFIRMED', notes: 'Received in good condition',
        items: {
          create: [
            { product_id: productMap['KBL-001'], qty_ordered: 2000, qty_received: 2000, unit_cost: 38000 },
            { product_id: productMap['KBL-002'], qty_ordered: 3000, qty_received: 2800, unit_cost: 9500 },
          ],
        },
      },
    });
    console.log('✔ Purchase Orders seeded (4) + Goods Receipt (1)');
  }

  // ─── RFQs ────────────────────────────────────────────────────
  const existingRFQ = await prisma.rFQ.count();
  if (existingRFQ === 0) {
    const rfq1 = await prisma.rFQ.create({
      data: {
        rfq_number: 'RFQ-2025-001', rfq_date: d(25), customer_id: custMap['CUST-001'],
        subtotal: 45000 * 500 + 12000 * 1000,
        ppn_amount: (45000 * 500 + 12000 * 1000) * 0.11,
        grand_total: (45000 * 500 + 12000 * 1000) * 1.11,
        status: 'APPROVED', notes: 'Untuk proyek gedung Sudirman Tower',
        items: {
          create: [
            { product_id: productMap['KBL-001'], qty: 500, unit_price: 45000, subtotal: 45000 * 500, warehouse_id: whMap['WH-JKT'] },
            { product_id: productMap['KBL-002'], qty: 1000, unit_price: 12000, subtotal: 12000 * 1000, warehouse_id: whMap['WH-JKT'] },
          ],
        },
      },
    });

    const rfq2 = await prisma.rFQ.create({
      data: {
        rfq_number: 'RFQ-2025-002', rfq_date: d(20), customer_id: custMap['CUST-004'],
        subtotal: 85000 * 100 + 90000 * 80,
        ppn_amount: (85000 * 100 + 90000 * 80) * 0.11,
        grand_total: (85000 * 100 + 90000 * 80) * 1.11,
        status: 'APPROVED', notes: 'Kebutuhan pabrik Cikarang fase 2',
        items: {
          create: [
            { product_id: productMap['MCB-001'], qty: 100, unit_price: 85000, subtotal: 85000 * 100, warehouse_id: whMap['WH-JKT'] },
            { product_id: productMap['MCB-002'], qty: 80, unit_price: 90000, subtotal: 90000 * 80, warehouse_id: whMap['WH-JKT'] },
            { product_id: productMap['PNL-001'], qty: 10, unit_price: 850000, subtotal: 850000 * 10, warehouse_id: whMap['WH-JKT'] },
          ],
        },
      },
    });

    await prisma.rFQ.create({
      data: {
        rfq_number: 'RFQ-2025-003', rfq_date: d(10), customer_id: custMap['CUST-005'],
        subtotal: 65000 * 200 + 85000 * 150 + 350000 * 30,
        ppn_amount: (65000 * 200 + 85000 * 150 + 350000 * 30) * 0.11,
        grand_total: (65000 * 200 + 85000 * 150 + 350000 * 30) * 1.11,
        status: 'SENT', notes: 'Proyek perumahan Graha Indah',
        items: {
          create: [
            { product_id: productMap['LMP-001'], qty: 200, unit_price: 65000, subtotal: 65000 * 200 },
            { product_id: productMap['LMP-002'], qty: 150, unit_price: 85000, subtotal: 85000 * 150 },
            { product_id: productMap['LMP-003'], qty: 30, unit_price: 350000, subtotal: 350000 * 30 },
          ],
        },
      },
    });

    await prisma.rFQ.create({
      data: {
        rfq_number: 'RFQ-2025-004', rfq_date: d(3), customer_id: custMap['CUST-002'],
        subtotal: 95000 * 300,
        ppn_amount: 95000 * 300 * 0.11,
        grand_total: 95000 * 300 * 1.11,
        status: 'DRAFT', notes: 'Kebutuhan proyek Gatot Subroto',
        items: {
          create: [
            { product_id: productMap['KBL-003'], qty: 300, unit_price: 95000, subtotal: 95000 * 300 },
          ],
        },
      },
    });

    await prisma.rFQ.create({
      data: {
        rfq_number: 'RFQ-2025-005', rfq_date: d(35), customer_id: custMap['CUST-003'],
        subtotal: 125000 * 50 + 45000 * 100,
        ppn_amount: (125000 * 50 + 45000 * 100) * 0.11,
        grand_total: (125000 * 50 + 45000 * 100) * 1.11,
        status: 'REJECTED', notes: 'Harga tidak sesuai budget',
        items: {
          create: [
            { product_id: productMap['KNK-001'], qty: 50, unit_price: 125000, subtotal: 125000 * 50 },
            { product_id: productMap['KNK-002'], qty: 100, unit_price: 45000, subtotal: 45000 * 100 },
          ],
        },
      },
    });

    // ─── SALES ORDERS (from approved RFQs) ─────────────────────
    const so1Sub = 45000 * 500 + 12000 * 1000;
    const so1 = await prisma.salesOrder.create({
      data: {
        so_number: 'SO-2025-001', so_date: d(22), customer_id: custMap['CUST-001'],
        rfq_id: rfq1.id, subtotal: so1Sub, ppn_amount: so1Sub * 0.11,
        grand_total: so1Sub * 1.11, status: 'COMPLETED',
        items: {
          create: [
            { product_id: productMap['KBL-001'], qty: 500, unit_price: 45000, subtotal: 45000 * 500, warehouse_id: whMap['WH-JKT'] },
            { product_id: productMap['KBL-002'], qty: 1000, unit_price: 12000, subtotal: 12000 * 1000, warehouse_id: whMap['WH-JKT'] },
          ],
        },
      },
    });

    const so2Sub = 85000 * 100 + 90000 * 80 + 850000 * 10;
    const so2 = await prisma.salesOrder.create({
      data: {
        so_number: 'SO-2025-002', so_date: d(18), customer_id: custMap['CUST-004'],
        rfq_id: rfq2.id, subtotal: so2Sub, ppn_amount: so2Sub * 0.11,
        grand_total: so2Sub * 1.11, status: 'PROCESSING',
        items: {
          create: [
            { product_id: productMap['MCB-001'], qty: 100, unit_price: 85000, subtotal: 85000 * 100, warehouse_id: whMap['WH-JKT'] },
            { product_id: productMap['MCB-002'], qty: 80, unit_price: 90000, subtotal: 90000 * 80, warehouse_id: whMap['WH-JKT'] },
            { product_id: productMap['PNL-001'], qty: 10, unit_price: 850000, subtotal: 850000 * 10, warehouse_id: whMap['WH-JKT'] },
          ],
        },
      },
    });

    await prisma.salesOrder.create({
      data: {
        so_number: 'SO-2025-003', so_date: d(12), customer_id: custMap['CUST-007'],
        subtotal: 72000 * 200, ppn_amount: 72000 * 200 * 0.11,
        grand_total: 72000 * 200 * 1.11, is_indent: true, status: 'CONFIRMED',
        notes: 'Indent — stok belum tersedia',
        items: {
          create: [
            { product_id: productMap['KBL-004'], qty: 200, unit_price: 72000, subtotal: 72000 * 200, warehouse_id: whMap['WH-JKT'] },
          ],
        },
      },
    });

    // ─── DELIVERY ORDERS ────────────────────────────────────────
    const do1Sub = 45000 * 500 + 12000 * 1000;
    const do1 = await prisma.deliveryOrder.create({
      data: {
        do_number: 'DO-2025-001', do_date: d(20), so_id: so1.id,
        customer_id: custMap['CUST-001'], warehouse_id: whMap['WH-JKT'],
        delivery_address: 'Proyek Sudirman Tower Lt.B2, Jakarta Selatan',
        status: 'DELIVERED',
        items: {
          create: [
            { product_id: productMap['KBL-001'], qty: 500, unit_price: 45000, subtotal: 45000 * 500 },
            { product_id: productMap['KBL-002'], qty: 1000, unit_price: 12000, subtotal: 12000 * 1000 },
          ],
        },
      },
    });

    await prisma.deliveryOrder.create({
      data: {
        do_number: 'DO-2025-002', do_date: d(14), so_id: so2.id,
        customer_id: custMap['CUST-004'], warehouse_id: whMap['WH-JKT'],
        delivery_address: 'Pabrik Cikarang, Jl. MM2100 Blok A-5',
        status: 'SHIPPED',
        items: {
          create: [
            { product_id: productMap['MCB-001'], qty: 100, unit_price: 85000, subtotal: 85000 * 100 },
            { product_id: productMap['MCB-002'], qty: 80, unit_price: 90000, subtotal: 90000 * 80 },
            { product_id: productMap['PNL-001'], qty: 10, unit_price: 850000, subtotal: 850000 * 10 },
          ],
        },
      },
    });

    // Stock movements for deliveries
    await prisma.stockMovement.createMany({
      data: [
        { product_id: productMap['KBL-001'], warehouse_id: whMap['WH-JKT'], movement_type: 'OUT', quantity: 500, reference_type: 'DO', reference_id: do1.id, reference_number: 'DO-2025-001', unit_cost: 38000, created_at: d(20) },
        { product_id: productMap['KBL-002'], warehouse_id: whMap['WH-JKT'], movement_type: 'OUT', quantity: 1000, reference_type: 'DO', reference_id: do1.id, reference_number: 'DO-2025-001', unit_cost: 9500, created_at: d(20) },
      ],
    });

    // ─── SALES INVOICES ─────────────────────────────────────────
    const inv1Sub = do1Sub;
    const inv1 = await prisma.salesInvoice.create({
      data: {
        invoice_number: 'INV-2025-001', invoice_date: d(18),
        due_date: new Date(d(18).getTime() + 30 * 24 * 60 * 60 * 1000),
        do_id: do1.id, customer_id: custMap['CUST-001'],
        subtotal: inv1Sub, ppn_amount: inv1Sub * 0.11, grand_total: inv1Sub * 1.11,
        status: 'PAID',
        items: {
          create: [
            { product_id: productMap['KBL-001'], qty: 500, unit_price: 45000, subtotal: 45000 * 500 },
            { product_id: productMap['KBL-002'], qty: 1000, unit_price: 12000, subtotal: 12000 * 1000 },
          ],
        },
      },
    });

    // AR Payment for invoice 1
    await prisma.aRPayment.create({
      data: {
        payment_number: 'PAY-2025-001', payment_date: d(5),
        invoice_id: inv1.id, customer_id: custMap['CUST-001'],
        amount: inv1Sub * 1.11, method: 'TRANSFER',
        notes: 'Transfer BCA full payment', status: 'CONFIRMED',
      },
    });

    // Second invoice (outstanding)
    const inv2Sub = 85000 * 100 + 90000 * 80 + 850000 * 10;
    await prisma.salesInvoice.create({
      data: {
        invoice_number: 'INV-2025-002', invoice_date: d(12),
        due_date: new Date(d(12).getTime() + 30 * 24 * 60 * 60 * 1000),
        do_id: do1.id, customer_id: custMap['CUST-004'],
        subtotal: inv2Sub, ppn_amount: inv2Sub * 0.11, grand_total: inv2Sub * 1.11,
        status: 'ISSUED',
        items: {
          create: [
            { product_id: productMap['MCB-001'], qty: 100, unit_price: 85000, subtotal: 85000 * 100 },
            { product_id: productMap['MCB-002'], qty: 80, unit_price: 90000, subtotal: 90000 * 80 },
            { product_id: productMap['PNL-001'], qty: 10, unit_price: 850000, subtotal: 850000 * 10 },
          ],
        },
      },
    });

    // ─── PENDING PRICE APPROVAL EXAMPLES ────────────────────────
    // RFQ with price below default_selling_price (KBL-001 sell=45000, offered at 38000)
    await prisma.rFQ.create({
      data: {
        rfq_number: 'RFQ-2025-006', rfq_date: d(2), customer_id: custMap['CUST-006'],
        subtotal: 38000 * 200, ppn_amount: 38000 * 200 * 0.11,
        grand_total: 38000 * 200 * 1.11,
        status: 'PENDING_PRICE_APPROVAL',
        notes: 'Harga khusus diminta customer — perlu persetujuan manager',
        items: {
          create: [
            { product_id: productMap['KBL-001'], qty: 200, unit_price: 38000, subtotal: 38000 * 200, warehouse_id: whMap['WH-JKT'] },
          ],
        },
      },
    });

    // PO with price above default_purchase_price (KBL-003 buy=78000, offered at 85000)
    await prisma.purchaseOrder.create({
      data: {
        po_number: 'PO-2025-005', po_date: d(2), supplier_id: suppMap['SUPP-005'],
        subtotal: 85000 * 500, ppn_amount: 85000 * 500 * 0.11,
        grand_total: 85000 * 500 * 1.11,
        status: 'PENDING_PRICE_APPROVAL',
        notes: 'Harga lebih tinggi dari HPP standar — perlu approval manager',
        items: {
          create: [
            { product_id: productMap['KBL-003'], qty: 500, unit_price: 85000, subtotal: 85000 * 500, warehouse_id: whMap['WH-JKT'] },
          ],
        },
      },
    });

    // Additional SO with CONFIRMED status (for DO creation demo)
    await prisma.salesOrder.create({
      data: {
        so_number: 'SO-2025-004', so_date: d(8), customer_id: custMap['CUST-008'],
        subtotal: 65000 * 150 + 85000 * 100, ppn_amount: (65000 * 150 + 85000 * 100) * 0.11,
        grand_total: (65000 * 150 + 85000 * 100) * 1.11, status: 'CONFIRMED',
        notes: 'Proyek kantor pemerintahan — siap dibuat Surat Jalan',
        items: {
          create: [
            { product_id: productMap['LMP-001'], qty: 150, unit_price: 65000, subtotal: 65000 * 150, warehouse_id: whMap['WH-JKT'] },
            { product_id: productMap['LMP-002'], qty: 100, unit_price: 85000, subtotal: 85000 * 100, warehouse_id: whMap['WH-JKT'] },
          ],
        },
      },
    });

    // Additional DO with DELIVERED status (for Invoice creation demo)
    const doExtraSub = 280000 * 50;
    const doExtra = await prisma.deliveryOrder.create({
      data: {
        do_number: 'DO-2025-003', do_date: d(5), so_id: so2.id,
        customer_id: custMap['CUST-004'], warehouse_id: whMap['WH-BKS'],
        delivery_address: 'Pabrik Cikarang, Jl. MM2100 Blok B-12',
        status: 'DELIVERED',
        surat_jalan_number: 'SJ-2025-003',
        recipient_name: 'Bpk. Agus Wirawan',
        items: {
          create: [
            { product_id: productMap['MCB-003'], qty: 50, unit_price: 280000, subtotal: doExtraSub },
          ],
        },
      },
    });

    // Invoice for the extra DO
    const invExtraSub = doExtraSub;
    await prisma.salesInvoice.create({
      data: {
        invoice_number: 'INV-2025-003', invoice_date: d(3),
        due_date: new Date(d(3).getTime() + 30 * 24 * 60 * 60 * 1000),
        do_id: doExtra.id, customer_id: custMap['CUST-004'],
        subtotal: invExtraSub, ppn_amount: invExtraSub * 0.11, grand_total: invExtraSub * 1.11,
        status: 'ISSUED',
        items: {
          create: [
            { product_id: productMap['MCB-003'], qty: 50, unit_price: 280000, subtotal: invExtraSub },
          ],
        },
      },
    });

    console.log('✔ RFQs (6), SOs (4), DOs (3), Invoices (3), Payment (1), PO with price approval (1) seeded');
  }

  console.log('\n🎉 All seed data complete!');
  console.log('   Login: uzlah@codenito.id / 123123 (SUPER_USER)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
