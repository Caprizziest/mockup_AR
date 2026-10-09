import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from '../../../../core/services/ar-data.service';
import { RupiahPipe } from '../../../../shared/pipes/rupiah.pipe';

@Component({
  selector: 'app-dp-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe],
  template: `
    <div class="d-flex flex-column gap-3">
      <!-- Header -->
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <h2 class="h5 fw-bold text-dark mb-1">Pengelolaan Saldo Uang Muka (DP)</h2>
          <p class="text-secondary small mb-0">
            Pencatatan deposit dan buku pembantu uang muka per pelanggan.
          </p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="isViewer" (click)="openApplyDpModal()">
            Alokasikan Potongan DP
          </button>
          <button type="button" class="btn btn-sm btn-primary" [disabled]="isViewer" (click)="openRecordDpModal()">
            Catat Setoran DP Baru
          </button>
        </div>
      </div>

      <!-- 3 KPI Cards -->
      <div class="row g-3">
        <div class="col-12 col-md-4">
          <div class="v3-kpi-card">
            <div class="v3-kpi-header">
              <span class="text-secondary fw-semibold small text-uppercase">Total Saldo DP Mengendap</span>
              <i class="bi bi-wallet2 text-warning fs-5"></i>
            </div>
            <div class="v3-kpi-value text-dark v3-mono">
              {{ customerTotalAvailableDp() | rupiah }}
            </div>
            <div class="v3-kpi-meta text-muted small">
              Tersedia untuk pemotongan tagihan invoice
            </div>
          </div>
        </div>

        <div class="col-12 col-md-4">
          <div class="v3-kpi-card">
            <div class="v3-kpi-header">
              <span class="text-secondary fw-semibold small text-uppercase">Total Setoran DP Diterima</span>
              <i class="bi bi-arrow-down-circle text-success fs-5"></i>
            </div>
            <div class="v3-kpi-value text-success v3-mono">
              {{ totalDpDeposits() | rupiah }}
            </div>
            <div class="v3-kpi-meta text-muted small">
              Akumulasi setoran advance payment
            </div>
          </div>
        </div>

        <div class="col-12 col-md-4">
          <div class="v3-kpi-card">
            <div class="v3-kpi-header">
              <span class="text-secondary fw-semibold small text-uppercase">Total DP Terpakai / Dipotong</span>
              <i class="bi bi-arrow-up-circle text-primary fs-5"></i>
            </div>
            <div class="v3-kpi-value text-primary v3-mono">
              {{ totalDpDeductions() | rupiah }}
            </div>
            <div class="v3-kpi-meta text-muted small">
              Telah dipotongkan pada invoice yang diterbitkan
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW A: List of Customers with DP Balances -->
      <div *ngIf="!selectedDpCustomerId()" class="v3-card p-3">
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
          <div class="fw-bold text-dark fs-6">Daftar Saldo Uang Muka per Pelanggan</div>
          <div style="min-width: 260px;">
            <input type="text" class="form-control form-control-sm"
              placeholder="Cari pelanggan berdasarkan nama atau kode..."
              [ngModel]="dpSearchQuery()"
              (ngModelChange)="dpSearchQuery.set($event)">
          </div>
        </div>

        <div class="v3-table-container">
          <table class="v3-table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 24%;">Pelanggan</th>
                <th style="width: 18%;">Kontak & Telp</th>
                <th style="width: 16%; text-align: right;">Saldo DP Aktif</th>
                <th style="width: 14%; text-align: right;">Total Setor DP</th>
                <th style="width: 14%; text-align: right;">Total Dipotong</th>
                <th style="width: 14%; text-align: center;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of customerDpSummaries()">
                <td>
                  <div class="fw-bold text-dark cursor-pointer text-primary-hover" (click)="selectCustomerDp(item.customer.id)">
                    {{ item.customer.name }}
                  </div>
                  <div class="v3-mono text-muted small">{{ item.customer.code }}</div>
                </td>
                <td>
                  <div class="text-secondary small">{{ item.customer.contactPerson }}</div>
                  <div class="v3-mono text-muted small" style="font-size: 0.72rem;">{{ item.customer.phone }}</div>
                </td>
                <td class="text-end v3-mono fw-bold fs-6" [class.text-success]="item.dpBalance > 0" [class.text-muted]="item.dpBalance <= 0">
                  {{ item.dpBalance | rupiah }}
                </td>
                <td class="text-end v3-mono text-success small">
                  {{ item.totalDeposits > 0 ? (item.totalDeposits | rupiah) : '-' }}
                </td>
                <td class="text-end v3-mono text-primary small">
                  {{ item.totalDeductions > 0 ? (item.totalDeductions | rupiah) : '-' }}
                </td>
                <td class="text-center">
                  <div class="d-flex justify-content-center gap-1">
                    <button type="button" class="btn btn-sm btn-outline-primary py-0.5 px-2" style="font-size: 0.72rem;"
                      (click)="selectCustomerDp(item.customer.id)" title="Lihat Buku Pembantu DP Pelanggan Ini">
                      Buku DP &rarr;
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-success py-0.5 px-2" style="font-size: 0.72rem;"
                      [disabled]="isViewer" (click)="openRecordDpModal(item.customer.id)" title="Tambah Setoran DP">
                      + Setor
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="customerDpSummaries().length === 0">
                <td colspan="6" class="text-center py-4 text-muted">
                  Tidak ditemukan data pelanggan sesuai pencarian.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- VIEW B: Customer Specific Buku Pembantu DP Ledger -->
      <div *ngIf="selectedDpCustomerId() && selectedCustomerDpDetails() as det" class="v3-card p-3">
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3 border-bottom pb-3">
          <div>
            <button type="button" class="btn btn-sm btn-link text-decoration-none p-0 mb-1.5" (click)="selectCustomerDp(null)">
              &larr; Kembali ke Daftar Semua Pelanggan
            </button>
            <h3 class="h6 fw-bold text-dark mb-0">
              Buku Pembantu DP: <span class="text-primary">{{ det.customer.name }}</span>
              <span class="text-muted small fw-normal ms-1">[{{ det.customer.code }}]</span>
            </h3>
          </div>
          <div class="d-flex align-items-center gap-3">
            <div class="text-end">
              <span class="text-muted small d-block">Saldo DP Aktif:</span>
              <strong class="v3-mono fs-5 text-success">{{ (det.customer.dpBalance || 0) | rupiah }}</strong>
            </div>
            <div class="d-flex gap-1.5">
              <button type="button" class="btn btn-sm btn-outline-success" [disabled]="isViewer" (click)="openRecordDpModal(det.customer.id)">
                + Setor DP
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="isViewer || !det.customer.dpBalance || det.customer.dpBalance <= 0"
                (click)="openApplyDpModal(det.customer.id)">
                Potong ke Invoice
              </button>
            </div>
          </div>
        </div>

        <div class="v3-table-container">
          <table class="v3-table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 14%;">Tanggal</th>
                <th style="width: 16%;">Jenis Mutasi</th>
                <th style="width: 16%; text-align: right;">Nominal Mutasi</th>
                <th style="width: 16%; text-align: right;">Saldo Setelahnya</th>
                <th style="width: 38%;">Referensi & Catatan</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of det.transactions">
                <td class="v3-mono text-muted small">{{ t.date }}</td>
                <td>
                  <span class="fw-semibold small" [ngClass]="t.type === 'deposit' ? 'text-success' : 'text-primary'">
                    {{ t.type === 'deposit' ? '+ Setoran DP' : '- Potong Invoice' }}
                  </span>
                </td>
                <td class="text-end v3-mono fw-bold" [ngClass]="t.type === 'deposit' ? 'text-success' : 'text-primary'">
                  {{ t.type === 'deposit' ? '+' : '-' }} {{ t.amount | rupiah }}
                </td>
                <td class="text-end v3-mono fw-semibold text-dark">
                  {{ t.balanceAfter | rupiah }}
                </td>
                <td class="small">
                  <span class="v3-mono fw-semibold text-primary" *ngIf="t.invoiceNumber">{{ t.invoiceNumber }} &bull; </span>
                  <span class="text-secondary">{{ t.notes }}</span>
                </td>
              </tr>
              <tr *ngIf="det.transactions.length === 0">
                <td colspan="5" class="text-center py-4 text-muted">
                  Belum ada riwayat mutasi uang muka untuk pelanggan ini.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Catat Setoran DP -->
    <div class="v3-modal-backdrop" *ngIf="showRecordDpModal()">
      <div class="v3-modal">
        <div class="v3-modal-header">
          <div class="fw-bold fs-5 text-dark">Penerimaan Uang Muka (DP)</div>
          <button type="button" class="btn-close" (click)="showRecordDpModal.set(false)"></button>
        </div>
        <div class="v3-modal-body">
          <div class="mb-3">
            <label class="form-label small fw-semibold">Pelanggan <span class="text-danger">*</span></label>
            <select class="form-select" [ngModel]="dpRecordCustomerId()" (ngModelChange)="dpRecordCustomerId.set($event)">
              <option *ngFor="let c of arService.customers()" [value]="c.id">
                {{ c.name }} (Saldo DP: {{ (c.dpBalance || 0) | rupiah }})
              </option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label small fw-semibold">Nominal Uang Muka <span class="text-danger">*</span></label>
            <input type="number" class="form-control v3-mono fs-5 fw-bold" [ngModel]="dpRecordAmount()" (ngModelChange)="dpRecordAmount.set(+$event)">
          </div>
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label small fw-semibold">Metode Pembayaran</label>
              <select class="form-select" [ngModel]="dpRecordMethod()" (ngModelChange)="dpRecordMethod.set($event)">
                <option value="bank_transfer">Transfer Bank</option>
                <option value="cash">Tunai</option>
                <option value="credit_card">Kartu Kredit</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label small fw-semibold">Bank / Channel</label>
              <input type="text" class="form-control" [ngModel]="dpRecordChannel()" (ngModelChange)="dpRecordChannel.set($event)" placeholder="BCA / Mandiri / Kasir">
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label small fw-semibold">No. Referensi</label>
            <input type="text" class="form-control v3-mono" [ngModel]="dpRecordRef()" (ngModelChange)="dpRecordRef.set($event)" placeholder="Contoh: TRF-DP-883921">
          </div>
          <div class="mb-3">
            <label class="form-label small fw-semibold">Catatan</label>
            <textarea class="form-control" rows="2" [ngModel]="dpRecordNotes()" (ngModelChange)="dpRecordNotes.set($event)"></textarea>
          </div>
        </div>
        <div class="v3-modal-footer">
          <button type="button" class="v3-btn-secondary" (click)="showRecordDpModal.set(false)">Batal</button>
          <button type="button" class="v3-btn-primary" [disabled]="!dpRecordAmount() || dpRecordAmount() <= 0" (click)="submitRecordDp()">
            <i class="bi bi-save me-1"></i> Simpan DP
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Alokasi Potongan DP ke Invoice -->
    <div class="v3-modal-backdrop" *ngIf="showApplyDpModal()">
      <div class="v3-modal">
        <div class="v3-modal-header">
          <div>
            <div class="fw-bold fs-5 text-dark">Alokasi Potongan Uang Muka (DP)</div>
            <div class="text-muted small">Gunakan saldo deposit pelanggan untuk mengurangi sisa tagihan faktur</div>
          </div>
          <button type="button" class="btn-close" (click)="showApplyDpModal.set(false)"></button>
        </div>
        <div class="v3-modal-body">
          <div class="mb-3">
            <label class="form-label small fw-semibold">Pelanggan</label>
            <select class="form-select" [ngModel]="dpApplyCustomerId()" (ngModelChange)="onApplyDpCustomerChange($event)">
              <option *ngFor="let c of arService.customers()" [value]="c.id">
                {{ c.name }} (Saldo DP: {{ (c.dpBalance || 0) | rupiah }})
              </option>
            </select>
          </div>
          <div class="alert alert-success py-2 px-3 small d-flex justify-content-between align-items-center mb-3" *ngIf="getCustomer(dpApplyCustomerId()) as cust">
            <span>Saldo DP Tersedia:</span>
            <strong class="v3-mono fs-6">{{ (cust.dpBalance || 0) | rupiah }}</strong>
          </div>
          <div class="mb-3">
            <label class="form-label small fw-semibold">Pilih Invoice <span class="text-danger">*</span></label>
            <select class="form-select" [ngModel]="dpApplyInvoiceId()" (ngModelChange)="dpApplyInvoiceId.set($event)">
              <option value="" disabled>-- Pilih Invoice Tertagih --</option>
              <option *ngFor="let inv of dpApplyEligibleInvoices()" [value]="inv.id">
                {{ inv.invoiceNumber }} &bull; Sisa: {{ inv.balanceDue | rupiah }} (Status: {{ inv.status }})
              </option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label small fw-semibold">Nominal Potongan DP <span class="text-danger">*</span></label>
            <input type="number" class="form-control v3-mono fs-5 fw-bold text-primary" [ngModel]="dpApplyAmount()" (ngModelChange)="dpApplyAmount.set(+$event)">
          </div>
          <div class="mb-3">
            <label class="form-label small fw-semibold">Catatan</label>
            <textarea class="form-control" rows="2" [ngModel]="dpApplyNotes()" (ngModelChange)="dpApplyNotes.set($event)"></textarea>
          </div>
        </div>
        <div class="v3-modal-footer">
          <button type="button" class="v3-btn-secondary" (click)="showApplyDpModal.set(false)">Batal</button>
          <button type="button" class="v3-btn-primary" [disabled]="!dpApplyInvoiceId() || !dpApplyAmount() || dpApplyAmount() <= 0" (click)="submitApplyDp()">
            <i class="bi bi-check2-circle me-1"></i> Terapkan DP
          </button>
        </div>
      </div>
    </div>
  `
})
export class DpListComponent {
  readonly arService = inject(ArDataService);

