import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from '../../../../core/services/ar-data.service';
import { RupiahPipe } from '../../../../shared/pipes/rupiah.pipe';
import { Payment } from '../../../../core/models/ar.models';

@Component({
  selector: 'app-income-audit-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe],
  template: `
    <div class="d-flex flex-column gap-3">
      <!-- Header -->
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <h2 class="h5 fw-bold text-dark mb-1">Income Audit</h2>
          <p class="text-secondary small mb-0">
            Pemeriksaan fisik slip setoran & pencocokan mutasi rekening koran bank terhadap jurnal penerimaan kas AR.
          </p>
        </div>
        <div class="d-flex align-items-center gap-3">
          <div>
            <span class="text-muted small">Status Verifikasi:</span>
            <span class="text-warning-emphasis fw-semibold small ms-1">{{ pendingIncomeAuditCount() }} Pending</span>
            <span class="text-muted small mx-1">&bull;</span>
            <span class="text-success fw-semibold small">{{ arService.payments().length - pendingIncomeAuditCount() }} Terverifikasi</span>
          </div>
        </div>
      </div>

      <!-- Filter & View Mode Toolbar -->
      <div class="v3-card p-3">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-4">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-white text-muted border-end-0">
                <i class="bi bi-search"></i>
              </span>
              <input type="text" class="form-control border-start-0 ps-0"
                placeholder="Cari no. kwitansi, pelanggan, ref slip/koran..."
                [ngModel]="paymentSearchQuery()"
                (ngModelChange)="paymentSearchQuery.set($event)" />
            </div>
          </div>
          <div class="col-6 col-md-3">
            <select class="form-select form-select-sm"
              [ngModel]="incomeAuditBankFilter()"
              (ngModelChange)="incomeAuditBankFilter.set($event)">
              <option value="ALL">Semua Rekening Bank</option>
              <option *ngFor="let b of incomeAuditBankSummaries()" [value]="b.id">
                {{ b.name }} ({{ b.accountNumber }})
              </option>
            </select>
          </div>
          <div class="col-6 col-md-3">
            <select class="form-select form-select-sm"
              [ngModel]="incomeAuditStatusFilter()"
              (ngModelChange)="incomeAuditStatusFilter.set($event)">
              <option value="ALL">Semua Status Audit</option>
              <option value="pending">Menunggu Verifikasi FA (Pending)</option>
              <option value="verified">Sudah Diverifikasi FA (Valid)</option>
            </select>
          </div>
          <div class="col-12 col-md-2 text-md-end">
            <div class="btn-group btn-group-sm w-100" role="group">
              <button type="button" class="btn btn-outline-secondary py-1"
                [class.active]="incomeAuditViewMode() === 'grouped'"
                (click)="incomeAuditViewMode.set('grouped')">
                Grup Bank
              </button>
              <button type="button" class="btn btn-outline-secondary py-1"
                [class.active]="incomeAuditViewMode() === 'table'"
                (click)="incomeAuditViewMode.set('table')">
                Tabel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW MODE A: GROUPED PER BANK -->
      <div *ngIf="incomeAuditViewMode() === 'grouped'" class="d-flex flex-column gap-3">
        <div *ngFor="let group of incomeAuditGroupedData()" class="v3-card">
          <div class="v3-card-header bg-light d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 py-2 px-3">
            <div class="d-flex align-items-center gap-2">
              <span class="fw-bold text-dark fs-6">{{ group.name }}</span>
              <span class="v3-mono text-secondary small">({{ group.accountNumber }})</span>
              <span class="badge bg-secondary-subtle text-secondary border small" *ngIf="group.isDefault">Default AR</span>
            </div>
            <div class="d-flex align-items-center gap-3">
              <div class="text-end">
                <span class="text-muted small">Subtotal:</span>
                <span class="v3-mono fw-bold text-dark ms-1">{{ group.filteredTotal | rupiah }}</span>
                <span class="text-muted small mx-1">&bull;</span>
                <span class="text-warning-emphasis small fw-medium" *ngIf="group.filteredPending > 0">
                  {{ group.filteredPending }} Pending
                </span>
                <span class="text-success small fw-medium" *ngIf="group.filteredPending === 0">
                  Semua Terverifikasi
                </span>
              </div>
              <button type="button" class="btn btn-sm btn-outline-success py-1 px-2.5 text-nowrap"
                style="font-size: 0.75rem;"
                *ngIf="group.filteredPending > 0"
                [disabled]="isViewer"
                (click)="verifyAllInBank(group.id, group.name)">
                Verifikasi Semua di Bank Ini ({{ group.filteredPending }})
              </button>
            </div>
          </div>

          <div class="v3-table-container">
            <table class="v3-table mb-0 align-middle">
              <thead>
                <tr>
                  <th style="width: 10%;">Tgl Bayar</th>
                  <th style="width: 16%;">No. Kwitansi / Jurnal</th>
                  <th style="width: 22%;">Pelanggan</th>
                  <th style="width: 16%;">Ref Slip / Mutasi</th>
                  <th style="width: 14%; text-align: right;">Nominal</th>
                  <th style="width: 14%;">Status Audit FA</th>
                  <th style="width: 8%; text-align: center;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of group.filteredPayments">
                  <td class="v3-mono text-muted small">{{ p.paymentDate }}</td>
                  <td>
                    <span class="v3-mono fw-bold text-dark">{{ p.paymentNumber }}</span>
                    <div class="v3-mono text-secondary small" *ngIf="p.kwitansiNumber">{{ p.kwitansiNumber }}</div>
                  </td>
                  <td>
                    <div class="fw-semibold text-dark">{{ p.customerName }}</div>
                  </td>
                  <td>
                    <div class="text-dark small" *ngIf="p.referenceNumber">{{ p.referenceNumber }}</div>
                    <div class="text-muted small" *ngIf="!p.referenceNumber">-</div>
                    <div *ngIf="p.overpaymentToDeposit" class="text-info small fw-semibold" style="font-size: 0.68rem;">
                      <i class="bi bi-arrow-return-right me-0.5"></i>DP: +{{ p.overpaymentToDeposit | rupiah }}
                    </div>
                  </td>
                  <td class="text-end v3-mono fw-bold text-success fs-6">
                    {{ p.amount | rupiah }}
                  </td>
                  <td>
                    <div *ngIf="p.auditStatus === 'verified_fa'">
                      <span class="text-success small fw-semibold">Verified FA</span>
                      <div class="text-muted small" style="font-size: 0.68rem;" *ngIf="p.auditedBy">
                        {{ p.auditedBy }} &bull; {{ p.auditedAt || '' }}
                      </div>
                    </div>
                    <div *ngIf="p.auditStatus !== 'verified_fa'">
                      <span class="text-warning-emphasis small fw-semibold">Pending FA</span>
                      <div class="text-muted small" style="font-size: 0.68rem;">Periksa slip fisik & mutasi</div>
                    </div>
                  </td>
                  <td class="text-center">
                    <button type="button" class="btn btn-sm btn-success py-1 px-2.5 text-nowrap"
                      style="font-size: 0.72rem; background-color: #16a34a; border-color: #16a34a;"
                      *ngIf="p.auditStatus !== 'verified_fa'"
                      [disabled]="isViewer"
                      (click)="openIncomeAuditModal(p)">
                      Verifikasi
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-secondary py-1 px-2 text-nowrap"
                      style="font-size: 0.72rem;"
                      *ngIf="p.auditStatus === 'verified_fa'"
                      (click)="openIncomeAuditModal(p)">
                      Detail Audit
                    </button>
                  </td>
                </tr>
                <tr *ngIf="group.filteredPayments.length === 0">
                  <td colspan="7" class="text-center py-3 text-muted">
                    Tidak ada transaksi pada rekening bank ini sesuai filter saat ini.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- VIEW MODE B: FLAT TABLE VIEW -->
      <div *ngIf="incomeAuditViewMode() === 'table'" class="v3-card">
        <div class="v3-table-container">
          <table class="v3-table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 10%;">Tgl Bayar</th>
                <th style="width: 14%;">No. Kwitansi / Jurnal</th>
                <th style="width: 18%;">Pelanggan</th>
                <th style="width: 18%;">Bank / Rekening Koran</th>
                <th style="width: 14%; text-align: right;">Nominal</th>
                <th style="width: 16%;">Status Audit FA</th>
                <th style="width: 10%; text-align: center;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of filteredIncomeAuditPayments()">
                <td class="v3-mono text-muted small">{{ p.paymentDate }}</td>
                <td>
                  <span class="v3-mono fw-bold text-dark">{{ p.paymentNumber }}</span>
                  <div class="v3-mono text-secondary small" *ngIf="p.kwitansiNumber">{{ p.kwitansiNumber }}</div>
                </td>
                <td>
                  <div class="fw-semibold text-dark">{{ p.customerName }}</div>
                </td>
                <td>
                  <div class="small fw-medium text-dark">{{ p.paymentChannel }}</div>
                  <div class="text-muted v3-mono small" style="font-size: 0.68rem;" *ngIf="p.referenceNumber">
                    Ref: {{ p.referenceNumber }}
                  </div>
                  <div *ngIf="p.overpaymentToDeposit" class="text-info small fw-semibold" style="font-size: 0.68rem;">
                    <i class="bi bi-arrow-return-right me-0.5"></i>DP: +{{ p.overpaymentToDeposit | rupiah }}
                  </div>
                </td>
                <td class="text-end v3-mono fw-bold text-success fs-6">
                  {{ p.amount | rupiah }}
                </td>
                <td>
                  <div *ngIf="p.auditStatus === 'verified_fa'">
                    <span class="text-success small fw-semibold">Verified FA</span>
                    <div class="text-muted small" style="font-size: 0.68rem;" *ngIf="p.auditedBy">
                      {{ p.auditedBy }} &bull; {{ p.auditedAt || '' }}
                    </div>
                  </div>
                  <div *ngIf="p.auditStatus !== 'verified_fa'">
                    <span class="text-warning-emphasis small fw-semibold">Pending FA</span>
                    <div class="text-muted small" style="font-size: 0.68rem;">Menunggu fisik slip/koran</div>
                  </div>
                </td>
                <td class="text-center">
                  <button type="button" class="btn btn-sm btn-success py-1 px-2.5 text-nowrap"
                    style="font-size: 0.72rem; background-color: #16a34a; border-color: #16a34a;"
                    *ngIf="p.auditStatus !== 'verified_fa'"
                    [disabled]="isViewer"
                    (click)="openIncomeAuditModal(p)">
                    Verifikasi
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-secondary py-1 px-2 text-nowrap"
                    style="font-size: 0.72rem;"
                    *ngIf="p.auditStatus === 'verified_fa'"
                    (click)="openIncomeAuditModal(p)">
                    Detail Audit
                  </button>
                </td>
              </tr>
              <tr *ngIf="filteredIncomeAuditPayments().length === 0">
                <td colspan="7" class="text-center py-4 text-muted">
                  Tidak ada transaksi pembayaran sesuai filter status audit ini.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Income Audit Modal -->
    <div class="v3-modal-backdrop" *ngIf="showIncomeAuditModal() && auditSelectedPayment() as pay">
      <div class="v3-modal">
        <div class="v3-modal-header">
          <div>
            <div class="fw-bold fs-5 text-dark">Verifikasi Income Audit</div>
            <div class="text-muted small">Pencocokan fisik slip setor / mutasi bank</div>
          </div>
          <button type="button" class="btn-close" (click)="showIncomeAuditModal.set(false)"></button>
        </div>

        <div class="v3-modal-body">
          <div class="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-3">
            <i class="bi bi-shield-check fs-4"></i>
            <div>
              <strong>Pemeriksaan:</strong> Pastikan nominal fisik di rekening koran bank atau slip setoran tunai telah klop dengan mutasi kas AR.
            </div>
          </div>

          <div class="card bg-light border-0 p-3 mb-3">
            <div class="row g-2">
              <div class="col-6">
                <span class="text-muted small d-block">No. Kwitansi:</span>
                <strong class="v3-mono text-primary">{{ pay.paymentNumber }}</strong>
              </div>
              <div class="col-6">
                <span class="text-muted small d-block">Pelanggan:</span>
                <strong class="text-dark">{{ pay.customerName }}</strong>
              </div>
              <div class="col-6">
                <span class="text-muted small d-block">Tanggal Bayar:</span>
                <span class="v3-mono">{{ pay.paymentDate }}</span>
              </div>
              <div class="col-6">
                <span class="text-muted small d-block">Metode / Bank:</span>
                <span class="badge bg-secondary-subtle text-secondary">{{ pay.method }} ({{ pay.paymentChannel || 'Bank Transfer' }})</span>
              </div>
              <div class="col-12 mt-2 pt-2 border-top">
                <span class="text-muted small d-block">Nominal Diterima:</span>
                <span class="v3-mono fs-5 fw-bold text-success">{{ pay.amount | rupiah }}</span>
              </div>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label small fw-semibold">Catatan</label>
            <textarea class="form-control" rows="3" [ngModel]="auditNotes()" (ngModelChange)="auditNotes.set($event)"
              placeholder="Catatan hasil verifikasi (opsional)..."></textarea>
          </div>
        </div>

        <div class="v3-modal-footer">
          <button type="button" class="v3-btn-secondary" (click)="showIncomeAuditModal.set(false)">Batal</button>
          <button type="button" class="v3-btn-primary bg-success border-success" (click)="confirmIncomeAudit()">
            Verifikasi
          </button>
        </div>
      </div>
    </div>
  `
})
export class IncomeAuditListComponent {
  readonly arService = inject(ArDataService);

