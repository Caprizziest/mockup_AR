import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from '../../../core/services/ar-data.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { RupiahPipe } from '../../../shared/pipes/rupiah.pipe';
import { Invoice } from '../../../core/models/ar.models';

@Component({
  selector: 'app-aging-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe],
  template: `
    <div class="d-flex flex-column gap-3">
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <h3 class="fw-bold mb-1" style="font-size: 1.15rem;">Laporan Umur Piutang (Aging)</h3>
          <p class="text-muted small mb-0">Distribusi umur piutang pelanggan per interval 30 hari.</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <label class="small text-muted fw-semibold text-nowrap">As of Date:</label>
          <input type="date" class="form-control form-control-sm" style="width: 140px;" [ngModel]="agingAsOfDate()"
            (ngModelChange)="agingAsOfDate.set($event)">
        </div>
      </div>

      <!-- Aging Filter Bar -->
      <div class="p-2.5 bg-white rounded border d-flex flex-wrap align-items-center justify-content-between gap-2.5">
        <div class="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
          <!-- Search Text -->
          <div style="min-width: 220px; max-width: 280px;" class="flex-grow-1">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control form-control-sm border-start-0 ps-0"
                placeholder="Cari nama atau kode pelanggan..." [ngModel]="agingCustomerSearch()"
                (ngModelChange)="agingCustomerSearch.set($event)">
            </div>
          </div>

          <!-- Risk Filter Dropdown -->
          <div style="min-width: 180px;">
            <select class="form-select form-select-sm" [ngModel]="agingRiskFilter()"
              (ngModelChange)="agingRiskFilter.set($event)">
              <option value="ALL">Semua Tingkat Risiko</option>
              <option value="OVERDUE_ONLY">Hanya Menunggak (> 0 Hari)</option>
              <option value="CRITICAL_ONLY">Tunggakan Kritis (> 60 Hari)</option>
              <option value="CURRENT_ONLY">Belum Jatuh Tempo (Lancar)</option>
            </select>
          </div>

          <!-- Sorting Dropdown -->
          <div style="min-width: 175px;">
            <select class="form-select form-select-sm" [ngModel]="agingSortBy()"
              (ngModelChange)="agingSortBy.set($event)">
              <option value="total_desc">Total Piutang: Terbesar</option>
              <option value="critical_desc">Tunggakan Kritis: Terbesar</option>
              <option value="name_asc">Nama Pelanggan: A–Z</option>
            </select>
          </div>

          <!-- Reset Button -->
          <button type="button" class="btn btn-sm btn-link text-decoration-none text-danger p-0 ms-1"
            *ngIf="hasActiveAgingFilters()" (click)="resetAgingFilters()"
            title="Kembalikan semua filter umur piutang">
            <i class="bi bi-x-circle me-1"></i>Reset
          </button>
        </div>

        <!-- Total Counter -->
        <div class="text-muted small text-nowrap d-none d-md-block">
          Hasil: <strong class="text-dark">{{ filteredBuckets().length }}</strong> pelanggan
        </div>
      </div>

      <div class="v3-card">
        <div class="v3-table-container">
          <table class="v3-table">
            <thead>
              <tr>
                <th style="width: 30px;"></th>
                <th>Pelanggan</th>
                <th class="text-end">Belum Jatuh Tempo</th>
                <th class="text-end">1–30 Hari</th>
                <th class="text-end">31–60 Hari</th>
                <th class="text-end">61–90 Hari</th>
                <th class="text-end">&gt; 90 Hari (Kritis)</th>
                <th class="text-end">Total Piutang</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let b of filteredBuckets()">
                <tr class="cursor-pointer" (click)="toggleAgingRow(b.customerId)">
                  <td class="text-center">
                    <i class="bi" [ngClass]="expandedCustomerAgingId() === b.customerId ? 'bi-chevron-down text-primary fw-bold' : 'bi-chevron-right text-muted'"></i>
                  </td>
                  <td>
                    <div class="fw-bold text-dark">{{ b.customerName }}</div>
                    <span class="v3-mono text-muted small">{{ b.customerCode }}</span>
                  </td>
                  <td class="text-end v3-mono text-success">{{ b.current | rupiah }}</td>
                  <td class="text-end v3-mono text-primary">{{ b.days1_30 | rupiah }}</td>
                  <td class="text-end v3-mono text-warning">{{ b.days31_60 | rupiah }}</td>
                  <td class="text-end v3-mono text-danger">{{ b.days61_90 | rupiah }}</td>
                  <td class="text-end v3-mono text-danger fw-bold">
                    {{ b.days90Plus | rupiah }}
                    <span *ngIf="b.days90Plus > 0" class="badge bg-danger-subtle text-danger border ms-1">Hold</span>
                  </td>
                  <td class="text-end v3-mono fw-bold fs-6">{{ b.totalOutstanding | rupiah }}</td>
                </tr>

                <!-- Expandable Drilldown Row -->
                <tr *ngIf="expandedCustomerAgingId() === b.customerId" class="bg-light">
                  <td></td>
                  <td colspan="7" class="p-3">
                    <div class="p-3 bg-white rounded border shadow-sm">
                      <div class="fw-bold text-dark mb-2 small d-flex justify-content-between align-items-center">
                        <span>Rincian Invoice Penyusun Saldo Piutang: {{ b.customerName }}</span>
                        <span class="text-muted">{{ b.invoices?.length || 0 }} invoice aktif</span>
                      </div>
                      <table class="table table-sm table-bordered mb-0 small">
                        <thead class="table-light">
                          <tr>
                            <th>No. Invoice</th>
                            <th>Tgl Invoice</th>
                            <th>Jatuh Tempo</th>
                            <th>Status</th>
                            <th class="text-end">Total</th>
                            <th class="text-end">Sisa Tagihan</th>
                            <th class="text-end">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let inv of b.invoices">
                            <td class="v3-mono fw-bold">{{ inv.invoiceNumber }}</td>
                            <td class="v3-mono">{{ inv.issueDate }}</td>
                            <td class="v3-mono" [class.text-danger]="inv.status === 'Overdue'">{{ inv.dueDate }}</td>
                            <td>
                              <span class="badge" [ngClass]="{
                                'bg-primary-subtle text-primary border border-primary-subtle': inv.status === 'Issued',
                                'bg-warning-subtle text-warning border border-warning-subtle': inv.status === 'Partially Paid',
                                'bg-danger-subtle text-danger border border-danger-subtle': inv.status === 'Overdue'
                              }">{{ inv.status }}</span>
                            </td>
                            <td class="text-end v3-mono">{{ inv.total | rupiah }}</td>
                            <td class="text-end v3-mono fw-bold text-danger">{{ inv.balanceDue | rupiah }}</td>
                            <td class="text-end">
                              <button type="button" class="btn btn-sm btn-outline-primary py-0 px-2"
                                style="font-size: 0.72rem;" (click)="viewInvoice(inv)">
                                Buka
                              </button>
                            </td>
                          </tr>
                          <tr *ngIf="!b.invoices || b.invoices.length === 0">
                            <td colspan="7" class="text-center py-2 text-muted">Tidak ada rincian invoice terbuka.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </ng-container>

              <tr *ngIf="filteredBuckets().length === 0">
                <td colspan="8" class="text-center py-5 text-muted">
                  Tidak ada data piutang berjalan pada tanggal acuan ini.
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-light fw-bold border-top">
              <tr>
                <td></td>
                <td>TOTAL SELURUH PIUTANG</td>
                <td class="text-end v3-mono text-success">{{ agingRawData().grandTotal.current | rupiah }}</td>
                <td class="text-end v3-mono text-primary">{{ agingRawData().grandTotal.days1_30 | rupiah }}</td>
                <td class="text-end v3-mono text-warning">{{ agingRawData().grandTotal.days31_60 | rupiah }}</td>
                <td class="text-end v3-mono text-danger">{{ agingRawData().grandTotal.days61_90 | rupiah }}</td>
                <td class="text-end v3-mono text-danger">{{ agingRawData().grandTotal.days90Plus | rupiah }}</td>
                <td class="text-end v3-mono fs-5 text-dark">{{ agingRawData().grandTotal.totalOutstanding | rupiah }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AgingReportComponent {
  readonly arService = inject(ArDataService);
  readonly navService = inject(NavigationService);

  agingAsOfDate = signal<string>(this.arService.today);
  agingCustomerSearch = signal<string>('');
  agingRiskFilter = signal<'ALL' | 'OVERDUE_ONLY' | 'CRITICAL_ONLY' | 'CURRENT_ONLY'>('ALL');
  agingSortBy = signal<'total_desc' | 'critical_desc' | 'name_asc'>('total_desc');
  expandedCustomerAgingId = signal<string | null>(null);

  agingRawData = computed(() => {
    return this.arService.getAgingReport(this.agingAsOfDate());
  });

  hasActiveAgingFilters = computed(() => {
    return (
      this.agingCustomerSearch().trim() !== '' ||
      this.agingRiskFilter() !== 'ALL' ||
      this.agingSortBy() !== 'total_desc'
    );
  });

  filteredBuckets = computed(() => {
    let list = this.agingRawData().buckets;
    const q = this.agingCustomerSearch().toLowerCase().trim();
    if (q) {
      list = list.filter(b => b.customerName.toLowerCase().includes(q) || b.customerCode.toLowerCase().includes(q));
    }
    const risk = this.agingRiskFilter();
    if (risk === 'OVERDUE_ONLY') {
      list = list.filter(b => (b.days1_30 + b.days31_60 + b.days61_90 + b.days90Plus) > 0);
    } else if (risk === 'CRITICAL_ONLY') {
      list = list.filter(b => (b.days61_90 + b.days90Plus) > 0);
    } else if (risk === 'CURRENT_ONLY') {
      list = list.filter(b => b.current > 0 && (b.days1_30 + b.days31_60 + b.days61_90 + b.days90Plus) === 0);
    }

    const sort = this.agingSortBy();
    return list.sort((a, b) => {
      if (sort === 'total_desc') return b.totalOutstanding - a.totalOutstanding;
      if (sort === 'critical_desc') return (b.days61_90 + b.days90Plus) - (a.days61_90 + a.days90Plus);
      if (sort === 'name_asc') return a.customerName.localeCompare(b.customerName);
      return 0;
    });
  });

  resetAgingFilters() {
    this.agingCustomerSearch.set('');
    this.agingRiskFilter.set('ALL');
    this.agingSortBy.set('total_desc');
  }

  toggleAgingRow(customerId: string) {
    this.expandedCustomerAgingId.update(curr => (curr === customerId ? null : customerId));
  }

  viewInvoice(inv: Invoice) {
    this.navService.navigateTo('invoice-detail', { invoice: inv });
  }
}
