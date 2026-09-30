/**
 * Automated Screenshot Capture Script for Accounts Receivable (AR) Application
 * Captures every page, subtab, drawer, modal, and key user interaction.
 * Run via: node capture-screenshots.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const DIST_DIR = path.join(__dirname, 'dist', 'test_AR2', 'browser');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const PORT = 4203;

// Find Chrome or Edge executable on Windows
function getBrowserExecutablePath() {
  const paths = [
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No supported browser (Chrome or Edge) found on system.');
}

// Lightweight static file server for Angular build output
function startStaticServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    let filePath = path.join(DIST_DIR, reqPath === '/' ? 'index.html' : reqPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        });
        res.end(content, 'utf-8');
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`[Static Server] Serving dist on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function captureAll() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const server = await startStaticServer();
  const chromePath = getBrowserExecutablePath();
  console.log(`[Puppeteer] Using browser binary at: ${chromePath}`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1600,1050'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1050, deviceScaleFactor: 1.25 });

  console.log(`[Puppeteer] Navigating to http://localhost:${PORT}...`);
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });
  await sleep(1000);

  const manifest = [];

  async function snap(filename, label) {
    const filePath = path.join(SCREENSHOTS_DIR, filename);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`✓ Saved: ${filename} - ${label}`);
    manifest.push({ file: filename, label: label });
    // Remove toast if any so it doesn't linger into subsequent screens
    await page.evaluate(() => {
      const toast = document.querySelector('.v3-toast');
      if (toast) toast.remove();
    });
    await sleep(300);
  }

  // Helper to click an element containing specific text
  async function clickText(selector, textSubstring) {
    return page.evaluate((sel, text) => {
      const elements = Array.from(document.querySelectorAll(sel));
      const target = elements.find(el => el.textContent && el.textContent.includes(text));
      if (target) {
        target.click();
        return true;
      }
      return false;
    }, selector, textSubstring);
  }

  // Helper to select an option in a select dropdown
  async function selectOption(selector, value) {
    await page.select(selector, value);
    await sleep(300);
  }

  console.log('\n=========================================');
  console.log('--- 1. V3 FOCUSED DESIGN: INVOICE LEDGER ---');
  console.log('=========================================');

  // 01. Invoices - All
  await snap('01_v3_invoices_all.png', 'V3 Invoices - Status: Semua (Overview Ledger)');

  // 02. Invoices - Draft
  await clickText('.v3-tab-btn', 'Draft');
  await sleep(400);
  await snap('02_v3_invoices_draft.png', 'V3 Invoices - Tab: Draft');

  // 03. Invoices - Issued
  await clickText('.v3-tab-btn', 'Issued');
  await sleep(400);
  await snap('03_v3_invoices_issued.png', 'V3 Invoices - Tab: Issued (Terbit)');

  // 04. Invoices - Partially Paid
  await clickText('.v3-tab-btn', 'Partially Paid');
  await sleep(400);
  await snap('04_v3_invoices_partially_paid.png', 'V3 Invoices - Tab: Partially Paid (Sebagian Dibayar)');

  // 05. Invoices - Overdue
  await clickText('.v3-tab-btn', 'Overdue');
  await sleep(400);
  await snap('05_v3_invoices_overdue.png', 'V3 Invoices - Tab: Overdue (Lewat Jatuh Tempo)');

  // 06. Invoices - Paid
  await clickText('.v3-tab-btn', 'Paid');
  await sleep(400);
  await snap('06_v3_invoices_paid.png', 'V3 Invoices - Tab: Paid (Lunas)');

  // 07. Invoices - Cancelled
  await clickText('.v3-tab-btn', 'Cancelled');
  await sleep(400);
  await snap('07_v3_invoices_cancelled.png', 'V3 Invoices - Tab: Cancelled (Dibatalkan)');

  // Reset to All and test search filter
  await clickText('.v3-tab-btn', 'Semua');
  await sleep(300);
  const searchInput = await page.$('input[placeholder*="Cari invoice"]');
  if (searchInput) {
    await searchInput.type('Mandiri');
    await sleep(400);
    await snap('08_v3_invoices_search_filter.png', 'V3 Invoices - Pencarian & Filter Aktif ("Mandiri")');
    // Clear search
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Cari invoice"]');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await sleep(300);
  }

  console.log('\n=========================================');
  console.log('--- 2. V3 INVOICE FORMS & DETAIL VIEW ---');
  console.log('=========================================');

  // 09. Invoice Create Form
  await clickText('.v3-topbar .v3-btn-primary', 'Buat Invoice');
  await sleep(500);
  await snap('09_v3_invoice_create_form.png', 'V3 Buat Invoice Baru - Form Line Items, Pajak PPN 11%, PPh 23, & Potongan DP');

  // Go back to invoice list
  await clickText('.v3-content button', 'Kembali');
  await sleep(400);

  // 10. Invoice Edit Form (Draft)
  await clickText('.v3-tab-btn', 'Draft');
  await sleep(300);
  await clickText('.v3-content tr button', 'Ubah');
  await sleep(500);
  await snap('10_v3_invoice_edit_form.png', 'V3 Ubah Invoice Draft - Mode Edit Dokumen Tertunda');

  // Go back to invoice list
  await clickText('.v3-content button', 'Kembali');
  await sleep(400);

  // 11. Invoice Detail View
  await clickText('.v3-tab-btn', 'Semua');
  await sleep(300);
  // View detail of invoice with partial payment (INV-2026-0004 or INV-2026-0002)
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const targetLink = links.find(a => a.textContent && a.textContent.includes('INV-2026-0004'));
    if (targetLink) targetLink.click();
  });
  await sleep(500);
  await snap('11_v3_invoice_detail_view.png', 'V3 Detail Faktur - Status Overdue, Rincian Layanan, & Alokasi Pembayaran');

  // 12. Modal: PDF / Print Preview Official Tax Invoice
  await clickText('.v3-content button', 'Cetak / Export PDF');
  await sleep(600);
  await snap('12_v3_modal_pdf_tax_invoice.png', 'V3 Modal - Pratinjau Cetak Faktur PDF Resmi (Kop PT Galesong, Watermark, & TTD)');

  // Close PDF Modal
  await clickText('.v3-modal-footer button', 'Tutup Pratinjau');
  await sleep(400);

  // Go back to invoice list
  await clickText('.v3-content button', 'Kembali');
  await sleep(400);

  // 13. Modal: Cancel / Void Invoice Modal
  // Click 'Batal' on an invoice with 0 payments (INV-2026-0003 or INV-2026-0006) to trigger the cancel modal
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const targetRow = rows.find(tr => tr.textContent.includes('INV-2026-0003') || tr.textContent.includes('INV-2026-0006'));
    if (targetRow) {
      const btn = Array.from(targetRow.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Batal');
      if (btn) btn.click();
    }
  });
  await sleep(500);
  // Type reason
  await page.evaluate(() => {
    const ta = document.querySelector('textarea[placeholder*="alasan"]');
    if (ta) {
      ta.value = 'Permintaan penyesuaian agenda corporate event oleh PIC sales.';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await sleep(300);
  await snap('13_v3_modal_cancel_invoice.png', 'V3 Modal - Batalkan Faktur (SRS-F-18 Validasi Alasan & Aturan Keuangan)');

  // Close cancel modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.v3-modal-backdrop .v3-btn-secondary');
    if (closeBtn) closeBtn.click();
  });
  await sleep(400);

  // 14. Modal: Delete Draft Invoice Modal
  await clickText('.v3-tab-btn', 'Draft');
  await sleep(300);
  await clickText('.v3-content tr button', 'Hapus');
  await sleep(500);
  await snap('14_v3_modal_delete_invoice.png', 'V3 Modal - Konfirmasi Hapus Invoice Draft');

  // Close delete modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.v3-modal-backdrop .v3-btn-secondary');
    if (closeBtn) closeBtn.click();
  });
  await sleep(400);

  console.log('\n=========================================');
  console.log('--- 3. V3 PAYMENT MODAL & ACTION INBOX ---');
  console.log('=========================================');

  // 15. Modal: Record Payment
  await clickText('.v3-topbar .v3-btn-secondary', 'Catat Pembayaran');
  await sleep(500);
  // Select customer with balance
  await page.evaluate(() => {
    const sel = document.querySelector('.v3-modal-body select');
    if (sel && sel.options.length > 1) {
      sel.selectedIndex = 1;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(400);
  // Click Auto-allocate button
  await clickText('.v3-modal-body button', 'Auto-Alokasi');
  await sleep(400);
  await snap('15_v3_modal_record_payment.png', 'V3 Modal - Catat Pembayaran (Multi-Invoice Alokasi Otomatis & Kanal Bank)');

  // 16. Modal: Payment Down Payment Mode
  await page.evaluate(() => {
    const chk = document.querySelector('#dpCheck');
    if (chk) {
      chk.click();
      chk.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(400);
  await snap('16_v3_modal_record_payment_downpayment.png', 'V3 Modal - Catat Pembayaran Uang Muka (Down Payment SRS-F-31)');

  // Close payment modal
  await page.evaluate(() => {
    const btn = document.querySelector('.v3-modal-backdrop .v3-btn-secondary');
    if (btn) btn.click();
  });
  await sleep(400);

  // 17. Drawer: Action Inbox (All)
  await clickText('.v3-action-pill-btn', 'Tindak Lanjut');
  await sleep(500);
  await snap('17_v3_drawer_action_inbox_all.png', 'V3 Drawer - Agenda Tindak Lanjut Penagihan & Draft (Tab: Semua)');

  // 18. Drawer: Action Inbox (Overdue Tab)
  await clickText('.v3-drawer button', 'Overdue Penagihan');
  await sleep(400);
  await snap('18_v3_drawer_action_inbox_overdue.png', 'V3 Drawer - Prioritas Tagih Hari Ini (Kontak Telpon & WhatsApp)');

  // 19. Drawer: Action Inbox (Draft Tab)
  await clickText('.v3-drawer button', 'Draft Siap Terbit');
  await sleep(400);
  await snap('19_v3_drawer_action_inbox_draft.png', 'V3 Drawer - Draft Invoice Siap Terbit');

  // Close drawer
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.v3-drawer-header .btn-close');
    if (closeBtn) closeBtn.click();
  });
  await sleep(400);

  console.log('\n=========================================');
  console.log('--- 4. V3 DATA PELANGGAN (CUSTOMERS) ---');
  console.log('=========================================');

  // 20. Customers - All
  await clickText('.v3-nav-item', 'Data Pelanggan');
  await sleep(500);
  await snap('20_v3_customers_list_all.png', 'V3 Pelanggan - Direktori Pelanggan (Tab: Semua Pelanggan)');

  // 21. Customers - Overdue
  await clickText('.v3-tab-btn', 'Overdue');
  await sleep(400);
  await snap('21_v3_customers_list_overdue.png', 'V3 Pelanggan - Filter: Menunggak / Overdue Saja');

  // 22. Customers - Credit Hold
  await clickText('.v3-tab-btn', 'Credit Hold');
  await sleep(400);
  await snap('22_v3_customers_list_credit_hold.png', 'V3 Pelanggan - Filter: Status Ditangguhkan (Credit Hold)');

  // Reset to All and filter balance
  await clickText('.v3-tab-btn', 'Semua');
  await sleep(300);
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('.v3-content select'));
    if (selects.length > 0) {
      selects[0].value = 'HAS_BALANCE';
      selects[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(400);
  await snap('23_v3_customers_balance_filter.png', 'V3 Pelanggan - Filter: Memiliki Saldo / Tagihan Berjalan');

  // 24. Modal: Add New Customer
  await clickText('.v3-content button', '+ Pelanggan Baru');
  await sleep(500);
  await snap('24_v3_modal_add_customer.png', 'V3 Modal - Pendaftaran Pelanggan Baru (NIK 16 Digit, NPWP, Plafon Kredit)');

  // Close customer modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.v3-modal-backdrop .v3-btn-secondary');
    if (closeBtn) closeBtn.click();
  });
  await sleep(400);

  // 25. Customer Detail - Invoices Tab
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const custLink = links.find(a => a.textContent && a.textContent.includes('CV Surya Perkasa Mandiri'));
    if (custLink) custLink.click();
  });
  await sleep(500);
  await snap('25_v3_customer_detail_invoices.png', 'V3 Detail Pelanggan 360 - Profil, Plafon Kredit, & Riwayat Invoice');

  // 26. Customer Detail - Payments Tab
  await clickText('.v3-tab-btn', 'Riwayat Pembayaran');
  await sleep(400);
  await snap('26_v3_customer_detail_payments.png', 'V3 Detail Pelanggan 360 - Riwayat Alokasi Pembayaran Masuk');

  console.log('\n=========================================');
  console.log('--- 5. V3 LAPORAN AGING & MASTER DATA ---');
  console.log('=========================================');

  // 27. Aging Matrix Report
  await clickText('.v3-nav-item', 'Laporan Aging');
  await sleep(500);
  await snap('27_v3_aging_matrix_report.png', 'V3 Laporan Aging Matrix - Distribusi Umur Piutang (Lancar, 1-30, 31-60, 61-90, >90 Hari)');

  // 28. Aging Matrix - Expanded Customer Row
  await page.evaluate(() => {
    const tr = document.querySelector('.v3-table tbody tr');
    if (tr) tr.click();
  });
  await sleep(400);
  await snap('28_v3_aging_matrix_expanded_customer.png', 'V3 Laporan Aging - Baris Pelanggan Diperluas Menampilkan Invoice Terkait');

  // 29. Aging Matrix - Risk Filter
  await clickText('.v3-tab-btn', 'Kritis');
  await sleep(400);
  await snap('29_v3_aging_matrix_risk_filter.png', 'V3 Laporan Aging - Filter: Piutang Kritis (>60 Hari)');

  // 30. Bank Accounts Master
  await clickText('.v3-nav-item', 'Rekening Bank');
  await sleep(500);
  await snap('30_v3_bank_accounts_master.png', 'V3 Master Data - Daftar Rekening Bank Hotel & Rekening Utama');

  // 31. Modal: Add Bank Account
  await clickText('.v3-content button', '+ Tambah Rekening');
  await sleep(500);
  await snap('31_v3_modal_add_bank_account.png', 'V3 Modal - Tambah / Ubah Rekening Bank Hotel Penerima');

  // Close bank account modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.v3-modal-backdrop .v3-btn-secondary');
    if (closeBtn) closeBtn.click();
  });
  await sleep(400);

  // 32. Activity Logs (Audit Trail)
  await clickText('.v3-nav-item', 'Log Aktivitas');
  await sleep(500);
  await snap('32_v3_activity_logs_audit_trail.png', 'V3 Log Audit - Rekam Jejak Aktivitas Operasional, User, & Perubahan State');

  // 33. Activity Logs - Filtered
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('.v3-content select'));
    if (selects.length > 0) {
      selects[0].selectedIndex = 1;
      selects[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(400);
  await snap('33_v3_activity_logs_filtered.png', 'V3 Log Audit - Filter Jenis Aktivitas Pembayaran & Perubahan');

  // 34. Role Switcher: Manager View
  await clickText('.v3-switcher-btn', 'Manager');
  await sleep(400);
  await snap('34_v3_role_manager_view.png', 'V3 Role Manager - Tampilan & Otoritas Manager Keuangan');

  // 35. Role Switcher: Viewer View
  await clickText('.v3-switcher-btn', 'Viewer');
  await sleep(400);
  await snap('35_v3_role_viewer_view.png', 'V3 Role Viewer - Hak Akses Terbatas (Tombol Aksi Dinonaktifkan)');

  // Switch back to Admin
  await clickText('.v3-switcher-btn', 'Admin');
  await sleep(400);

  // Save index manifest and HTML gallery
  const galleryHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Galeri Tangkapan Layar Sistem Piutang Usaha (AR Core)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body { background-color: #0b0f19; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; padding-bottom: 60px; }
    .hero { background: linear-gradient(180deg, #1e293b 0%, #0b0f19 100%); border-bottom: 1px solid #334155; padding: 40px 0 30px; }
    .shot-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
    .shot-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.5); border-color: #3b82f6; }
    .shot-card img { width: 100%; height: auto; display: block; border-bottom: 1px solid #334155; }
    .shot-card .card-body { padding: 16px; }
    .badge-index { background: #3b82f6; color: white; font-weight: 700; font-size: 0.75rem; border-radius: 6px; padding: 4px 8px; }
    .section-title { font-weight: 700; color: #93c5fd; margin-top: 35px; margin-bottom: 20px; border-bottom: 1px solid #1e293b; padding-bottom: 10px; }
  </style>
</head>
<body>
  <div class="hero text-center mb-4">
    <div class="container">
      <span class="badge bg-primary text-uppercase px-3 py-1 mb-2">Dokumentasi Visual UI/UX & Interaksi</span>
      <h1 class="fw-bold text-white mb-2">Galeri Tangkapan Layar Lengkap (AR System)</h1>
      <p class="text-secondary mb-0">Total ${manifest.length} tangkapan layar mencakup semua halaman, tab status, modal interaktif, drawer, dan varian peran pengguna.</p>
    </div>
  </div>

  <div class="container">
    <div class="row g-4">
      ${manifest.map((item, idx) => `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="shot-card h-100 d-flex flex-column">
            <a href="${item.file}" target="_blank" title="Klik untuk membuka ukuran penuh">
              <img src="${item.file}" alt="${item.label}" loading="lazy">
            </a>
            <div class="card-body d-flex flex-column justify-content-between flex-grow-1">
              <div>
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="badge-index">#${String(idx + 1).padStart(2, '0')}</span>
                  <small class="text-secondary font-monospace">${item.file}</small>
                </div>
                <h6 class="fw-bold text-white mb-1">${item.label}</h6>
              </div>
              <div class="mt-3">
                <a href="${item.file}" target="_blank" class="btn btn-sm btn-outline-info w-100">Buka Gambar Penuh</a>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>
  `;

  fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'index.html'), galleryHtml.trim());
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n=========================================`);
  console.log(`✨ Sukses mengambil total ${manifest.length} tangkapan layar!`);
  console.log(`📁 Lokasi folder: ${SCREENSHOTS_DIR}`);
  console.log(`🌐 Galeri HTML: ${path.join(SCREENSHOTS_DIR, 'index.html')}`);
  console.log(`=========================================\n`);

  await browser.close();
  server.close();
}

captureAll().catch(err => {
  console.error('[Error]', err);
  process.exit(1);
});
