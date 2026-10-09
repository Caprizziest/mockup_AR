import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from '../../../../core/services/ar-data.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { RupiahPipe } from '../../../../shared/pipes/rupiah.pipe';
import { Invoice } from '../../../../core/models/ar.models';
import { CancelInvoiceModalComponent } from '../../components/cancel-invoice-modal/cancel-invoice-modal.component';
import { ConfirmDialogComponent, DeleteModalState } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe, CancelInvoiceModalComponent, ConfirmDialogComponent],
  template: `
    <div class="d-flex flex-column gap-3">
      <!-- Controls Toolbar: Status Tabs per Table 4.4.2 & Action Button -->
      <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
        <div class="v3-tabs-bar">
          <button type="button" class="v3-tab-btn" [class.active]="invoiceCategoryFilter() === 'ALL'"
            (click)="invoiceCategoryFilter.set('ALL')">
            Semua <span class="v3-tab-count">{{ invoiceCategoryCounts().all }}</span>
          </button>
          <button type="button" class="v3-tab-btn" [class.active]="invoiceCategoryFilter() === 'Draft'"
            (click)="invoiceCategoryFilter.set('Draft')">
            Draft <span class="v3-tab-count">{{ invoiceCategoryCounts().draft }}</span>
          </button>
          <button type="button" class="v3-tab-btn" [class.active]="invoiceCategoryFilter() === 'Issued'"
            (click)="invoiceCategoryFilter.set('Issued')">
            Issued <span class="v3-tab-count">{{ invoiceCategoryCounts().issued }}</span>
          </button>
          <button type="button" class="v3-tab-btn" [class.active]="invoiceCategoryFilter() === 'Partially Paid'"
            (click)="invoiceCategoryFilter.set('Partially Paid')">
            Partially Paid <span class="v3-tab-count">{{ invoiceCategoryCounts().partiallyPaid }}</span>
          </button>
          <button type="button" class="v3-tab-btn text-danger" [class.active]="invoiceCategoryFilter() === 'Overdue'"
            (click)="invoiceCategoryFilter.set('Overdue')">
            Overdue <span class="v3-tab-count">{{ invoiceCategoryCounts().overdue }}</span>
          </button>
          <button type="button" class="v3-tab-btn text-success" [class.active]="invoiceCategoryFilter() === 'Paid'"
            (click)="invoiceCategoryFilter.set('Paid')">
            Paid <span class="v3-tab-count">{{ invoiceCategoryCounts().paid }}</span>
          </button>
          <button type="button" class="v3-tab-btn text-muted" [class.active]="invoiceCategoryFilter() === 'Cancelled'"
            (click)="invoiceCategoryFilter.set('Cancelled')">
            Cancelled <span class="v3-tab-count">{{ invoiceCategoryCounts().cancelled }}</span>
          </button>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button type="button" class="v3-btn-primary text-nowrap" [disabled]="isViewer"
            (click)="startCreateInvoice()">
            + Buat Invoice
          </button>
        </div>
      </div>

      <!-- Secondary Filter Bar -->
      <div class="p-2.5 bg-white rounded border d-flex flex-wrap align-items-center justify-content-between gap-2.5">
        <div class="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
          <!-- Search Text -->
          <div style="min-width: 200px; max-width: 260px;" class="flex-grow-1">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control form-control-sm border-start-0 ps-0"
                placeholder="Cari invoice, pelanggan, NPWP..." [ngModel]="invoiceSearchQuery()"
                (ngModelChange)="invoiceSearchQuery.set($event)">
            </div>
          </div>

          <!-- Customer Filter Dropdown -->
          <div style="min-width: 170px;">
            <select class="form-select form-select-sm" [ngModel]="invoiceCustomerFilter()"
              (ngModelChange)="invoiceCustomerFilter.set($event)">
              <option value="ALL">Semua Pelanggan</option>
              <option *ngFor="let c of arService.customers()" [value]="c.id">{{ c.name }}</option>
            </select>
          </div>

          <!-- Date Range / Period Filter Dropdown -->
          <div style="min-width: 135px;">
            <select class="form-select form-select-sm" [ngModel]="invoiceDateFilter()"
              (ngModelChange)="invoiceDateFilter.set($event)">
              <option value="ALL">Semua Periode</option>
              <option value="THIS_MONTH">Bulan Berjalan</option>
              <option value="LAST_MONTH">Bulan Lalu</option>
              <option value="THIS_YEAR">Tahun Ini</option>
            </select>
          </div>

          <!-- Optional Date Range Picker -->
          <div class="d-flex align-items-center gap-1.5 bg-light border rounded px-2" style="height: 31px;">
            <i class="bi bi-calendar3 text-muted" style="font-size: 0.75rem;"></i>
            <span class="text-muted" style="font-size: 0.75rem;">Dari:</span>
            <input type="date" class="form-control form-control-sm border-0 bg-transparent p-0"
              style="font-size: 0.75rem; width: 108px; height: auto;" title="Dari tanggal (Opsional)"
              [ngModel]="invoiceStartDate()" (ngModelChange)="invoiceStartDate.set($event)">
            <span class="text-muted" style="font-size: 0.75rem;">s/d</span>
            <input type="date" class="form-control form-control-sm border-0 bg-transparent p-0"
              style="font-size: 0.75rem; width: 108px; height: auto;" title="Sampai tanggal (Opsional)"
              [ngModel]="invoiceEndDate()" (ngModelChange)="invoiceEndDate.set($event)">
            <button type="button" class="btn btn-link text-muted p-0 ms-1"
              *ngIf="invoiceStartDate() || invoiceEndDate()"
              (click)="invoiceStartDate.set(''); invoiceEndDate.set('')" title="Hapus filter rentang tanggal">
              <i class="bi bi-x-circle-fill text-secondary" style="font-size: 0.8rem;"></i>
            </button>
          </div>

          <!-- Sorting Dropdown -->
          <div style="min-width: 160px;">
            <select class="form-select form-select-sm" [ngModel]="invoiceSortBy()"
              (ngModelChange)="invoiceSortBy.set($event)">
              <option value="dueDate_asc">Jatuh Tempo: Terdekat</option>
              <option value="dueDate_desc">Jatuh Tempo: Terlama</option>
              <option value="issueDate_desc">Tgl Terbit: Terbaru</option>
              <option value="balanceDue_desc">Sisa Tagihan: Terbesar</option>
              <option value="total_desc">Total Nilai: Terbesar</option>
            </select>
          </div>

          <!-- Reset Button -->
          <button type="button" class="btn btn-sm btn-link text-decoration-none text-danger p-0 ms-1"
            *ngIf="hasActiveInvoiceFilters()" (click)="resetInvoiceFilters()" title="Kembalikan semua filter">
            <i class="bi bi-x-circle me-1"></i>Reset
          </button>
        </div>

        <!-- Total Counter -->
        <div class="text-muted small text-nowrap d-none d-md-block">
          Hasil: <strong class="text-dark">{{ filteredInvoices().length }}</strong> dokumen
        </div>
      </div>

      <!-- Summary Strip -->
      <div class="d-flex align-items-center justify-content-between px-3 py-2 bg-white rounded border border-light text-muted"
        style="font-size: 0.78rem;">
        <span>Menampilkan <strong>{{ filteredSummary().count }}</strong> dokumen invoice</span>
        <div class="d-flex gap-4">
          <span>Total Nilai: <strong class="v3-mono text-dark">{{ filteredSummary().totalAmount | rupiah }}</strong></span>
          <span>Total Sisa Tagihan (AR): <strong class="v3-mono text-danger">{{ filteredSummary().balanceDue | rupiah }}</strong></span>
        </div>
      </div>

      <!-- Invoices Table -->
      <div class="v3-card">
        <div class="v3-table-container">
          <table class="v3-table">
            <thead>
              <tr>
                <th>No. & Tgl Invoice</th>
                <th>Pelanggan & Layanan</th>
                <th>Jatuh Tempo</th>
                <th class="text-end">Total & Dibayar</th>
                <th class="text-end">Sisa Tagihan (AR)</th>
                <th>Status</th>
                <th class="text-end">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let inv of filteredInvoices()">
                <td>
                  <a href="javascript:void(0)" class="fw-bold text-primary text-decoration-none v3-mono d-block"
                    (click)="viewInvoice(inv)">
                    {{ inv.invoiceNumber }}
                  </a>
                  <span class="v3-mono text-muted" style="font-size: 0.7rem;">{{ inv.issueDate }}</span>
                </td>
                <td>
                  <div class="fw-semibold text-truncate" style="max-width: 180px;" [title]="inv.customerName">
                    {{ inv.customerName }}
                  </div>
                  <div class="d-flex align-items-center gap-1 mt-1">
                    <span class="badge bg-light text-secondary border px-1 py-0" style="font-size: 0.65rem;">
                      {{ inv.invoiceType || 'General AR' }}
                    </span>
                    <span class="text-muted v3-mono" style="font-size: 0.68rem;" *ngIf="inv.customerNpwp">
                      NPWP: {{ inv.customerNpwp }}
                    </span>
                  </div>
                </td>
                <td>
                  <span class="v3-mono" [class.text-danger]="inv.status === 'Overdue'"
                    [class.fw-bold]="inv.status === 'Overdue'">
                    {{ inv.dueDate }}
                  </span>
                  <span *ngIf="inv.status === 'Overdue'" class="v3-badge v3-badge-overdue d-block mt-1"
                    style="font-size: 0.62rem; width: fit-content; padding: 0.05rem 0.35rem;">
                    +{{ getDaysPastDue(inv.dueDate) }}h
                  </span>
                </td>
                <td class="text-end">
                  <div class="v3-mono fw-semibold">{{ inv.total | rupiah }}</div>
                  <div class="v3-mono text-muted" style="font-size: 0.68rem;" *ngIf="inv.amountPaid > 0">
                    Dibayar: {{ inv.amountPaid | rupiah }}
                  </div>
                </td>
                <td class="text-end">
                  <div class="v3-mono fw-bold" [class.text-danger]="inv.balanceDue > 0"
                    [class.text-success]="inv.balanceDue === 0">
                    {{ inv.balanceDue | rupiah }}
                  </div>
                </td>
                <td>
                  <span class="v3-badge" [ngClass]="{
                    'v3-badge-draft': inv.status === 'Draft',
                    'v3-badge-issued': inv.status === 'Issued',
                    'v3-badge-partial': inv.status === 'Partially Paid',
                    'v3-badge-paid': inv.status === 'Paid',
                    'v3-badge-overdue': inv.status === 'Overdue',
                    'v3-badge-cancelled': inv.status === 'Cancelled'
                  }">
                    {{ inv.status }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="d-inline-flex align-items-center gap-1">
                    <button type="button" class="btn btn-sm btn-light border py-1 px-2" style="font-size: 0.72rem;"
                      (click)="viewInvoice(inv)" title="Lihat Rincian">
                      Lihat
                    </button>

                    <button type="button" class="btn btn-sm btn-outline-success py-1 px-2" style="font-size: 0.72rem;"
                      *ngIf="inv.status === 'Draft'" [disabled]="isViewer" (click)="issueDraftInvoice(inv)"
                      title="Terbitkan Invoice">
                      Terbitkan
                    </button>

                    <button type="button" class="btn btn-sm btn-outline-danger py-1 px-2" style="font-size: 0.72rem;"
                      *ngIf="inv.status === 'Draft'" [disabled]="isViewer" (click)="requestDeleteInvoice(inv)"
                      title="Hapus Draft Invoice">
                      Hapus
                    </button>

                    <button type="button" class="btn btn-sm btn-outline-danger py-1 px-2" style="font-size: 0.72rem;"
                      *ngIf="inv.status !== 'Draft' && inv.status !== 'Cancelled' && inv.amountPaid === 0" [disabled]="isViewer"
                      (click)="openCancelInvoiceModal(inv)" title="Batalkan Invoice">
                      Batal
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredInvoices().length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  Tidak ditemukan invoice yang cocok dengan kriteria filter.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Cancel Modal -->
    <app-cancel-invoice-modal
      [isOpen]="showCancelModal()"
      [invoice]="cancelInvoiceTarget()"
      (close)="showCancelModal.set(false)"
      (confirm)="handleConfirmCancel($event)">
    </app-cancel-invoice-modal>

    <!-- Delete Modal -->
    <app-confirm-dialog
      [isOpen]="showDeleteModal()"
      [state]="deleteState()"
      (close)="showDeleteModal.set(false)"
      (confirm)="executeConfirmedDelete($event)">
    </app-confirm-dialog>
  `
})
export class InvoiceListComponent {
  readonly arService = inject(ArDataService);
  readonly navService = inject(NavigationService);

