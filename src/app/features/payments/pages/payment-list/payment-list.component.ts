import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from '../../../../core/services/ar-data.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { RupiahPipe } from '../../../../shared/pipes/rupiah.pipe';
import { Payment, Customer } from '../../../../core/models/ar.models';
import { ConfirmDialogComponent, DeleteModalState } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe, ConfirmDialogComponent],
  template: `
    <div class="d-flex flex-column gap-3">
      <!-- Header & Action Ribbon -->
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <h2 class="h5 fw-bold text-dark mb-1">Riwayat Pembayaran</h2>
          <p class="text-secondary small mb-0">
            Jurnal transaksi penerimaan kas dan mutasi bank masuk.
          </p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="v3-btn-primary" [disabled]="isViewer" (click)="openPaymentModal()">
            <i class="bi bi-plus-lg me-1"></i>
            <span>+ Catat Pembayaran</span>
          </button>
        </div>
      </div>

      <!-- Sub-nav link to Income Audit -->
      <div class="d-flex align-items-center justify-content-between p-2.5 rounded bg-light border">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-shield-check text-primary"></i>
          <span class="text-secondary small">Verifikasi mutasi kas & bank masuk oleh tim Finance.</span>
        </div>
        <button type="button" class="btn btn-sm btn-outline-primary py-1 px-2.5" (click)="navService.navigateTo('income-audit')">
          <span>Income Audit</span>
          <span *ngIf="pendingIncomeAuditCount() > 0" class="badge bg-warning text-dark ms-1">
            {{ pendingIncomeAuditCount() }} Pending
          </span>
        </button>
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="v3-card p-3">
        <div class="row g-2 align-items-center">
          <!-- Search Query -->
          <div class="col-12 col-lg-4">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-white text-muted border-end-0">
                <i class="bi bi-search"></i>
              </span>
              <input type="text" class="form-control border-start-0 ps-0"
                placeholder="Cari no. kwitansi, pelanggan, referensi transfer..."
                [ngModel]="paymentSearchQuery()"
                (ngModelChange)="paymentSearchQuery.set($event)" />
            </div>
          </div>

          <!-- Filter Method -->
          <div class="col-6 col-lg-2">
            <select class="form-select form-select-sm"
              [ngModel]="paymentMethodFilter()"
              (ngModelChange)="paymentMethodFilter.set($event)">
              <option value="ALL">Semua Metode</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="virtual_account">Virtual Account</option>
              <option value="e_wallet">E-Wallet</option>
              <option value="qris">QRIS</option>
              <option value="credit_card">Kartu Kredit</option>
              <option value="cash">Tunai</option>
            </select>
          </div>

          <!-- Date Range -->
          <div class="col-6 col-lg-2">
            <input type="date" class="form-control form-select-sm"
              [ngModel]="paymentStartDate()"
              (ngModelChange)="paymentStartDate.set($event)"
              placeholder="Dari tgl" title="Tanggal Mulai" />
          </div>
          <div class="col-6 col-lg-2">
            <input type="date" class="form-control form-select-sm"
              [ngModel]="paymentEndDate()"
              (ngModelChange)="paymentEndDate.set($event)"
              placeholder="Sampai tgl" title="Tanggal Akhir" />
          </div>

          <!-- Sort -->
          <div class="col-6 col-lg-2 d-flex gap-2">
            <select class="form-select form-select-sm"
              [ngModel]="paymentSortBy()"
              (ngModelChange)="paymentSortBy.set($event)">
              <option value="paymentDate_desc">Terbaru</option>
              <option value="paymentDate_asc">Terlama</option>
              <option value="amount_desc">Nominal Terbesar</option>
            </select>

            <button *ngIf="hasActivePaymentFilters()" type="button" class="btn btn-sm btn-outline-danger"
              (click)="resetPaymentFilters()" title="Reset Filter">
              <i class="bi bi-x-circle"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Payments Journal Table -->
      <div class="v3-card">
        <div class="v3-table-container">
          <table class="v3-table v3-table-fit">
            <thead>
              <tr>
                <th style="width: 16%;">No. Bukti & Kwitansi</th>
                <th style="width: 20%;">Pelanggan</th>
                <th style="width: 20%;">Saluran & Rekening Hotel</th>
                <th style="width: 12%;">Alokasi Faktur</th>
                <th style="width: 14%;">Income Audit</th>
                <th style="width: 11%; text-align: right;">Nominal Diterima</th>
                <th style="width: 7%; text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of filteredPayments()" class="align-middle">
                <td>
                  <div class="v3-mono fw-bold text-dark">{{ p.paymentNumber }}</div>
                  <div class="text-secondary small mt-0" style="font-size: 0.72rem;">
                    <i class="bi bi-calendar3 me-1"></i>{{ p.paymentDate }}
                  </div>
                  <div class="text-muted font-monospace" style="font-size: 0.65rem;" *ngIf="p.kwitansiNumber">
                    Kwt: {{ p.kwitansiNumber }}
                  </div>
                </td>

                <td>
                  <div class="fw-bold text-dark cursor-pointer text-primary-hover"
                    *ngIf="getCustomer(p.customerId) as cust" (click)="viewCustomer(cust)">
                    {{ p.customerName }}
                  </div>
                  <div *ngIf="!getCustomer(p.customerId)" class="fw-bold text-dark">
                    {{ p.customerName }}
                  </div>
                  <div class="text-muted small" *ngIf="getCustomer(p.customerId) as cust" style="font-size: 0.7rem;">
                    {{ cust.contactPerson }}
                  </div>
                </td>

                <td>
                  <div class="d-flex align-items-center gap-1 mb-1 flex-wrap">
                    <span class="badge bg-secondary-subtle text-dark border py-0 px-2" style="font-size: 0.68rem;">
                      {{ p.paymentChannel }}
                    </span>
                  </div>
                  <div *ngIf="getBankAccount(p.bankAccountId) as bank" class="small text-secondary" style="font-size: 0.72rem;">
                    {{ bank.bankName }} &bull; <span class="font-monospace text-dark">{{ bank.accountNumber }}</span>
                  </div>
                  <div class="text-muted font-monospace" style="font-size: 0.68rem;" *ngIf="p.referenceNumber">
                    Ref: {{ p.referenceNumber }}
                  </div>
                </td>

                <td>
                  <div *ngIf="p.isDownPayment">
                    <span class="text-warning-emphasis fw-semibold small">Uang Muka (DP)</span>
                  </div>
                  <div *ngIf="!p.isDownPayment && p.allocations && p.allocations.length > 0" class="d-flex flex-column gap-1">
                    <div *ngFor="let alloc of p.allocations" class="d-flex align-items-center gap-1">
                      <span class="v3-mono text-primary fw-medium small">
                        {{ alloc.invoiceNumber }}
                      </span>
                    </div>
                  </div>
                  <div *ngIf="!p.isDownPayment && (!p.allocations || p.allocations.length === 0)" class="text-muted small">
                    (Belum Dialokasi)
                  </div>
                </td>

                <td>
                  <div *ngIf="p.auditStatus === 'verified_fa'">
                    <span class="text-success small fw-medium">
                      <i class="bi bi-shield-check me-1"></i>Verified
                    </span>
                    <div class="text-muted small" style="font-size: 0.65rem;" *ngIf="p.auditedBy">
                      {{ p.auditedBy }}
                    </div>
                  </div>
                  <div *ngIf="p.auditStatus !== 'verified_fa'">
                    <span class="text-muted small">Pending FA</span>
                  </div>
                </td>

                <td class="text-end">
                  <div class="v3-mono fw-bold text-success fs-6">{{ p.amount | rupiah }}</div>
                  <div class="text-muted" style="font-size: 0.68rem;" *ngIf="p.adminFee && p.adminFee > 0">
                    Fee: {{ p.adminFee | rupiah }}
                  </div>
                </td>

                <td class="text-end">
                  <div class="d-flex justify-content-end gap-1">
                    <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-1.5"
                      (click)="printKwitansi(p)" title="Cetak Kwitansi">
                      <i class="bi bi-printer"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger py-0 px-1.5"
                      *ngIf="isManagerOrAdmin"
                      (click)="requestDeletePayment(p)"
                      title="Batalkan pembayaran dan pulihkan saldo tagihan invoice">
                      <i class="bi bi-arrow-counterclockwise"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="filteredPayments().length === 0">
                <td colspan="7" class="text-center py-5">
                  <div class="d-flex flex-column align-items-center gap-2">
                    <i class="bi bi-wallet2 fs-2 text-muted"></i>
                    <div class="fw-semibold text-secondary">Tidak ada data pembayaran yang sesuai filter</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Confirm Rollback Modal -->
    <app-confirm-dialog
      [isOpen]="showDeleteModal()"
      [state]="deleteState()"
      (close)="showDeleteModal.set(false)"
      (confirm)="executeConfirmedDelete($event)">
    </app-confirm-dialog>
  `
})
export class PaymentListComponent {
  readonly arService = inject(ArDataService);
  readonly navService = inject(NavigationService);

