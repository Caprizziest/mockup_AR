import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from '../../../../core/services/ar-data.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { RupiahPipe } from '../../../../shared/pipes/rupiah.pipe';
import { Customer } from '../../../../core/models/ar.models';
import { CustomerFormModalComponent } from '../../components/customer-form-modal/customer-form-modal.component';
import { ConfirmDialogComponent, DeleteModalState } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe, CustomerFormModalComponent, ConfirmDialogComponent],
  template: `
    <div class="d-flex flex-column gap-3">
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div class="v3-tabs-bar">
          <button type="button" class="v3-tab-btn" [class.active]="customerFilter() === 'ALL'"
            (click)="customerFilter.set('ALL')">
            Semua Pelanggan ({{ arService.customers().length }})
          </button>
          <button type="button" class="v3-tab-btn text-danger" [class.active]="customerFilter() === 'OVERDUE'"
            (click)="customerFilter.set('OVERDUE')">
            Memiliki Overdue
          </button>
          <button type="button" class="v3-tab-btn" [class.active]="customerFilter() === 'HOLD'"
            (click)="customerFilter.set('HOLD')">
            Credit Hold
          </button>
        </div>

        <button type="button" class="v3-btn-primary text-nowrap" [disabled]="isViewer"
          (click)="openNewCustomerModal()">
          + Tambah Pelanggan
        </button>
      </div>

      <!-- Customers Secondary Filter Bar -->
      <div class="p-2.5 bg-white rounded border d-flex flex-wrap align-items-center justify-content-between gap-2.5">
        <div class="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
          <!-- Search Text -->
          <div style="min-width: 220px; max-width: 280px;" class="flex-grow-1">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control form-control-sm border-start-0 ps-0"
                placeholder="Cari nama, NIK, NPWP, kontak..." [ngModel]="customerSearchQuery()"
                (ngModelChange)="customerSearchQuery.set($event)">
            </div>
          </div>

          <!-- Balance / Credit Status Filter -->
          <div style="min-width: 175px;">
            <select class="form-select form-select-sm" [ngModel]="customerBalanceFilter()"
              (ngModelChange)="customerBalanceFilter.set($event)">
              <option value="ALL">Semua Kondisi Saldo</option>
              <option value="HAS_BALANCE">Memiliki Piutang (> 0)</option>
              <option value="NEAR_LIMIT">Mendekati Batas Kredit (≥ 70%)</option>
              <option value="ZERO_BALANCE">Saldo Lunas (Rp 0)</option>
            </select>
          </div>

          <!-- Sorting Dropdown -->
          <div style="min-width: 175px;">
            <select class="form-select form-select-sm" [ngModel]="customerSortBy()"
              (ngModelChange)="customerSortBy.set($event)">
              <option value="balance_desc">Sisa Piutang: Terbesar</option>
              <option value="name_asc">Nama Pelanggan: A–Z</option>
              <option value="creditLimit_desc">Batas Plafon: Terbesar</option>
            </select>
          </div>

          <!-- Reset Button -->
          <button type="button" class="btn btn-sm btn-link text-decoration-none text-danger p-0 ms-1"
            *ngIf="hasActiveCustomerFilters()" (click)="resetCustomerFilters()"
            title="Kembalikan semua filter pelanggan">
            <i class="bi bi-x-circle me-1"></i>Reset
          </button>
        </div>

        <!-- Total Counter -->
        <div class="text-muted small text-nowrap d-none d-md-block">
          Hasil: <strong class="text-dark">{{ filteredCustomers().length }}</strong> pelanggan
        </div>
      </div>

      <div class="v3-card">
        <div class="v3-table-container">
          <table class="v3-table">
            <thead>
              <tr>
                <th>Pelanggan & Kode</th>
                <th>Kontak & Legalitas</th>
                <th class="text-end">Sisa Piutang (AR)</th>
                <th>Batas & Utilisasi Kredit</th>
                <th>Status</th>
                <th class="text-end">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cust of filteredCustomers()">
                <td>
                  <a href="javascript:void(0)" class="fw-bold text-primary text-decoration-none text-truncate d-block"
                    style="max-width: 190px;" [title]="cust.name" (click)="viewCustomer(cust)">
                    {{ cust.name }}
                  </a>
                  <div class="text-muted v3-mono" style="font-size: 0.7rem;">
                    {{ cust.code }} &bull; Termin: Net {{ cust.dueDays }}h
                  </div>
                </td>
                <td>
                  <div class="fw-medium text-truncate" style="max-width: 170px;">{{ cust.contactPerson }}</div>
                  <div class="text-muted small v3-mono" style="font-size: 0.7rem;">
                    {{ cust.phone }}
                    <span *ngIf="cust.npwp">&bull; NPWP: {{ cust.npwp }}</span>
                  </div>
                </td>
                <td class="text-end">
                  <div class="v3-mono fw-bold" [class.text-danger]="arService.getCustomerBalance(cust.id) > 0">
                    {{ arService.getCustomerBalance(cust.id) | rupiah }}
                  </div>
                  <small class="text-muted" style="font-size: 0.68rem;"
                    *ngIf="arService.getCustomerInvoiceCount(cust.id) as count">
                    {{ count }} invoice
                  </small>
                </td>
                <td style="min-width: 130px; max-width: 155px;">
                  <div class="d-flex justify-content-between small text-muted mb-1" style="font-size: 0.7rem;">
                    <span>Limit: {{ cust.creditLimit | rupiah }}</span>
                    <span class="v3-mono fw-semibold">{{ getCustomerCreditUtilization(cust) }}%</span>
                  </div>
                  <div class="progress" style="height: 5px;">
                    <div class="progress-bar" [class.bg-danger]="getCustomerCreditUtilization(cust) > 80"
                      [class.bg-warning]="getCustomerCreditUtilization(cust) > 50 && getCustomerCreditUtilization(cust) <= 80"
                      [class.bg-success]="getCustomerCreditUtilization(cust) <= 50"
                      [style.width.%]="getCustomerCreditUtilization(cust)"></div>
                  </div>
                </td>
                <td>
                  <span class="v3-badge" [ngClass]="cust.status === 'active' ? 'v3-badge-paid' : 'v3-badge-overdue'">
                    {{ cust.status === 'active' ? 'Aktif' : 'Credit Hold' }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="d-inline-flex gap-1">
                    <button type="button" class="btn btn-sm btn-light border py-1 px-2" style="font-size: 0.72rem;"
                      (click)="viewCustomer(cust)" title="Lihat Profil">
                      Profil
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-primary py-1 px-2" style="font-size: 0.72rem;"
                      [disabled]="isViewer" (click)="openEditCustomerModal(cust)" title="Ubah Data">
                      Ubah
                    </button>
                    <button type="button" class="v3-btn-primary py-1 px-2" style="font-size: 0.72rem;"
                      [disabled]="isViewer" (click)="startCreateInvoice(cust.id)" title="Buat Invoice">
                      Tagih
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger py-1 px-2" style="font-size: 0.72rem;"
                      [disabled]="isViewer" (click)="requestDeleteCustomer(cust)" title="Hapus Pelanggan">
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredCustomers().length === 0">
                <td colspan="6" class="text-center py-4 text-muted">
                  Tidak ditemukan data pelanggan yang cocok.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Customer Form Modal -->
    <app-customer-form-modal
      [isOpen]="showCustomerModal()"
      [customer]="selectedCustomerForEdit()"
      (close)="showCustomerModal.set(false)"
      (save)="handleSaveCustomer($event)">
    </app-customer-form-modal>

    <!-- Delete Confirmation Modal -->
    <app-confirm-dialog
      [isOpen]="showDeleteModal()"
      [state]="deleteState()"
      (close)="showDeleteModal.set(false)"
      (confirm)="executeConfirmedDelete($event)">
    </app-confirm-dialog>
  `
})
export class CustomerListComponent {
  readonly arService = inject(ArDataService);
  readonly navService = inject(NavigationService);

