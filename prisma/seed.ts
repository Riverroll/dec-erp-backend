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
    'Kabel Tray & Accessories',
    'Wiring Devices & Socket',
    'Sensor & Detector',
    'Grounding & Protection',
  ];
  const catMap: Record<string, number> = {};
  for (const name of categories) {
    const cat = await prisma.productCategory.upsert({ where: { name }, update: {}, create: { name } });
    catMap[name] = cat.id;
  }
  console.log(`✔ Product categories seeded (${categories.length})`);

  // ─── UOM ─────────────────────────────────────────────────────
  const uomData = [
    { uom_code: 'PCS',    uom_name: 'Pieces' },
    { uom_code: 'UNIT',   uom_name: 'Unit' },
    { uom_code: 'METER',  uom_name: 'Meter' },
    { uom_code: 'ROLL',   uom_name: 'Roll' },
    { uom_code: 'BOX',    uom_name: 'Box' },
    { uom_code: 'PACK',   uom_name: 'Pack' },
    { uom_code: 'SET',    uom_name: 'Set' },
    { uom_code: 'KG',     uom_name: 'Kilogram' },
    { uom_code: 'LTR',    uom_name: 'Liter' },
    { uom_code: 'BTG',    uom_name: 'Batang' },
    { uom_code: 'LBR',    uom_name: 'Lembar' },
    { uom_code: 'DRUM',   uom_name: 'Drum' },
    { uom_code: 'LOT',    uom_name: 'Lot' },
  ];
  for (const u of uomData) {
    await prisma.uom.upsert({ where: { uom_code: u.uom_code }, update: {}, create: u });
  }
  console.log(`✔ UOM seeded (${uomData.length})`);

  // ─── BRANDS ──────────────────────────────────────────────────
  const brandData = [
    { brand_code: 'SCHNEIDER', brand_name: 'Schneider Electric',  discount_pct: 15, markup_pct: 5 },
    { brand_code: 'PHILIPS',   brand_name: 'Philips Lighting',     discount_pct: 10, markup_pct: 8 },
    { brand_code: 'SUPREME',   brand_name: 'Supreme Cable',        discount_pct: 12, markup_pct: 7 },
    { brand_code: 'EATON',     brand_name: 'Eaton Corporation',    discount_pct: 10, markup_pct: 6 },
    { brand_code: '3M',        brand_name: '3M Indonesia',         discount_pct: 8,  markup_pct: 5 },
    { brand_code: 'ABB',       brand_name: 'ABB',                  discount_pct: 12, markup_pct: 6 },
    { brand_code: 'SIEMENS',   brand_name: 'Siemens',              discount_pct: 12, markup_pct: 6 },
    { brand_code: 'LEGRAND',   brand_name: 'Legrand',              discount_pct: 10, markup_pct: 5 },
    { brand_code: 'OSRAM',     brand_name: 'Osram Lighting',       discount_pct: 10, markup_pct: 8 },
    { brand_code: 'BELDEN',    brand_name: 'Belden',               discount_pct: 8,  markup_pct: 5 },
    { brand_code: 'PANASONIC', brand_name: 'Panasonic Electric',   discount_pct: 8,  markup_pct: 7 },
    { brand_code: 'OMRON',     brand_name: 'Omron',                discount_pct: 10, markup_pct: 6 },
    { brand_code: 'HAGER',     brand_name: 'Hager',                discount_pct: 10, markup_pct: 5 },
  ];
  const brandMap: Record<string, number> = {};
  for (const b of brandData) {
    const brand = await prisma.brand.upsert({
      where: { brand_code: b.brand_code },
      update: { discount_pct: b.discount_pct, markup_pct: b.markup_pct },
      create: b,
    });
    brandMap[b.brand_code] = brand.id;
  }
  console.log(`✔ Brands seeded (${brandData.length})`);

  // ─── PRODUCTS ────────────────────────────────────────────────
  const products = [
    // ── Kabel & Wiring ───────────────────────────────────────────
    { product_code: 'KBL-001', product_name: 'Kabel NYY 4x10mm²',             uom: 'Meter',  category: 'Kabel & Wiring',            brand: 'SUPREME',   sell: 45000,    buy: 38000,   desc: 'Kabel listrik 4 core 10mm persegi' },
    { product_code: 'KBL-002', product_name: 'Kabel NYM 3x2.5mm²',            uom: 'Meter',  category: 'Kabel & Wiring',            brand: 'SUPREME',   sell: 12000,    buy: 9500,    desc: 'Kabel NYM 3 core 2.5mm persegi' },
    { product_code: 'KBL-003', product_name: 'Kabel NYY 4x25mm²',             uom: 'Meter',  category: 'Kabel & Wiring',            brand: 'SUPREME',   sell: 95000,    buy: 78000,   desc: 'Kabel listrik 4 core 25mm persegi' },
    { product_code: 'KBL-004', product_name: 'Kabel NYFGBY 4x16mm² Armored',  uom: 'Meter',  category: 'Kabel & Wiring',            brand: 'SUPREME',   sell: 72000,    buy: 59000,   desc: 'Kabel tanah armored 4x16mm' },
    { product_code: 'KBL-005', product_name: 'Kabel Coaxial RG6',              uom: 'Meter',  category: 'Kabel & Wiring',            brand: 'SUPREME',   sell: 8500,     buy: 6500 },
    { product_code: 'KBL-006', product_name: 'Kabel NYA 1x4mm²',              uom: 'Meter',  category: 'Kabel & Wiring',            brand: 'SUPREME',   sell: 5500,     buy: 4200,    desc: 'Kabel tunggal NYA 4mm persegi' },
    { product_code: 'KBL-007', product_name: 'Kabel NYAF 1x2.5mm² Fleksibel', uom: 'Meter',  category: 'Kabel & Wiring',            brand: 'SUPREME',   sell: 4200,     buy: 3200,    desc: 'Kabel fleksibel NYAF 2.5mm' },
    { product_code: 'KBL-008', product_name: 'Kabel BC 50mm² Grounding',      uom: 'Meter',  category: 'Kabel & Wiring',            brand: 'SUPREME',   sell: 85000,    buy: 68000,   desc: 'Bare Copper grounding cable 50mm' },
    { product_code: 'KBL-009', product_name: 'Kabel UTP Cat6 Belden',          uom: 'Meter',  category: 'Kabel & Wiring',            brand: 'BELDEN',    sell: 18500,    buy: 14000,   desc: 'Kabel data Cat6 UTP 23AWG' },
    { product_code: 'KBL-010', product_name: 'Kabel FRC Fire Resistant 2x2.5mm²', uom: 'Meter', category: 'Kabel & Wiring',         brand: 'SUPREME',   sell: 32000,    buy: 25000,   desc: 'Fire resistant cable untuk fire alarm' },
    // ── Panel & Switchgear ───────────────────────────────────────
    { product_code: 'PNL-001', product_name: 'Panel Box 12 Group IP44',        uom: 'Unit',   category: 'Panel & Switchgear',        brand: 'EATON',     sell: 850000,   buy: 680000,  desc: 'Panel distribusi 12 grup IP44' },
    { product_code: 'PNL-002', product_name: 'Panel Box 24 Group IP65',        uom: 'Unit',   category: 'Panel & Switchgear',        brand: 'EATON',     sell: 1450000,  buy: 1150000, desc: 'Panel distribusi 24 grup IP65' },
    { product_code: 'PNL-003', product_name: 'MDP Panel 200A',                 uom: 'Unit',   category: 'Panel & Switchgear',        brand: 'EATON',     sell: 8500000,  buy: 6800000, desc: 'Main Distribution Panel 200A' },
    { product_code: 'PNL-004', product_name: 'Panel Box 18 Group IP65 Eaton',  uom: 'Unit',   category: 'Panel & Switchgear',        brand: 'EATON',     sell: 1750000,  buy: 1380000, desc: 'Panel distribusi 18 grup IP65' },
    { product_code: 'PNL-005', product_name: 'LVDB Panel 3P 630A',             uom: 'Unit',   category: 'Panel & Switchgear',        brand: 'SCHNEIDER', sell: 28000000, buy: 22000000,desc: 'Low Voltage Distribution Board 630A' },
    { product_code: 'PNL-006', product_name: 'Busbar Trunking 63A 3m',         uom: 'Batang', category: 'Panel & Switchgear',        brand: 'ABB',       sell: 3500000,  buy: 2800000, desc: 'Busbar trunking system 63A 3 meter' },
    // ── MCB, MCCB & Circuit Breaker ──────────────────────────────
    { product_code: 'MCB-001', product_name: 'MCB 1P 10A Schneider',           uom: 'Pcs',    category: 'MCB, MCCB & Circuit Breaker', brand: 'SCHNEIDER', sell: 85000,  buy: 65000 },
    { product_code: 'MCB-002', product_name: 'MCB 1P 16A Schneider',           uom: 'Pcs',    category: 'MCB, MCCB & Circuit Breaker', brand: 'SCHNEIDER', sell: 90000,  buy: 70000 },
    { product_code: 'MCB-003', product_name: 'MCB 3P 32A Schneider',           uom: 'Pcs',    category: 'MCB, MCCB & Circuit Breaker', brand: 'SCHNEIDER', sell: 280000, buy: 220000 },
    { product_code: 'MCB-004', product_name: 'MCCB 3P 100A Schneider',         uom: 'Pcs',    category: 'MCB, MCCB & Circuit Breaker', brand: 'SCHNEIDER', sell: 1850000,buy: 1480000 },
    { product_code: 'MCB-005', product_name: 'MCB 1P 6A ABB',                  uom: 'Pcs',    category: 'MCB, MCCB & Circuit Breaker', brand: 'ABB',       sell: 92000,  buy: 72000 },
    { product_code: 'MCB-006', product_name: 'MCB 3P 40A ABB',                 uom: 'Pcs',    category: 'MCB, MCCB & Circuit Breaker', brand: 'ABB',       sell: 320000, buy: 255000 },
    { product_code: 'MCB-007', product_name: 'MCCB 3P 160A ABB',               uom: 'Pcs',    category: 'MCB, MCCB & Circuit Breaker', brand: 'ABB',       sell: 4200000,buy: 3350000 },
    { product_code: 'MCB-008', product_name: 'Magnetic Contactor 9A ABB',      uom: 'Pcs',    category: 'MCB, MCCB & Circuit Breaker', brand: 'ABB',       sell: 380000, buy: 300000,  desc: 'Magnetic contactor 9A 220VAC coil' },
    { product_code: 'MCB-009', product_name: 'MCB 1P 10A Siemens',             uom: 'Pcs',    category: 'MCB, MCCB & Circuit Breaker', brand: 'SIEMENS',   sell: 88000,  buy: 68000 },
    { product_code: 'MCB-010', product_name: 'MCCB 3P 63A Siemens',            uom: 'Pcs',    category: 'MCB, MCCB & Circuit Breaker', brand: 'SIEMENS',   sell: 2100000,buy: 1680000 },
    { product_code: 'MCB-011', product_name: 'MCB 1P 16A Hager',               uom: 'Pcs',    category: 'MCB, MCCB & Circuit Breaker', brand: 'HAGER',     sell: 95000,  buy: 74000 },
    { product_code: 'MCB-012', product_name: 'Thermal Overload Relay 9-13A ABB', uom: 'Pcs',  category: 'MCB, MCCB & Circuit Breaker', brand: 'ABB',       sell: 420000, buy: 335000,  desc: 'Thermal overload relay 9-13A' },
    // ── Lampu & Lighting ─────────────────────────────────────────
    { product_code: 'LMP-001', product_name: 'Lampu LED Bulb 18W Philips',          uom: 'Pcs', category: 'Lampu & Lighting', brand: 'PHILIPS', sell: 65000,  buy: 48000 },
    { product_code: 'LMP-002', product_name: 'Lampu TL LED T8 18W 120cm Philips',   uom: 'Pcs', category: 'Lampu & Lighting', brand: 'PHILIPS', sell: 85000,  buy: 65000 },
    { product_code: 'LMP-003', product_name: 'Lampu Sorot LED 100W Philips Outdoor',uom: 'Pcs', category: 'Lampu & Lighting', brand: 'PHILIPS', sell: 350000, buy: 270000 },
    { product_code: 'LMP-004', product_name: 'Lampu LED Bulb 24W Osram',             uom: 'Pcs', category: 'Lampu & Lighting', brand: 'OSRAM',   sell: 72000,  buy: 54000 },
    { product_code: 'LMP-005', product_name: 'Lampu LED Downlight 9W Philips',       uom: 'Pcs', category: 'Lampu & Lighting', brand: 'PHILIPS', sell: 95000,  buy: 72000 },
    { product_code: 'LMP-006', product_name: 'Lampu LED Panel 24W Osram',            uom: 'Pcs', category: 'Lampu & Lighting', brand: 'OSRAM',   sell: 185000, buy: 142000,desc: 'LED panel light 24W 60x60cm' },
    { product_code: 'LMP-007', product_name: 'Lampu LED Emergency 6W',               uom: 'Pcs', category: 'Lampu & Lighting',              sell: 125000, buy: 95000,  desc: 'Emergency lamp dengan baterai 3 jam' },
    { product_code: 'LMP-008', product_name: 'Lampu Sorot LED 50W Osram Outdoor',    uom: 'Pcs', category: 'Lampu & Lighting', brand: 'OSRAM',   sell: 420000, buy: 325000 },
    { product_code: 'LMP-009', product_name: 'Lampu Jalan LED 80W',                  uom: 'Pcs', category: 'Lampu & Lighting',              sell: 750000, buy: 580000, desc: 'LED street lamp 80W IP65' },
    // ── Konektor & Terminal ───────────────────────────────────────
    { product_code: 'KNK-001', product_name: 'Terminal Block 4mm² (per box 100pcs)', uom: 'Box',    category: 'Konektor & Terminal',                   sell: 125000, buy: 95000 },
    { product_code: 'KNK-002', product_name: 'Konektor Sepatu 10mm² (50pcs)',         uom: 'Pack',   category: 'Konektor & Terminal',                   sell: 45000,  buy: 32000 },
    { product_code: 'KNK-003', product_name: 'Conduit PVC 20mm (3m)',                 uom: 'Batang', category: 'Konektor & Terminal',                   sell: 15000,  buy: 11000 },
    { product_code: 'KNK-004', product_name: 'Trunking PVC 60x40mm (2m)',             uom: 'Batang', category: 'Konektor & Terminal',                   sell: 55000,  buy: 42000 },
    { product_code: 'KNK-005', product_name: 'Isolasi Tape 3M (roll)',                uom: 'Roll',   category: 'Konektor & Terminal', brand: '3M',       sell: 22000,  buy: 16000 },
    { product_code: 'KNK-006', product_name: 'Ferrule 1.5mm² (100pcs)',               uom: 'Pack',   category: 'Konektor & Terminal',                   sell: 45000,  buy: 34000,  desc: 'End sleeve ferrule 1.5mm' },
    { product_code: 'KNK-007', product_name: 'DIN Rail 35mm Top Hat 1m',              uom: 'Batang', category: 'Konektor & Terminal',                   sell: 22000,  buy: 16000,  desc: 'DIN rail TS35 steel 1 meter' },
    { product_code: 'KNK-008', product_name: 'Cable Gland M20 (10pcs)',               uom: 'Pack',   category: 'Konektor & Terminal',                   sell: 38000,  buy: 28000 },
    { product_code: 'KNK-009', product_name: 'Heat Shrink Tubing 19mm 3M (5pcs)',     uom: 'Pack',   category: 'Konektor & Terminal', brand: '3M',       sell: 55000,  buy: 40000 },
    // ── Kabel Tray & Accessories ─────────────────────────────────
    { product_code: 'CTR-001', product_name: 'Kabel Tray HDG 100x50mm 3m',       uom: 'Batang', category: 'Kabel Tray & Accessories',               sell: 185000, buy: 145000, desc: 'Hot dip galvanized cable tray 100x50 3m' },
    { product_code: 'CTR-002', product_name: 'Kabel Tray HDG 200x100mm 3m',      uom: 'Batang', category: 'Kabel Tray & Accessories',               sell: 320000, buy: 252000, desc: 'Hot dip galvanized cable tray 200x100 3m' },
    { product_code: 'CTR-003', product_name: 'Kabel Tray Perforated 150x50mm Legrand 3m', uom: 'Batang', category: 'Kabel Tray & Accessories', brand: 'LEGRAND', sell: 275000, buy: 215000 },
    { product_code: 'CTR-004', product_name: 'Support Bracket Kabel Tray 100mm',  uom: 'Pcs',   category: 'Kabel Tray & Accessories',               sell: 32000,  buy: 24000 },
    { product_code: 'CTR-005', product_name: 'Kabel Tray Cover 100mm 3m',         uom: 'Batang', category: 'Kabel Tray & Accessories',               sell: 95000,  buy: 72000 },
    { product_code: 'CTR-006', product_name: 'Cable Ladder Stainless 200x50mm 3m',uom: 'Batang', category: 'Kabel Tray & Accessories',               sell: 680000, buy: 530000, desc: 'Stainless steel cable ladder 200x50' },
    // ── Wiring Devices & Socket ───────────────────────────────────
    { product_code: 'WRD-001', product_name: 'Single Socket 16A Legrand Schuko',  uom: 'Pcs', category: 'Wiring Devices & Socket', brand: 'LEGRAND',   sell: 85000,  buy: 64000 },
    { product_code: 'WRD-002', product_name: 'Double Socket 16A Legrand',          uom: 'Pcs', category: 'Wiring Devices & Socket', brand: 'LEGRAND',   sell: 145000, buy: 112000 },
    { product_code: 'WRD-003', product_name: 'Single Switch 250V Panasonic',       uom: 'Pcs', category: 'Wiring Devices & Socket', brand: 'PANASONIC', sell: 35000,  buy: 26000 },
    { product_code: 'WRD-004', product_name: 'Double Switch 250V Panasonic',       uom: 'Pcs', category: 'Wiring Devices & Socket', brand: 'PANASONIC', sell: 55000,  buy: 42000 },
    { product_code: 'WRD-005', product_name: 'Industrial Socket IP44 32A',         uom: 'Pcs', category: 'Wiring Devices & Socket',                   sell: 285000, buy: 220000, desc: 'Industrial socket IP44 32A 3P+N+E' },
    { product_code: 'WRD-006', product_name: 'Floor Socket Legrand 16A',            uom: 'Pcs', category: 'Wiring Devices & Socket', brand: 'LEGRAND',   sell: 425000, buy: 330000, desc: 'Floor-mounted socket 16A with cover' },
    // ── Sensor & Detector ─────────────────────────────────────────
    { product_code: 'SEN-001', product_name: 'Proximity Sensor NPN 12-24VDC Omron', uom: 'Pcs', category: 'Sensor & Detector', brand: 'OMRON',    sell: 285000, buy: 220000, desc: 'Inductive proximity sensor E2B M12' },
    { product_code: 'SEN-002', product_name: 'Photoelectric Sensor Omron E3F',      uom: 'Pcs', category: 'Sensor & Detector', brand: 'OMRON',    sell: 650000, buy: 500000, desc: 'Photoelectric sensor E3F diffuse mode' },
    { product_code: 'SEN-003', product_name: 'Float Switch Omron 220V',             uom: 'Pcs', category: 'Sensor & Detector', brand: 'OMRON',    sell: 185000, buy: 142000, desc: 'Float switch level control 220V' },
    { product_code: 'SEN-004', product_name: 'Smoke Detector Conventional',         uom: 'Pcs', category: 'Sensor & Detector',                   sell: 320000, buy: 248000, desc: 'Optical smoke detector conventional' },
    { product_code: 'SEN-005', product_name: 'Heat Detector Rate-of-Rise',          uom: 'Pcs', category: 'Sensor & Detector',                   sell: 285000, buy: 220000, desc: 'Heat detector rate of rise + fixed temp' },
    { product_code: 'SEN-006', product_name: 'Manual Call Point Fire Alarm',        uom: 'Pcs', category: 'Sensor & Detector',                   sell: 145000, buy: 112000, desc: 'Break glass manual call point' },
    // ── Grounding & Protection ────────────────────────────────────
    { product_code: 'GRD-001', product_name: 'Earth Rod Copper 5/8" x 1.5m',       uom: 'Batang', category: 'Grounding & Protection',             sell: 125000, buy: 95000,  desc: 'Copper earth rod 5/8 inch 1.5 meter' },
    { product_code: 'GRD-002', product_name: 'Earth Clamp 5/8" Bronze',             uom: 'Pcs',   category: 'Grounding & Protection',             sell: 45000,  buy: 34000 },
    { product_code: 'GRD-003', product_name: 'Grounding Bar 100A 10 Terminal',      uom: 'Pcs',   category: 'Grounding & Protection',             sell: 185000, buy: 142000, desc: 'Copper grounding bar 100A 10-terminal' },
    { product_code: 'GRD-004', product_name: 'Lightning Rod Franklin Type 2m',      uom: 'Unit',  category: 'Grounding & Protection',             sell: 850000, buy: 650000, desc: 'Conventional lightning rod Franklin 2m' },
    { product_code: 'GRD-005', product_name: 'Surge Protective Device 40kA',        uom: 'Pcs',   category: 'Grounding & Protection', brand: 'SCHNEIDER', sell: 580000, buy: 445000, desc: 'SPD Type 2 40kA DIN rail mount' },
  ];

  const productMap: Record<string, number> = {};
  for (const p of products) {
    const prod = await prisma.product.upsert({
      where: { product_code: p.product_code },
      update: { brand_id: (p as any).brand ? brandMap[(p as any).brand] : null },
      create: {
        product_code: p.product_code,
        product_name: p.product_name,
        uom: p.uom,
        description: (p as any).desc,
        default_selling_price: p.sell,
        default_purchase_price: p.buy,
        category_id: catMap[p.category],
        brand_id: (p as any).brand ? brandMap[(p as any).brand] : undefined,
      },
    });
    productMap[p.product_code] = prod.id;
  }
  console.log(`✔ Products seeded (${products.length})`);

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
    // New products — Jakarta warehouse
    { code: 'KBL-006', wh: 'WH-JKT', qty: 10000, low: 1000, cost: 4200 },
    { code: 'KBL-007', wh: 'WH-JKT', qty: 8000,  low: 800,  cost: 3200 },
    { code: 'KBL-008', wh: 'WH-JKT', qty: 2000,  low: 200,  cost: 68000 },
    { code: 'KBL-009', wh: 'WH-JKT', qty: 5000,  low: 500,  cost: 14000 },
    { code: 'KBL-010', wh: 'WH-JKT', qty: 3000,  low: 300,  cost: 25000 },
    { code: 'PNL-004', wh: 'WH-JKT', qty: 60,    low: 8,    cost: 1380000 },
    { code: 'PNL-005', wh: 'WH-JKT', qty: 5,     low: 1,    cost: 22000000 },
    { code: 'PNL-006', wh: 'WH-JKT', qty: 20,    low: 3,    cost: 2800000 },
    { code: 'MCB-005', wh: 'WH-JKT', qty: 350,   low: 40,   cost: 72000 },
    { code: 'MCB-006', wh: 'WH-JKT', qty: 150,   low: 20,   cost: 255000 },
    { code: 'MCB-007', wh: 'WH-JKT', qty: 40,    low: 5,    cost: 3350000 },
    { code: 'MCB-008', wh: 'WH-JKT', qty: 80,    low: 10,   cost: 300000 },
    { code: 'MCB-009', wh: 'WH-JKT', qty: 280,   low: 30,   cost: 68000 },
    { code: 'MCB-010', wh: 'WH-JKT', qty: 30,    low: 5,    cost: 1680000 },
    { code: 'MCB-011', wh: 'WH-JKT', qty: 200,   low: 25,   cost: 74000 },
    { code: 'MCB-012', wh: 'WH-JKT', qty: 60,    low: 8,    cost: 335000 },
    { code: 'LMP-004', wh: 'WH-JKT', qty: 400,   low: 60,   cost: 54000 },
    { code: 'LMP-005', wh: 'WH-JKT', qty: 300,   low: 50,   cost: 72000 },
    { code: 'LMP-006', wh: 'WH-JKT', qty: 180,   low: 30,   cost: 142000 },
    { code: 'LMP-007', wh: 'WH-JKT', qty: 120,   low: 20,   cost: 95000 },
    { code: 'LMP-008', wh: 'WH-JKT', qty: 80,    low: 12,   cost: 325000 },
    { code: 'LMP-009', wh: 'WH-JKT', qty: 40,    low: 6,    cost: 580000 },
    { code: 'KNK-006', wh: 'WH-JKT', qty: 250,   low: 40,   cost: 34000 },
    { code: 'KNK-007', wh: 'WH-JKT', qty: 600,   low: 80,   cost: 16000 },
    { code: 'KNK-008', wh: 'WH-JKT', qty: 300,   low: 50,   cost: 28000 },
    { code: 'KNK-009', wh: 'WH-JKT', qty: 200,   low: 30,   cost: 40000 },
    { code: 'CTR-001', wh: 'WH-JKT', qty: 200,   low: 30,   cost: 145000 },
    { code: 'CTR-002', wh: 'WH-JKT', qty: 120,   low: 20,   cost: 252000 },
    { code: 'CTR-003', wh: 'WH-JKT', qty: 80,    low: 12,   cost: 215000 },
    { code: 'CTR-004', wh: 'WH-JKT', qty: 500,   low: 80,   cost: 24000 },
    { code: 'CTR-005', wh: 'WH-JKT', qty: 150,   low: 25,   cost: 72000 },
    { code: 'CTR-006', wh: 'WH-JKT', qty: 40,    low: 6,    cost: 530000 },
    { code: 'WRD-001', wh: 'WH-JKT', qty: 250,   low: 40,   cost: 64000 },
    { code: 'WRD-002', wh: 'WH-JKT', qty: 180,   low: 30,   cost: 112000 },
    { code: 'WRD-003', wh: 'WH-JKT', qty: 400,   low: 60,   cost: 26000 },
    { code: 'WRD-004', wh: 'WH-JKT', qty: 300,   low: 50,   cost: 42000 },
    { code: 'WRD-005', wh: 'WH-JKT', qty: 80,    low: 12,   cost: 220000 },
    { code: 'WRD-006', wh: 'WH-JKT', qty: 50,    low: 8,    cost: 330000 },
    { code: 'SEN-001', wh: 'WH-JKT', qty: 100,   low: 15,   cost: 220000 },
    { code: 'SEN-002', wh: 'WH-JKT', qty: 60,    low: 10,   cost: 500000 },
    { code: 'SEN-003', wh: 'WH-JKT', qty: 80,    low: 12,   cost: 142000 },
    { code: 'SEN-004', wh: 'WH-JKT', qty: 150,   low: 25,   cost: 248000 },
    { code: 'SEN-005', wh: 'WH-JKT', qty: 120,   low: 20,   cost: 220000 },
    { code: 'SEN-006', wh: 'WH-JKT', qty: 100,   low: 15,   cost: 112000 },
    { code: 'GRD-001', wh: 'WH-JKT', qty: 200,   low: 30,   cost: 95000 },
    { code: 'GRD-002', wh: 'WH-JKT', qty: 300,   low: 50,   cost: 34000 },
    { code: 'GRD-003', wh: 'WH-JKT', qty: 80,    low: 12,   cost: 142000 },
    { code: 'GRD-004', wh: 'WH-JKT', qty: 30,    low: 5,    cost: 650000 },
    { code: 'GRD-005', wh: 'WH-JKT', qty: 60,    low: 10,   cost: 445000 },
    // New products — Bekasi warehouse (fast-moving items)
    { code: 'MCB-005', wh: 'WH-BKS', qty: 150,   low: 20,   cost: 72000 },
    { code: 'MCB-009', wh: 'WH-BKS', qty: 120,   low: 20,   cost: 68000 },
    { code: 'LMP-004', wh: 'WH-BKS', qty: 180,   low: 30,   cost: 54000 },
    { code: 'WRD-003', wh: 'WH-BKS', qty: 200,   low: 30,   cost: 26000 },
    { code: 'KBL-006', wh: 'WH-BKS', qty: 4000,  low: 500,  cost: 4200 },
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
    'KBL-001','KBL-002','KBL-003','KBL-004','KBL-005','KBL-006','KBL-007','KBL-008','KBL-009','KBL-010',
    'PNL-001','PNL-002','PNL-003','PNL-004','PNL-005','PNL-006',
    'MCB-001','MCB-002','MCB-003','MCB-004','MCB-005','MCB-006','MCB-007','MCB-008','MCB-009','MCB-010','MCB-011','MCB-012',
    'LMP-001','LMP-002','LMP-003','LMP-004','LMP-005','LMP-006','LMP-007','LMP-008','LMP-009',
    'KNK-001','KNK-002','KNK-003','KNK-004','KNK-005','KNK-006','KNK-007','KNK-008','KNK-009',
    'CTR-001','CTR-002','CTR-003','CTR-004','CTR-005','CTR-006',
    'WRD-001','WRD-002','WRD-003','WRD-004','WRD-005','WRD-006',
    'SEN-001','SEN-002','SEN-003','SEN-004','SEN-005','SEN-006',
    'GRD-001','GRD-002','GRD-003','GRD-004','GRD-005',
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
  console.log(`✔ Customer product codes seeded (${cpcCount} new)`);

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
    {
      supplier_code: 'SUPP-006', supplier_name: 'PT ABB Sakti Industri', business_type: 'PT',
      npwp: '15.666.777.8-036.000', address: 'Gedung Setiabudi 2, Jl. H. R. Rasuna Said, Jakarta Selatan',
      payment_terms: 45,
      pics: [
        { pic_name: 'Bpk. Kevin Hartanto', position: 'Channel Manager', phone: '+628166600006', email: 'kevin.hartanto@abb.com', is_primary: true },
        { pic_name: 'Ibu Nia Rahayu', position: 'Account Executive', phone: '+628166600007', email: 'nia.rahayu@abb.com', is_primary: false },
      ],
    },
    {
      supplier_code: 'SUPP-007', supplier_name: 'PT Legrand Indonesia', business_type: 'PT',
      npwp: '16.777.888.9-037.000', address: 'Wisma Keiai Lt.7, Jl. Jenderal Sudirman Kav.3, Jakarta',
      payment_terms: 30,
      pics: [
        { pic_name: 'Bpk. Fabian Lim', position: 'Regional Sales Director', phone: '+628177700007', email: 'fabian.lim@legrand.com', is_primary: true },
      ],
    },
    {
      supplier_code: 'SUPP-008', supplier_name: 'CV Sumber Graha Teknik', business_type: 'CV',
      address: 'Jl. Kenari Raya No.15, Senen, Jakarta Pusat',
      payment_terms: 14,
      pics: [
        { pic_name: 'Bpk. Tono Surjadi', position: 'Owner', phone: '+628188800008', email: 'tono@sumbergraha.com', is_primary: true },
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
  console.log(`✔ Suppliers seeded (${suppliers.length})`);

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

  // ─── PURCHASE HISTORY (additional POs + GRs) ─────────────────
  // Seed richer purchase history so Product Detail > Purchase History tab has data
  const existingGR = await prisma.goodsReceipt.count();
  if (existingGR <= 1) {
    // Helper: create PO + GR + stock movements in one go
    const seedPurchase = async (opts: {
      po_number: string;
      po_date: Date;
      receipt_number: string;
      receipt_date: Date;
      supplier_code: string;
      warehouse_code: string;
      items: { product_code: string; qty: number; unit_cost: number }[];
    }) => {
      const suppId = suppMap[opts.supplier_code];
      const whId = whMap[opts.warehouse_code];

      const subtotal = opts.items.reduce((s, i) => s + i.qty * i.unit_cost, 0);
      const ppn_amount = subtotal * 0.11;
      const grand_total = subtotal + ppn_amount;

      const po = await prisma.purchaseOrder.create({
        data: {
          po_number: opts.po_number,
          po_date: opts.po_date,
          supplier_id: suppId,
          subtotal,
          ppn_amount,
          grand_total,
          status: 'RECEIVED',
          items: {
            create: opts.items.map((i) => ({
              product_id: productMap[i.product_code],
              warehouse_id: whId,
              qty: i.qty,
              unit_price: i.unit_cost,
              subtotal: i.qty * i.unit_cost,
            })),
          },
        },
      });

      const gr = await prisma.goodsReceipt.create({
        data: {
          receipt_number: opts.receipt_number,
          receipt_date: opts.receipt_date,
          po_id: po.id,
          supplier_id: suppId,
          warehouse_id: whId,
          status: 'CONFIRMED',
          notes: 'Diterima lengkap, kondisi baik',
          items: {
            create: opts.items.map((i) => ({
              product_id: productMap[i.product_code],
              qty_ordered: i.qty,
              qty_received: i.qty,
              unit_cost: i.unit_cost,
            })),
          },
        },
      });

      // Stock movements (IN) — unit_cost based on purchase price
      for (const item of opts.items) {
        const pid = productMap[item.product_code];
        await prisma.warehouseStock.upsert({
          where: { product_id_warehouse_id: { product_id: pid, warehouse_id: whId } },
          update: { quantity: { increment: item.qty } },
          create: { product_id: pid, warehouse_id: whId, quantity: item.qty },
        });
        await prisma.stockMovement.create({
          data: {
            product_id: pid,
            warehouse_id: whId,
            movement_type: 'IN',
            quantity: item.qty,
            reference_type: 'GR',
            reference_id: gr.id,
            reference_number: opts.receipt_number,
            unit_cost: item.unit_cost,
            created_at: opts.receipt_date,
          },
        });
      }

      return { po, gr };
    };

    // 6 months of purchase history across products and suppliers
    await seedPurchase({
      po_number: 'PO-2024-010', po_date: d(180),
      receipt_number: 'GR-2024-010', receipt_date: d(178),
      supplier_code: 'SUPP-001', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'KBL-001', qty: 3000, unit_cost: 36000 },
        { product_code: 'KBL-002', qty: 5000, unit_cost: 9000 },
        { product_code: 'KBL-003', qty: 800,  unit_cost: 76000 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2024-011', po_date: d(150),
      receipt_number: 'GR-2024-011', receipt_date: d(148),
      supplier_code: 'SUPP-002', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'MCB-001', qty: 400, unit_cost: 63000 },
        { product_code: 'MCB-002', qty: 300, unit_cost: 68000 },
        { product_code: 'MCB-003', qty: 150, unit_cost: 215000 },
        { product_code: 'MCB-004', qty: 50,  unit_cost: 1450000 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2024-012', po_date: d(120),
      receipt_number: 'GR-2024-012', receipt_date: d(118),
      supplier_code: 'SUPP-003', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'LMP-001', qty: 300, unit_cost: 46000 },
        { product_code: 'LMP-002', qty: 200, unit_cost: 63000 },
        { product_code: 'LMP-003', qty: 80,  unit_cost: 265000 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2024-013', po_date: d(90),
      receipt_number: 'GR-2024-013', receipt_date: d(88),
      supplier_code: 'SUPP-004', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'PNL-001', qty: 80,  unit_cost: 665000 },
        { product_code: 'PNL-002', qty: 40,  unit_cost: 1120000 },
        { product_code: 'PNL-003', qty: 10,  unit_cost: 6600000 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2024-014', po_date: d(75),
      receipt_number: 'GR-2024-014', receipt_date: d(73),
      supplier_code: 'SUPP-005', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'KBL-004', qty: 1200, unit_cost: 57000 },
        { product_code: 'KBL-005', qty: 2000, unit_cost: 6200 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2024-015', po_date: d(60),
      receipt_number: 'GR-2024-015', receipt_date: d(58),
      supplier_code: 'SUPP-001', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'KNK-001', qty: 80,  unit_cost: 93000 },
        { product_code: 'KNK-002', qty: 150, unit_cost: 31000 },
        { product_code: 'KNK-003', qty: 800, unit_cost: 10500 },
        { product_code: 'KNK-004', qty: 400, unit_cost: 41000 },
        { product_code: 'KNK-005', qty: 500, unit_cost: 15500 },
      ],
    });

    // More recent POs showing price trends (prices slightly higher)
    await seedPurchase({
      po_number: 'PO-2025-006', po_date: d(40),
      receipt_number: 'GR-2025-002', receipt_date: d(38),
      supplier_code: 'SUPP-001', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'KBL-001', qty: 2500, unit_cost: 37500 },
        { product_code: 'KBL-002', qty: 4000, unit_cost: 9300 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2025-007', po_date: d(25),
      receipt_number: 'GR-2025-003', receipt_date: d(23),
      supplier_code: 'SUPP-002', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'MCB-001', qty: 250, unit_cost: 64500 },
        { product_code: 'MCB-002', qty: 200, unit_cost: 69000 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2025-008', po_date: d(10),
      receipt_number: 'GR-2025-004', receipt_date: d(8),
      supplier_code: 'SUPP-003', warehouse_code: 'WH-BKS',
      items: [
        { product_code: 'LMP-001', qty: 200, unit_cost: 47500 },
        { product_code: 'LMP-002', qty: 150, unit_cost: 64000 },
      ],
    });

    // New brand products — initial purchase history
    await seedPurchase({
      po_number: 'PO-2025-009', po_date: d(50),
      receipt_number: 'GR-2025-005', receipt_date: d(48),
      supplier_code: 'SUPP-006', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'MCB-005', qty: 500, unit_cost: 70000 },
        { product_code: 'MCB-006', qty: 200, unit_cost: 248000 },
        { product_code: 'MCB-007', qty: 50,  unit_cost: 3250000 },
        { product_code: 'MCB-008', qty: 100, unit_cost: 292000 },
        { product_code: 'MCB-012', qty: 80,  unit_cost: 325000 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2025-010', po_date: d(45),
      receipt_number: 'GR-2025-006', receipt_date: d(43),
      supplier_code: 'SUPP-002', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'MCB-009', qty: 350, unit_cost: 66000 },
        { product_code: 'MCB-010', qty: 40,  unit_cost: 1640000 },
        { product_code: 'MCB-011', qty: 280, unit_cost: 72000 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2025-011', po_date: d(35),
      receipt_number: 'GR-2025-007', receipt_date: d(33),
      supplier_code: 'SUPP-007', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'CTR-001', qty: 250, unit_cost: 140000 },
        { product_code: 'CTR-002', qty: 150, unit_cost: 245000 },
        { product_code: 'CTR-003', qty: 100, unit_cost: 208000 },
        { product_code: 'CTR-004', qty: 600, unit_cost: 23000 },
        { product_code: 'CTR-005', qty: 180, unit_cost: 70000 },
        { product_code: 'WRD-001', qty: 300, unit_cost: 62000 },
        { product_code: 'WRD-002', qty: 220, unit_cost: 108000 },
        { product_code: 'WRD-006', qty: 60,  unit_cost: 320000 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2025-012', po_date: d(28),
      receipt_number: 'GR-2025-008', receipt_date: d(26),
      supplier_code: 'SUPP-003', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'LMP-004', qty: 500, unit_cost: 52000 },
        { product_code: 'LMP-006', qty: 220, unit_cost: 138000 },
        { product_code: 'LMP-008', qty: 100, unit_cost: 316000 },
        { product_code: 'LMP-009', qty: 50,  unit_cost: 565000 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2025-013', po_date: d(22),
      receipt_number: 'GR-2025-009', receipt_date: d(20),
      supplier_code: 'SUPP-003', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'LMP-005', qty: 400, unit_cost: 70000 },
        { product_code: 'LMP-007', qty: 150, unit_cost: 92000 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2025-014', po_date: d(18),
      receipt_number: 'GR-2025-010', receipt_date: d(16),
      supplier_code: 'SUPP-008', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'SEN-001', qty: 120, unit_cost: 215000 },
        { product_code: 'SEN-002', qty: 80,  unit_cost: 488000 },
        { product_code: 'SEN-003', qty: 100, unit_cost: 138000 },
        { product_code: 'SEN-004', qty: 200, unit_cost: 242000 },
        { product_code: 'SEN-005', qty: 150, unit_cost: 215000 },
        { product_code: 'SEN-006', qty: 120, unit_cost: 108000 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2025-015', po_date: d(12),
      receipt_number: 'GR-2025-011', receipt_date: d(10),
      supplier_code: 'SUPP-008', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'GRD-001', qty: 250, unit_cost: 92000 },
        { product_code: 'GRD-002', qty: 400, unit_cost: 33000 },
        { product_code: 'GRD-003', qty: 100, unit_cost: 138000 },
        { product_code: 'GRD-004', qty: 40,  unit_cost: 632000 },
        { product_code: 'GRD-005', qty: 80,  unit_cost: 432000 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2025-016', po_date: d(8),
      receipt_number: 'GR-2025-012', receipt_date: d(6),
      supplier_code: 'SUPP-001', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'KBL-006', qty: 12000, unit_cost: 4100 },
        { product_code: 'KBL-007', qty: 9000,  unit_cost: 3100 },
        { product_code: 'KBL-008', qty: 2500,  unit_cost: 66000 },
        { product_code: 'KBL-010', qty: 3500,  unit_cost: 24000 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2025-017', po_date: d(5),
      receipt_number: 'GR-2025-013', receipt_date: d(3),
      supplier_code: 'SUPP-005', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'KBL-009', qty: 6000, unit_cost: 13500 },
        { product_code: 'KNK-006', qty: 300,  unit_cost: 33000 },
        { product_code: 'KNK-007', qty: 700,  unit_cost: 15500 },
        { product_code: 'KNK-008', qty: 350,  unit_cost: 27000 },
        { product_code: 'KNK-009', qty: 250,  unit_cost: 39000 },
        { product_code: 'WRD-003', qty: 500,  unit_cost: 25000 },
        { product_code: 'WRD-004', qty: 380,  unit_cost: 41000 },
        { product_code: 'WRD-005', qty: 100,  unit_cost: 214000 },
      ],
    });

    await seedPurchase({
      po_number: 'PO-2024-016', po_date: d(200),
      receipt_number: 'GR-2024-016', receipt_date: d(198),
      supplier_code: 'SUPP-006', warehouse_code: 'WH-JKT',
      items: [
        { product_code: 'MCB-005', qty: 400, unit_cost: 69000 },
        { product_code: 'MCB-006', qty: 150, unit_cost: 245000 },
        { product_code: 'PNL-004', qty: 70,  unit_cost: 1340000 },
        { product_code: 'PNL-005', qty: 6,   unit_cost: 21500000 },
        { product_code: 'PNL-006', qty: 25,  unit_cost: 2720000 },
      ],
    });

    console.log('✔ Purchase history seeded (19 additional POs + GRs with stock movements)');
  }

  // ─── APPROVAL QUEUE SEED ─────────────────────────────────────
  // Always runs — creates pending approval docs if they don't exist yet
  const approvalPOs = [
    {
      po_number: 'PO-2026-001', po_date: d(3), supplier_code: 'SUPP-001',
      status: 'PENDING_APPROVAL',
      notes: 'Restock kabel NYY — mendesak untuk proyek Sudirman',
      items: [
        { product_code: 'KBL-001', qty: 1500, unit_cost: 38000 },
        { product_code: 'KBL-003', qty: 500,  unit_cost: 78000 },
      ],
    },
    {
      po_number: 'PO-2026-002', po_date: d(2), supplier_code: 'SUPP-002',
      status: 'PENDING_APPROVAL',
      notes: 'MCB Schneider untuk proyek Bekasi industrial',
      items: [
        { product_code: 'MCB-003', qty: 150, unit_cost: 220000 },
        { product_code: 'MCB-004', qty: 30,  unit_cost: 1480000 },
      ],
    },
    {
      po_number: 'PO-2026-003', po_date: d(1), supplier_code: 'SUPP-004',
      status: 'PENDING_PRICE_APPROVAL',
      notes: 'Panel MDP harga lebih tinggi dari HPP — perlu approval manager',
      items: [
        { product_code: 'PNL-002', qty: 20, unit_cost: 1280000 },
        { product_code: 'PNL-003', qty: 5,  unit_cost: 7500000 },
      ],
    },
    {
      po_number: 'PO-2026-004', po_date: d(1), supplier_code: 'SUPP-005',
      status: 'PENDING_PRICE_APPROVAL',
      notes: 'Kabel NYFGBY harga supplier naik — butuh persetujuan',
      items: [
        { product_code: 'KBL-004', qty: 800, unit_cost: 65000 },
      ],
    },
  ];

  let approvalPOCount = 0;
  for (const ap of approvalPOs) {
    const exists = await prisma.purchaseOrder.findUnique({ where: { po_number: ap.po_number } });
    if (!exists) {
      const sub = ap.items.reduce((s, i) => s + i.qty * i.unit_cost, 0);
      const po = await prisma.purchaseOrder.create({
        data: {
          po_number: ap.po_number,
          po_date: ap.po_date,
          supplier_id: suppMap[ap.supplier_code],
          subtotal: sub,
          ppn_amount: sub * 0.11,
          grand_total: sub * 1.11,
          status: ap.status,
          notes: ap.notes,
          items: {
            create: ap.items.map((i) => ({
              product_id: productMap[i.product_code],
              warehouse_id: whMap['WH-JKT'],
              qty: i.qty,
              unit_price: i.unit_cost,
              subtotal: i.qty * i.unit_cost,
            })),
          },
        },
      });
      await prisma.approvalLog.create({
        data: {
          document_type: 'PO',
          document_id: po.id,
          action: 'SUBMITTED',
          actor_id: null,
          notes: null,
          created_at: ap.po_date,
        },
      });
      approvalPOCount++;
    }
  }

  const approvalRFQs = [
    {
      rfq_number: 'RFQ-2026-001', rfq_date: d(2), customer_code: 'CUST-001',
      status: 'PENDING_PRICE_APPROVAL',
      notes: 'Diskon khusus diminta PT Sumber Makmur — harga di bawah HJP normal',
      items: [
        { product_code: 'KBL-001', qty: 300, unit_price: 39000 },
        { product_code: 'KBL-002', qty: 800, unit_price: 10500 },
      ],
    },
    {
      rfq_number: 'RFQ-2026-002', rfq_date: d(1), customer_code: 'CUST-004',
      status: 'PENDING_PRICE_APPROVAL',
      notes: 'Harga proyek jangka panjang PT Elektro — harga negosiasi khusus',
      items: [
        { product_code: 'MCB-001', qty: 200, unit_price: 78000 },
        { product_code: 'MCB-002', qty: 150, unit_price: 82000 },
        { product_code: 'PNL-001', qty: 15,  unit_price: 790000 },
      ],
    },
    {
      rfq_number: 'RFQ-2026-003', rfq_date: d(1), customer_code: 'CUST-007',
      status: 'PENDING_PRICE_APPROVAL',
      notes: 'PT Duta Sarana — harga lampu sorot lebih rendah dari standar',
      items: [
        { product_code: 'LMP-003', qty: 50, unit_price: 315000 },
      ],
    },
  ];

  let approvalRFQCount = 0;
  for (const ar of approvalRFQs) {
    const exists = await prisma.rFQ.findUnique({ where: { rfq_number: ar.rfq_number } });
    if (!exists) {
      const sub = ar.items.reduce((s, i) => s + i.qty * i.unit_price, 0);
      const rfq = await prisma.rFQ.create({
        data: {
          rfq_number: ar.rfq_number,
          rfq_date: ar.rfq_date,
          customer_id: custMap[ar.customer_code],
          subtotal: sub,
          ppn_amount: sub * 0.11,
          grand_total: sub * 1.11,
          status: ar.status,
          notes: ar.notes,
          items: {
            create: ar.items.map((i) => ({
              product_id: productMap[i.product_code],
              warehouse_id: whMap['WH-JKT'],
              qty: i.qty,
              unit_price: i.unit_price,
              subtotal: i.qty * i.unit_price,
            })),
          },
        },
      });
      await prisma.approvalLog.create({
        data: {
          document_type: 'RFQ',
          document_id: rfq.id,
          action: 'SUBMITTED',
          actor_id: null,
          notes: null,
          created_at: ar.rfq_date,
        },
      });
      approvalRFQCount++;
    }
  }

  console.log(`✔ Approval queue seeded (+${approvalPOCount} POs, +${approvalRFQCount} RFQs pending approval)`);

  console.log('\n🎉 All seed data complete!');
  console.log('   Login: uzlah@codenito.id / 123123 (SUPER_USER)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