  dpSearchQuery = signal<string>('');
  selectedDpCustomerId = signal<string | null>(null);

  showRecordDpModal = signal<boolean>(false);
  dpRecordCustomerId = signal<string>('cust-1');
  dpRecordAmount = signal<number>(10000000);
  dpRecordMethod = signal<any>('bank_transfer');
  dpRecordChannel = signal<string>('BCA Hotel');
  dpRecordRef = signal<string>('');
  dpRecordNotes = signal<string>('');

  showApplyDpModal = signal<boolean>(false);
  dpApplyCustomerId = signal<string>('cust-1');
  dpApplyInvoiceId = signal<string>('');
  dpApplyAmount = signal<number>(0);
  dpApplyNotes = signal<string>('');

  get isViewer(): boolean {
    return this.arService.currentUser().role === 'Viewer';
  }

  getCustomer(customerId: string) {
    return this.arService.getCustomer(customerId);
  }

  customerTotalAvailableDp = computed(() => {
    return this.arService.customers().reduce((sum, c) => sum + (c.dpBalance || 0), 0);
  });

  totalDpDeposits = computed(() => {
    return this.arService.dpTransactions()
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
  });

  totalDpDeductions = computed(() => {
    return this.arService.dpTransactions()
      .filter(t => t.type === 'applied')
      .reduce((sum, t) => sum + t.amount, 0);
  });