  customerFilter = signal<'ALL' | 'OVERDUE' | 'HOLD'>('ALL');
  customerSearchQuery = signal<string>('');
  customerBalanceFilter = signal<'ALL' | 'HAS_BALANCE' | 'NEAR_LIMIT' | 'ZERO_BALANCE'>('ALL');
  customerSortBy = signal<'balance_desc' | 'name_asc' | 'creditLimit_desc'>('balance_desc');

  showCustomerModal = signal<boolean>(false);
  selectedCustomerForEdit = signal<Customer | null>(null);

  showDeleteModal = signal<boolean>(false);
  deleteState = signal<DeleteModalState | null>(null);

  get isViewer(): boolean {
    return this.arService.currentUser().role === 'Viewer';
  }

  hasActiveCustomerFilters = computed(() => {
    return (
      this.customerSearchQuery().trim() !== '' ||
      this.customerBalanceFilter() !== 'ALL' ||
      this.customerSortBy() !== 'balance_desc' ||
      this.customerFilter() !== 'ALL'
    );
  });

  filteredCustomers = computed(() => {
    const q = this.customerSearchQuery().toLowerCase().trim();
    const tabFilter = this.customerFilter();
    const balanceFilter = this.customerBalanceFilter();
    const sort = this.customerSortBy();

    let list = this.arService.customers().filter(cust => {
      const matchesQ = !q ||
        cust.name.toLowerCase().includes(q) ||
        cust.code.toLowerCase().includes(q) ||
        (cust.nik && cust.nik.includes(q)) ||
        (cust.npwp && cust.npwp.toLowerCase().includes(q)) ||
        cust.contactPerson.toLowerCase().includes(q);

      if (!matchesQ) return false;

      if (tabFilter === 'HOLD' && cust.status !== 'credit_hold') return false;
      if (tabFilter === 'OVERDUE') {
        const hasOverdue = this.arService.invoices().some(i => i.customerId === cust.id && i.status === 'Overdue');
        if (!hasOverdue) return false;
      }

      const balance = this.arService.getCustomerBalance(cust.id);
      if (balanceFilter === 'HAS_BALANCE' && balance <= 0) return false;
      if (balanceFilter === 'ZERO_BALANCE' && balance > 0) return false;
      if (balanceFilter === 'NEAR_LIMIT') {
        const util = this.getCustomerCreditUtilization(cust);
        if (util < 70) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      if (sort === 'balance_desc') {
        return this.arService.getCustomerBalance(b.id) - this.arService.getCustomerBalance(a.id);
      }
      if (sort === 'creditLimit_desc') {
        return b.creditLimit - a.creditLimit;
      }
      if (sort === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  });

  resetCustomerFilters() {
    this.customerSearchQuery.set('');
    this.customerBalanceFilter.set('ALL');
    this.customerSortBy.set('balance_desc');
    this.customerFilter.set('ALL');
  }

  getCustomerCreditUtilization(cust: Customer): number {
    const balance = this.arService.getCustomerBalance(cust.id);
    if (!cust.creditLimit || cust.creditLimit <= 0) return 0;
    return Math.min(100, Math.round((balance / cust.creditLimit) * 100));
  }

  viewCustomer(cust: Customer) {
    this.navService.navigateTo('customer-detail', { customer: cust });
  }

  openNewCustomerModal() {
    this.selectedCustomerForEdit.set(null);
    this.showCustomerModal.set(true);
  }

  openEditCustomerModal(cust: Customer) {
    this.selectedCustomerForEdit.set(cust);
    this.showCustomerModal.set(true);
  }

  startCreateInvoice(customerId?: string) {
    this.navService.navigateTo('invoice-create');
  }

  handleSaveCustomer(payload: any) {
    if (payload.id) {
      this.arService.updateCustomer(payload.id, payload);
    } else {
      this.arService.createCustomer(payload);
    }
    this.showCustomerModal.set(false);
  }

  requestDeleteCustomer(cust: Customer) {
    const hasInvoices = this.arService.customerHasInvoices(cust.id);
    this.deleteState.set({
      type: 'customer',
      id: cust.id,
      title: 'Hapus Data Pelanggan',
      name: `${cust.name} (${cust.code})`,
      message: 'Apakah Anda yakin ingin menghapus data pelanggan ini?',
      canDelete: !hasInvoices,
      blockedReason: hasInvoices ? 'Pelanggan memiliki riwayat invoice dan tidak dapat dihapus.' : undefined
    });
    this.showDeleteModal.set(true);
  }

  executeConfirmedDelete(state: DeleteModalState) {
    this.arService.deleteCustomer(state.id);
    this.showDeleteModal.set(false);
  }
}