  invoiceCategoryFilter = signal<'ALL' | 'Draft' | 'Issued' | 'Partially Paid' | 'Overdue' | 'Paid' | 'Cancelled'>('ALL');
  invoiceSearchQuery = signal<string>('');
  invoiceCustomerFilter = signal<string>('ALL');
  invoiceDateFilter = signal<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR'>('ALL');
  invoiceStartDate = signal<string>('');
  invoiceEndDate = signal<string>('');
  invoiceSortBy = signal<'dueDate_asc' | 'dueDate_desc' | 'issueDate_desc' | 'balanceDue_desc' | 'total_desc'>('dueDate_asc');

  showCancelModal = signal<boolean>(false);
  cancelInvoiceTarget = signal<Invoice | null>(null);

  showDeleteModal = signal<boolean>(false);
  deleteState = signal<DeleteModalState | null>(null);

  get isViewer(): boolean {
    return this.arService.currentUser().role === 'Viewer';
  }

  invoiceCategoryCounts = computed(() => {
    const list = this.arService.invoices();
    return {
      all: list.length,
      draft: list.filter(i => i.status === 'Draft').length,
      issued: list.filter(i => i.status === 'Issued').length,
      partiallyPaid: list.filter(i => i.status === 'Partially Paid').length,
      overdue: list.filter(i => i.status === 'Overdue').length,
      paid: list.filter(i => i.status === 'Paid').length,
      cancelled: list.filter(i => i.status === 'Cancelled').length
    };
  });

