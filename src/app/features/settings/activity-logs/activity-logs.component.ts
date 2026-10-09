import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from '../../../core/services/ar-data.service';
import { RupiahPipe } from '../../../shared/pipes/rupiah.pipe';

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe],
  template: `
    <div class="d-flex flex-column gap-3">
      <div>
        <h3 class="fw-bold mb-1" style="font-size: 1.15rem;">Log Aktivitas</h3>
        <p class="text-muted small mb-0">Riwayat aktivitas dan pencatatan transaksi pada sistem.</p>
      </div>

      <!-- Activity Logs Filter Bar -->
      <div class="p-2.5 bg-white rounded border d-flex flex-wrap align-items-center justify-content-between gap-2.5">
        <div class="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
          <!-- Search Text -->
          <div style="min-width: 200px; max-width: 250px;" class="flex-grow-1">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control form-control-sm border-start-0 ps-0"
                placeholder="Cari keterangan, user, ref..." [ngModel]="logSearchQuery()"
                (ngModelChange)="logSearchQuery.set($event)">
            </div>
          </div>

          <!-- Activity Type Filter -->
          <div style="min-width: 175px;">
            <select class="form-select form-select-sm" [ngModel]="logTypeFilter()"
              (ngModelChange)="logTypeFilter.set($event)">
              <option value="ALL">Semua Jenis Aktivitas</option>
              <option value="invoice_created">Invoice Dibuat</option>
              <option value="invoice_issued">Invoice Diterbitkan</option>
              <option value="invoice_cancelled">Invoice Dibatalkan</option>
              <option value="invoice_deleted">Invoice Dihapus</option>
              <option value="payment_recorded">Pembayaran Dicatat</option>
              <option value="payment_deleted">Pembayaran Di-Rollback</option>
              <option value="customer_created">Customer Didaftarkan</option>
              <option value="customer_deleted">Customer Dihapus</option>
            </select>
          </div>

          <!-- User Filter -->
          <div style="min-width: 155px;">
            <select class="form-select form-select-sm" [ngModel]="logUserFilter()"
              (ngModelChange)="logUserFilter.set($event)">
              <option value="ALL">Semua Pengguna</option>
              <option *ngFor="let u of availableLogUsers()" [value]="u">{{ u }}</option>
            </select>
          </div>

          <!-- Date Range Picker -->
          <div class="d-flex align-items-center gap-1.5 bg-light border rounded px-2" style="height: 31px;">
            <i class="bi bi-calendar3 text-muted" style="font-size: 0.75rem;"></i>
            <span class="text-muted" style="font-size: 0.75rem;">Dari:</span>
            <input type="date" class="form-control form-control-sm border-0 bg-transparent p-0"
              style="font-size: 0.75rem; width: 108px; height: auto;" title="Dari tanggal (Opsional)"
              [ngModel]="logStartDate()" (ngModelChange)="logStartDate.set($event)">
            <span class="text-muted" style="font-size: 0.75rem;">s/d</span>
            <input type="date" class="form-control form-control-sm border-0 bg-transparent p-0"
              style="font-size: 0.75rem; width: 108px; height: auto;" title="Sampai tanggal (Opsional)"
              [ngModel]="logEndDate()" (ngModelChange)="logEndDate.set($event)">
            <button type="button" class="btn btn-link text-muted p-0 ms-1" *ngIf="logStartDate() || logEndDate()"
              (click)="logStartDate.set(''); logEndDate.set('')" title="Hapus filter rentang tanggal">
              <i class="bi bi-x-circle-fill text-secondary" style="font-size: 0.8rem;"></i>
            </button>
          </div>

          <!-- Reset Button -->
          <button type="button" class="btn btn-sm btn-link text-decoration-none text-danger p-0 ms-1"
            *ngIf="hasActiveLogFilters()" (click)="resetLogFilters()" title="Kembalikan semua filter log">
            <i class="bi bi-x-circle me-1"></i>Reset
          </button>
        </div>

        <!-- Total Counter -->
        <div class="text-muted small text-nowrap d-none d-md-block">
          Hasil: <strong class="text-dark">{{ filteredActivityLogs().length }}</strong> entri log
        </div>
      </div>

      <div class="v3-card">
        <div class="v3-table-container">
          <table class="v3-table">
            <thead>
              <tr>
                <th>Waktu (Timestamp)</th>
                <th>Pengguna (User & Role)</th>
                <th>Jenis Aktivitas</th>
                <th>Referensi</th>
                <th>Deskripsi Keterangan</th>
                <th class="text-end">Nominal Terkait</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of filteredActivityLogs()">
                <td class="v3-mono text-muted small">{{ log.timestamp }}</td>
                <td>
                  <div class="fw-semibold text-dark">{{ log.user || 'Sistem' }}</div>
                  <small class="badge bg-light text-secondary border" style="font-size: 0.65rem;">
                    {{ log.role || 'Admin' }}
                  </small>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'bg-info-subtle text-info border border-info-subtle': log.badgeType === 'info',
                    'bg-success-subtle text-success border border-success-subtle': log.badgeType === 'success',
                    'bg-warning-subtle text-warning border border-warning-subtle': log.badgeType === 'warning',
                    'bg-danger-subtle text-danger border border-danger-subtle': log.badgeType === 'danger',
                    'bg-secondary-subtle text-secondary border border-secondary-subtle': log.badgeType === 'secondary'
                  }">{{ log.type.replace('_', ' ').toUpperCase() }}</span>
                </td>
                <td class="v3-mono text-dark fw-medium">{{ log.referenceId || '-' }}</td>
                <td class="small">{{ log.description }}</td>
                <td class="text-end v3-mono fw-semibold">
                  <span *ngIf="log.amount">{{ log.amount | rupiah }}</span>
                  <span *ngIf="!log.amount" class="text-muted">-</span>
                </td>
              </tr>
              <tr *ngIf="filteredActivityLogs().length === 0">
                <td colspan="6" class="text-center py-4 text-muted">Tidak ditemukan log aktivitas sesuai filter.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ActivityLogsComponent {
  readonly arService = inject(ArDataService);

  logSearchQuery = signal<string>('');
  logTypeFilter = signal<string>('ALL');
  logUserFilter = signal<string>('ALL');
  logStartDate = signal<string>('');
  logEndDate = signal<string>('');

  availableLogUsers = computed(() => {
    const set = new Set<string>();
    for (const l of this.arService.activityLogs()) {
      if (l.user) set.add(l.user);
    }
    return Array.from(set).sort();
  });

  hasActiveLogFilters = computed(() => {
    return (
      this.logSearchQuery().trim() !== '' ||
      this.logTypeFilter() !== 'ALL' ||
      this.logUserFilter() !== 'ALL' ||
      this.logStartDate() !== '' ||
      this.logEndDate() !== ''
    );
  });

  filteredActivityLogs = computed(() => {
    let list = this.arService.activityLogs();
    const q = this.logSearchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(l =>
        l.description.toLowerCase().includes(q) ||
        (l.user && l.user.toLowerCase().includes(q)) ||
        (l.referenceId && l.referenceId.toLowerCase().includes(q))
      );
    }
    if (this.logTypeFilter() !== 'ALL') {
      list = list.filter(l => l.type === this.logTypeFilter());
    }
    if (this.logUserFilter() !== 'ALL') {
      list = list.filter(l => l.user === this.logUserFilter());
    }
    if (this.logStartDate()) {
      list = list.filter(l => l.timestamp.substring(0, 10) >= this.logStartDate());
    }
    if (this.logEndDate()) {
      list = list.filter(l => l.timestamp.substring(0, 10) <= this.logEndDate());
    }
    return list;
  });

  resetLogFilters() {
    this.logSearchQuery.set('');
    this.logTypeFilter.set('ALL');
    this.logUserFilter.set('ALL');
    this.logStartDate.set('');
    this.logEndDate.set('');
  }
}
