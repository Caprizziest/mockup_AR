import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from '../../../core/services/ar-data.service';
import { RupiahPipe } from '../../../shared/pipes/rupiah.pipe';
import { MutasiTransactionDetail, MutasiCustomerSummary } from '../../../core/models/ar.models';

@Component({
  selector: 'app-mutasi-piutang',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe],
  template: `
    <div class="d-flex flex-column gap-3">
      <div class="v3-card p-3">
        <h2 class="h5 fw-bold text-dark mb-3 text-uppercase" style="letter-spacing: 0.03em;">
          Laporan Mutasi Piutang
        </h2>

        <!-- Date Filters & Global Search bar -->
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
          <div class="d-flex flex-wrap align-items-center gap-2">
            <span class="small fw-semibold text-secondary">Pilih Tanggal:</span>
            <div class="d-flex align-items-center gap-1">
              <input type="date" class="form-control form-control-sm v3-mono"
                style="width: 145px;"
                [ngModel]="mutasiStartDate()"
                (ngModelChange)="mutasiStartDate.set($event)">
              <span class="small text-muted">s.d.</span>
              <input type="date" class="form-control form-control-sm v3-mono"
                style="width: 145px;"
                [ngModel]="mutasiEndDate()"
                (ngModelChange)="mutasiEndDate.set($event)">
            </div>
          </div>

          <div style="min-width: 260px;">
            <div class="input-group input-group-sm">
              <input type="text" class="form-control" placeholder="Cari transaksi mutasi..."
                [ngModel]="mutasiSearchQuery()"
                (ngModelChange)="mutasiSearchQuery.set($event)">
              <span class="input-group-text bg-white text-muted"><i class="bi bi-search"></i></span>
            </div>
          </div>
        </div>

        <!-- Main Table -->
        <div class="v3-table-container">
          <table class="v3-table mb-0">
            <thead class="table-dark">
              <tr>
                <th style="width: 50px;" class="text-center">No</th>
                <th>Nama</th>
                <th style="width: 140px;" class="text-center">Jumlah Piutang</th>
                <th style="width: 180px;" class="text-end">Total Piutang</th>
                <th style="width: 180px;" class="text-end">Piutang Dibayar</th>
                <th style="width: 180px;" class="text-end">Saldo</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of filteredMutasiList(); let idx = index"
                class="cursor-pointer v3-row-hover align-middle"
                (click)="openDetailMutasi(m.customerId)"
                title="Klik untuk membuka Detail Mutasi Piutang {{ m.customerName }}">
                <td class="text-center text-muted small">{{ idx + 1 }}</td>
                <td class="fw-bold text-dark text-primary-hover">
                  {{ m.customerName }}
                </td>
                <td class="text-center v3-mono">{{ m.transactionCount }}</td>
                <td class="text-end v3-mono">{{ m.totalPiutang | rupiah }}</td>
                <td class="text-end v3-mono">{{ m.piutangDibayar | rupiah }}</td>
                <td class="text-end v3-mono fw-semibold" [class.text-danger]="m.saldo > 0">
                  {{ m.saldo | rupiah }}
                </td>
              </tr>
              <tr *ngIf="filteredMutasiList().length === 0">
                <td colspan="6" class="text-center py-4 text-muted">
                  Tidak ada mutasi piutang pada rentang tanggal terpilih.
                </td>
              </tr>
            </tbody>
            <!-- Grand Total Footer -->
            <tfoot class="border-top-2">
              <tr class="fw-bold fs-6" style="background-color: #f8fafc;">
                <td colspan="3" class="text-end text-primary" style="letter-spacing: 0.02em;">
                  Grand Total:
                </td>
                <td class="text-end v3-mono text-primary">
                  {{ mutasiReportData().grandTotal.totalPiutang | rupiah }}
                </td>
                <td class="text-end v3-mono text-primary">
                  {{ mutasiReportData().grandTotal.piutangDibayar | rupiah }}
                </td>
                <td class="text-end v3-mono text-primary">
                  {{ mutasiReportData().grandTotal.saldo | rupiah }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="mt-2 text-muted small" style="font-size: 0.72rem;">
          <i class="bi bi-info-circle me-1"></i>Klik baris pelanggan mana pun untuk melihat kartu riwayat kronologis debit/kredit dan mencetak faktur atau kwitansi.
        </div>
      </div>
    </div>

    <!-- Modal Detail Mutasi Piutang -->
    <div class="v3-modal-backdrop" *ngIf="showDetailMutasiModal() && detailMutasiData() as mutasi">
      <div class="v3-modal v3-modal-xl">
        <div class="v3-modal-header py-2.5 px-3 border-bottom">
          <div>
            <div class="fw-bold fs-6 text-dark">
              Detail Mutasi Piutang: <span class="text-primary">{{ mutasi.customerName }}</span>
              <span class="text-muted small fw-normal ms-1">[{{ mutasi.customerCode }}]</span>
            </div>
            <div class="text-secondary small" style="font-size: 0.75rem;">
              Periode: <span class="v3-mono text-dark">{{ mutasiStartDate() }}</span> s.d. <span class="v3-mono text-dark">{{ mutasiEndDate() }}</span> &bull;
              Total Piutang: <span class="v3-mono text-primary fw-semibold">{{ mutasi.totalPiutang | rupiah }}</span> &bull;
              Terbayar: <span class="v3-mono text-success fw-semibold">{{ mutasi.totalTerbayar | rupiah }}</span> &bull;
              Saldo: <span class="v3-mono fw-bold" [class.text-danger]="mutasi.saldoAkhir > 0">{{ mutasi.saldoAkhir | rupiah }}</span>
            </div>
          </div>
          <button type="button" class="btn-close" (click)="closeDetailMutasi()"></button>
        </div>

        <div class="v3-modal-body p-2">
          <div class="v3-table-container border rounded" style="max-height: 520px; overflow-y: auto;">
            <table class="v3-table mb-0 align-middle table-sm" style="font-size: 0.78rem;">
              <thead class="table-light sticky-top">
                <tr>
                  <th style="width: 11%; padding: 6px 8px;">TGL</th>
                  <th style="width: 16%; padding: 6px 8px;">NO BUKTI</th>
                  <th style="width: 31%; padding: 6px 8px;">KETERANGAN TRANSAKSI</th>
                  <th style="width: 14%; text-align: right; padding: 6px 8px;">PIUTANG (RP)</th>
                  <th style="width: 14%; text-align: right; padding: 6px 8px;">TERBAYAR (RP)</th>
                  <th style="width: 14%; text-align: right; padding: 6px 8px;">SALDO (RP)</th>
                  <th style="width: 10%; text-align: center; padding: 6px 8px;">AKSI</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of mutasi.details" [ngClass]="item.type === 'payment' ? 'v3-mutasi-payment-row' : ''">
                  <td class="v3-mono text-muted small" style="padding: 5px 8px;">{{ item.tanggal }}</td>
                  <td style="padding: 5px 8px;">
                    <span class="v3-mono fw-bold text-dark">{{ item.type === 'invoice' ? item.noInvoice : item.noKwitansi }}</span>
                  </td>
                  <td style="padding: 5px 8px;">
                    <div class="text-truncate" style="max-width: 360px;" [title]="item.keterangan">
                      {{ item.keterangan }}
                    </div>
                  </td>
                  <td class="text-end v3-mono fw-semibold text-primary" style="padding: 5px 8px;">
                    {{ item.piutang > 0 ? (item.piutang | rupiah) : '-' }}
                  </td>
                  <td class="text-end v3-mono fw-bold text-success" style="padding: 5px 8px;">
                    {{ item.terbayar > 0 ? (item.terbayar | rupiah) : '-' }}
                  </td>
                  <td class="text-end v3-mono fw-bold text-dark" style="padding: 5px 8px;">
                    {{ item.saldo | rupiah }}
                  </td>
                  <td class="text-center" style="padding: 5px 8px;">
                    <button type="button" class="btn btn-sm btn-outline-secondary py-0.5 px-2 text-nowrap"
                      style="font-size: 0.7rem;"
                      (click)="printDoc(item)">
                      {{ item.type === 'invoice' ? 'Print Invoice' : 'Print Kwitansi' }}
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot class="table-light fw-bold">
                <tr>
                  <td colspan="3" class="text-uppercase text-end" style="padding: 6px 8px;">TOTAL MUTASI:</td>
                  <td class="text-end v3-mono text-primary" style="padding: 6px 8px;">{{ mutasi.totalPiutang | rupiah }}</td>
                  <td class="text-end v3-mono text-success" style="padding: 6px 8px;">{{ mutasi.totalTerbayar | rupiah }}</td>
                  <td class="text-end v3-mono text-dark" style="padding: 6px 8px;">{{ mutasi.saldoAkhir | rupiah }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="v3-modal-footer py-2 px-3">
          <button type="button" class="btn btn-sm btn-outline-secondary" (click)="closeDetailMutasi()">Tutup</button>
          <button type="button" class="btn btn-sm btn-primary" (click)="printWindow()">
            Cetak Mutasi Piutang
          </button>
        </div>
      </div>
    </div>
  `
})
export class MutasiPiutangComponent {
  readonly arService = inject(ArDataService);