  paymentSearchQuery = signal<string>('');
  incomeAuditBankFilter = signal<string>('ALL');
  incomeAuditStatusFilter = signal<'ALL' | 'pending' | 'verified'>('ALL');
  incomeAuditViewMode = signal<'grouped' | 'table'>('grouped');

  showIncomeAuditModal = signal<boolean>(false);
  auditSelectedPayment = signal<Payment | null>(null);
  auditNotes = signal<string>('');

  get isViewer(): boolean {
    return this.arService.currentUser().role === 'Viewer';
  }

  pendingIncomeAuditCount = computed(() => {
    return this.arService.payments().filter(p => !p.auditStatus || p.auditStatus === 'pending_fa').length;
  });

  incomeAuditBankSummaries = computed(() => {
    const banks = this.arService.bankAccounts().map(b => ({
      id: b.id,
      name: b.bankName,
      accountNumber: b.accountNumber,
      isDefault: b.isDefault,
      payments: this.arService.payments().filter(p => p.bankAccountId === b.id)
    }));

    const cashGroup = {
      id: 'cash_other',
      name: 'Kas Front Office & Lainnya',
      accountNumber: 'Cash / Direct',
      isDefault: false,
      payments: this.arService.payments().filter(p => !p.bankAccountId)
    };

    return [...banks, cashGroup];
  });