  paymentSearchQuery = signal<string>('');
  paymentMethodFilter = signal<string>('ALL');
  paymentStartDate = signal<string>('');
  paymentEndDate = signal<string>('');
  paymentSortBy = signal<'paymentDate_desc' | 'paymentDate_asc' | 'amount_desc'>('paymentDate_desc');

  showDeleteModal = signal<boolean>(false);
  deleteState = signal<DeleteModalState | null>(null);

  get isViewer(): boolean {
    return this.arService.currentUser().role === 'Viewer';
  }

  get isManagerOrAdmin(): boolean {
    const role = this.arService.currentUser().role;
    return role === 'Manager' || role === 'Admin';
  }

  pendingIncomeAuditCount = computed(() => {
    return this.arService.payments().filter(p => !p.auditStatus || p.auditStatus === 'pending_fa').length;
  });

  getCustomer(customerId: string) {
    return this.arService.getCustomer(customerId);
  }

  getBankAccount(bankId?: string) {
    if (!bankId) return null;
    return this.arService.bankAccounts().find(b => b.id === bankId) || null;
  }

  hasActivePaymentFilters = computed(() => {
    return !!(
      this.paymentSearchQuery().trim() ||
      this.paymentMethodFilter() !== 'ALL' ||
      this.paymentStartDate() ||
      this.paymentEndDate() ||
      this.paymentSortBy() !== 'paymentDate_desc'
    );
  });