  customerDpSummaries = computed(() => {
    const q = this.dpSearchQuery().toLowerCase().trim();
    const txs = this.arService.dpTransactions();
    return this.arService.customers()
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      .map(c => {
        const custTxs = txs.filter(t => t.customerId === c.id);
        const totalDeposits = custTxs.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
        const totalDeductions = custTxs.filter(t => t.type === 'applied').reduce((sum, t) => sum + t.amount, 0);
        return {
          customer: c,
          dpBalance: c.dpBalance || 0,
          totalDeposits,
          totalDeductions
        };
      });
  });

  selectedCustomerDpDetails = computed(() => {
    const custId = this.selectedDpCustomerId();
    if (!custId) return null;
    const cust = this.arService.customers().find(c => c.id === custId);
    if (!cust) return null;
    const txs = this.arService.dpTransactions().filter(t => t.customerId === custId);
    return {
      customer: cust,
      transactions: txs
    };
  });

  dpApplyEligibleInvoices = computed(() => {
    const custId = this.dpApplyCustomerId();
    return this.arService.invoices().filter(i => i.customerId === custId && i.balanceDue > 0 && i.status !== 'Draft' && i.status !== 'Cancelled');
  });

  selectCustomerDp(customerId: string | null) {
    this.selectedDpCustomerId.set(customerId);
  }