  hasActiveInvoiceFilters = computed(() => {
    return (
      this.invoiceSearchQuery().trim() !== '' ||
      this.invoiceCategoryFilter() !== 'ALL' ||
      this.invoiceCustomerFilter() !== 'ALL' ||
      this.invoiceDateFilter() !== 'ALL' ||
      this.invoiceStartDate() !== '' ||
      this.invoiceEndDate() !== '' ||
      this.invoiceSortBy() !== 'dueDate_asc'
    );
  });

  filteredInvoices = computed(() => {
    const q = this.invoiceSearchQuery().toLowerCase().trim();
    const cat = this.invoiceCategoryFilter();
    const custId = this.invoiceCustomerFilter();
    const dateFilter = this.invoiceDateFilter();
    const sort = this.invoiceSortBy();

    let list = this.arService.invoices().filter(inv => {
      const matchesQuery = !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerNpwp && inv.customerNpwp.toLowerCase().includes(q)) ||
        (inv.invoiceType && inv.invoiceType.toLowerCase().includes(q));

      if (!matchesQuery) return false;
      if (cat !== 'ALL' && inv.status !== cat) return false;
      if (custId !== 'ALL' && inv.customerId !== custId) return false;

      if (dateFilter !== 'ALL') {
        const invDate = new Date(inv.issueDate);
        const refDate = new Date(this.arService.today);
        if (dateFilter === 'THIS_MONTH') {
          if (invDate.getFullYear() !== refDate.getFullYear() || invDate.getMonth() !== refDate.getMonth()) return false;
        } else if (dateFilter === 'LAST_MONTH') {
          const lastMonth = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
          if (invDate.getFullYear() !== lastMonth.getFullYear() || invDate.getMonth() !== lastMonth.getMonth()) return false;
        } else if (dateFilter === 'THIS_YEAR') {
          if (invDate.getFullYear() !== refDate.getFullYear()) return false;
        }
      }

      if (this.invoiceStartDate() && inv.issueDate < this.invoiceStartDate()) return false;
      if (this.invoiceEndDate() && inv.issueDate > this.invoiceEndDate()) return false;

      return true;
    });

    return list.sort((a, b) => {
      if (sort === 'dueDate_asc') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sort === 'dueDate_desc') return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      if (sort === 'issueDate_desc') return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
      if (sort === 'balanceDue_desc') return b.balanceDue - a.balanceDue;
      if (sort === 'total_desc') return b.total - a.total;
      return 0;
    });
  });

  filteredSummary = computed(() => {
    const list = this.filteredInvoices();
    const totalAmount = list.reduce((sum, i) => sum + i.total, 0);
    const balanceDue = list.reduce((sum, i) => sum + i.balanceDue, 0);
    return { count: list.length, totalAmount, balanceDue };
  });

  resetInvoiceFilters() {
    this.invoiceSearchQuery.set('');
    this.invoiceCategoryFilter.set('ALL');
    this.invoiceCustomerFilter.set('ALL');
    this.invoiceDateFilter.set('ALL');
    this.invoiceStartDate.set('');
    this.invoiceEndDate.set('');
    this.invoiceSortBy.set('dueDate_asc');
  }

  getDaysPastDue(dueDateStr: string): number {
    const dueTime = new Date(dueDateStr).getTime();
    const todayTime = new Date(this.arService.today).getTime();
    const diff = Math.floor((todayTime - dueTime) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  viewInvoice(inv: Invoice) {
    this.navService.navigateTo('invoice-detail', { invoice: inv });
  }

  startCreateInvoice() {
    this.navService.navigateTo('invoice-create');
  }

  issueDraftInvoice(inv: Invoice) {
    this.arService.issueInvoice(inv.id);
  }

  openCancelInvoiceModal(inv: Invoice) {
    this.cancelInvoiceTarget.set(inv);
    this.showCancelModal.set(true);
  }

  handleConfirmCancel(data: { invoiceId: string; reason: string }) {
    this.arService.cancelInvoice(data.invoiceId, data.reason);
    this.showCancelModal.set(false);
  }

  requestDeleteInvoice(inv: Invoice) {
    this.deleteState.set({
      type: 'invoice',
      id: inv.id,
      title: 'Hapus Draft Invoice',
      name: `${inv.invoiceNumber} (${inv.customerName})`,
      message: 'Apakah Anda yakin ingin menghapus dokumen draft ini?',
      canDelete: inv.status === 'Draft'
    });
    this.showDeleteModal.set(true);
  }

  executeConfirmedDelete(state: DeleteModalState) {
    this.arService.deleteDraftInvoice(state.id);
    this.showDeleteModal.set(false);
  }
}