  mutasiStartDate = signal<string>('2026-08-01');
  mutasiEndDate = signal<string>('2026-09-30');
  mutasiSearchQuery = signal<string>('');

  showDetailMutasiModal = signal<boolean>(false);
  selectedMutasiCustomerId = signal<string | null>(null);

  mutasiReportData = computed(() => {
    return this.arService.getMutasiPiutang(this.mutasiStartDate(), this.mutasiEndDate());
  });

  filteredMutasiList = computed(() => {
    const data = this.mutasiReportData().list;
    const q = this.mutasiSearchQuery().toLowerCase().trim();
    if (!q) return data;
    return data.filter((m: MutasiCustomerSummary) => m.customerName.toLowerCase().includes(q));
  });

  detailMutasiData = computed(() => {
    const custId = this.selectedMutasiCustomerId();
    if (!custId) return null;
    return this.arService.getDetailMutasiPiutang(custId, this.mutasiStartDate(), this.mutasiEndDate());
  });

  openDetailMutasi(customerId: string) {
    this.selectedMutasiCustomerId.set(customerId);
    this.showDetailMutasiModal.set(true);
  }

  closeDetailMutasi() {
    this.showDetailMutasiModal.set(false);
    this.selectedMutasiCustomerId.set(null);
  }

  printDoc(item: MutasiTransactionDetail) {
    window.print();
  }

  printWindow() {
    window.print();
  }
}