  openRecordDpModal(customerId?: string) {
    if (customerId) this.dpRecordCustomerId.set(customerId);
    this.dpRecordAmount.set(10000000);
    this.dpRecordRef.set('TRF-DP-' + Math.floor(100000 + Math.random() * 900000));
    this.dpRecordNotes.set('Setoran uang muka');
    this.showRecordDpModal.set(true);
  }

  openApplyDpModal(customerId?: string) {
    if (customerId) {
      this.dpApplyCustomerId.set(customerId);
    }
    const eligible = this.dpApplyEligibleInvoices();
    if (eligible.length > 0) {
      this.dpApplyInvoiceId.set(eligible[0].id);
      const cust = this.getCustomer(this.dpApplyCustomerId());
      const maxCut = Math.min(eligible[0].balanceDue, cust?.dpBalance || 0);
      this.dpApplyAmount.set(maxCut);
    } else {
      this.dpApplyInvoiceId.set('');
      this.dpApplyAmount.set(0);
    }
    this.showApplyDpModal.set(true);
  }

  onApplyDpCustomerChange(custId: string) {
    this.dpApplyCustomerId.set(custId);
    const eligible = this.dpApplyEligibleInvoices();
    if (eligible.length > 0) {
      this.dpApplyInvoiceId.set(eligible[0].id);
      const cust = this.getCustomer(custId);
      this.dpApplyAmount.set(Math.min(eligible[0].balanceDue, cust?.dpBalance || 0));
    } else {
      this.dpApplyInvoiceId.set('');
      this.dpApplyAmount.set(0);
    }
  }

  submitRecordDp() {
    if (!this.dpRecordAmount() || this.dpRecordAmount() <= 0) return;
    this.arService.recordCustomerDp({
      customerId: this.dpRecordCustomerId(),
      amount: this.dpRecordAmount(),
      method: this.dpRecordMethod(),
      paymentChannel: this.dpRecordChannel(),
      referenceNumber: this.dpRecordRef() || `DP-REF-${Date.now()}`,
      notes: this.dpRecordNotes()
    });
    this.showRecordDpModal.set(false);
  }

  submitApplyDp() {
    if (!this.dpApplyInvoiceId() || !this.dpApplyAmount() || this.dpApplyAmount() <= 0) return;
    this.arService.applyCustomerDp({
      customerId: this.dpApplyCustomerId(),
      invoiceId: this.dpApplyInvoiceId(),
      amount: this.dpApplyAmount(),
      notes: this.dpApplyNotes()
    });
    this.showApplyDpModal.set(false);
  }
}