  incomeAuditGroupedData = computed(() => {
    const bankFilter = this.incomeAuditBankFilter();
    const statusFilter = this.incomeAuditStatusFilter();
    const q = this.paymentSearchQuery().toLowerCase().trim();
    const summaries = this.incomeAuditBankSummaries();

    return summaries
      .filter(group => bankFilter === 'ALL' || group.id === bankFilter)
      .map(group => {
        let filteredPayments = group.payments;

        if (statusFilter === 'pending') {
          filteredPayments = filteredPayments.filter(p => p.auditStatus !== 'verified_fa');
        } else if (statusFilter === 'verified') {
          filteredPayments = filteredPayments.filter(p => p.auditStatus === 'verified_fa');
        }

        if (q) {
          filteredPayments = filteredPayments.filter(p =>
            p.paymentNumber.toLowerCase().includes(q) ||
            p.customerName.toLowerCase().includes(q) ||
            (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q)) ||
            (p.paymentChannel && p.paymentChannel.toLowerCase().includes(q))
          );
        }

        return {
          ...group,
          filteredPayments,
          filteredTotal: filteredPayments.reduce((s, p) => s + p.amount, 0),
          filteredPending: filteredPayments.filter(p => p.auditStatus !== 'verified_fa').length
        };
      });
  });

  filteredIncomeAuditPayments = computed(() => {
    let list = this.arService.payments();
    const statusFilter = this.incomeAuditStatusFilter();
    if (statusFilter === 'pending') {
      list = list.filter(p => p.auditStatus !== 'verified_fa');
    } else if (statusFilter === 'verified') {
      list = list.filter(p => p.auditStatus === 'verified_fa');
    }

    const bankFilter = this.incomeAuditBankFilter();
    if (bankFilter !== 'ALL') {
      list = list.filter(p => (p.bankAccountId || 'cash_other') === bankFilter);
    }

    const q = this.paymentSearchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        p.paymentNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q)) ||
        (p.paymentChannel && p.paymentChannel.toLowerCase().includes(q))
      );
    }
    return list;
  });

  openIncomeAuditModal(payment: Payment) {
    this.auditSelectedPayment.set(payment);
    this.auditNotes.set(payment.auditNotes || 'Pemeriksaan fisik sesuai rekening koran bank.');
    this.showIncomeAuditModal.set(true);
  }

  confirmIncomeAudit() {
    const pay = this.auditSelectedPayment();
    if (!pay) return;
    this.arService.verifyIncomeAudit(pay.id, this.auditNotes());
    this.showIncomeAuditModal.set(false);
  }

  verifyAllInBank(bankId: string, bankName: string) {
    const group = this.incomeAuditBankSummaries().find(g => g.id === bankId);
    if (!group) return;
    const pendingList = group.payments.filter(p => p.auditStatus !== 'verified_fa');
    for (const p of pendingList) {
      this.arService.verifyIncomeAudit(p.id, `Batch verification rekening ${bankName}`);
    }
  }
}