  filteredPayments = computed(() => {
    const q = this.paymentSearchQuery().toLowerCase().trim();
    const method = this.paymentMethodFilter();
    const start = this.paymentStartDate();
    const end = this.paymentEndDate();
    const sort = this.paymentSortBy();

    let list = this.arService.payments().filter(p => {
      const matchesQ = !q ||
        p.paymentNumber.toLowerCase().includes(q) ||
        (p.kwitansiNumber && p.kwitansiNumber.toLowerCase().includes(q)) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q)) ||
        (p.paymentChannel && p.paymentChannel.toLowerCase().includes(q));

      if (!matchesQ) return false;
      if (method !== 'ALL' && p.method !== method) return false;
      if (start && p.paymentDate < start) return false;
      if (end && p.paymentDate > end) return false;
      return true;
    });

    return list.sort((a, b) => {
      if (sort === 'paymentDate_desc') return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
      if (sort === 'paymentDate_asc') return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
      if (sort === 'amount_desc') return b.amount - a.amount;
      return 0;
    });
  });

  resetPaymentFilters() {
    this.paymentSearchQuery.set('');
    this.paymentMethodFilter.set('ALL');
    this.paymentStartDate.set('');
    this.paymentEndDate.set('');
    this.paymentSortBy.set('paymentDate_desc');
  }

  viewCustomer(cust: Customer) {
    this.navService.navigateTo('customer-detail', { customer: cust });
  }

  openPaymentModal() {
    this.navService.openPaymentModal();
  }

  printKwitansi(payment: Payment) {
    window.print();
  }

  requestDeletePayment(payment: Payment) {
    this.deleteState.set({
      type: 'payment',
      id: payment.id,
      title: 'Rollback Pembayaran',
      name: `${payment.paymentNumber} (${payment.customerName})`,
      message: 'Apakah Anda yakin ingin membatalkan pembayaran ini? Saldo sisa invoice yang telah dilunasi akan otomatis dipulihkan.',
      canDelete: true
    });
    this.showDeleteModal.set(true);
  }

  executeConfirmedDelete(state: DeleteModalState) {
    this.arService.deletePayment(state.id);
    this.showDeleteModal.set(false);
  }
}
