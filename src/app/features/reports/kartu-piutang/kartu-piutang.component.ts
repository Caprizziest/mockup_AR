import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from '../../../core/services/ar-data.service';
import { RupiahPipe } from '../../../shared/pipes/rupiah.pipe';
import { KartuPiutangRow } from '../../../core/models/ar.models';

@Component({
  selector: 'app-kartu-piutang',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe],
  template: `
    <div class="d-flex flex-column gap-3">
      <div class="v3-card p-3">
        <!-- Filter Ribbon -->
        <div class="row g-3 mb-3">
          <div class="col-6 col-md-3">
            <label class="form-label small fw-semibold text-secondary mb-1">Tanggal Awal</label>
            <input type="date" class="form-control form-control-sm v3-mono"
              [ngModel]="kartuStartDate()"
              (ngModelChange)="kartuStartDate.set($event)">
          </div>
          <div class="col-6 col-md-3">
            <label class="form-label small fw-semibold text-secondary mb-1">Tanggal Akhir</label>
            <input type="date" class="form-control form-control-sm v3-mono"
              [ngModel]="kartuEndDate()"
              (ngModelChange)="kartuEndDate.set($event)">
          </div>
          <div class="col-12 col-md-3">
            <label class="form-label small fw-semibold text-secondary mb-1">Pilih Perusahaan</label>
            <select class="form-select form-select-sm"
              [ngModel]="kartuSelectedPerusahaan()"
              (ngModelChange)="kartuSelectedPerusahaan.set($event)">
              <option value="PT. SINAR GALESONG PRATAMA">PT. SINAR GALESONG PRATAMA</option>
              <option value="PT. SINAR GALESONG AUTO">PT. SINAR GALESONG AUTO</option>
              <option value="PT. GALESONG PRATAMA HOTEL">PT. GALESONG PRATAMA HOTEL</option>
            </select>
          </div>
          <div class="col-12 col-md-3">
            <label class="form-label small fw-semibold text-secondary mb-1">Pilih Pelanggan</label>
            <div class="d-flex gap-2">
              <select class="form-select form-select-sm"
                [ngModel]="kartuSelectedCustomerId()"
                (ngModelChange)="kartuSelectedCustomerId.set($event)">
                <option *ngFor="let c of arService.customers()" [value]="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Title & Subtitle -->
        <div class="border-top pt-3 mb-2">
          <h3 class="fw-bold text-dark mb-0 fs-5 text-uppercase">
            {{ selectedKartuCustomer()?.name || 'PT. SINAR GALESONG MANDIRI' }}
          </h3>
          <div class="text-secondary small mt-0.5">
            Periode: <span class="v3-mono text-dark fw-medium">{{ kartuStartDate() }}</span> s/d <span class="v3-mono text-dark fw-medium">{{ kartuEndDate() }}</span>
          </div>
        </div>

        <!-- Balanced T-Account Matching Table -->
        <div class="v3-table-container overflow-auto border rounded">
          <table class="table table-sm table-bordered mb-0 small" style="min-width: 1400px; font-size: 0.73rem;">
            <thead>
              <tr class="text-center text-white fw-bold">
                <th colspan="12" style="background-color: #16a34a; letter-spacing: 0.05em; font-size: 0.82rem; padding: 6px;">
                  PIUTANG
                </th>
                <th colspan="10" style="background-color: #ef4444; letter-spacing: 0.05em; font-size: 0.82rem; padding: 6px;">
                  DENDA
                </th>
              </tr>
              <tr class="text-center fw-semibold" style="background-color: #f1f5f9;">
                <th colspan="6" class="border-end" style="background-color: #ecfdf5; color: #065f46;">
                  Penagihan Piutang
                </th>
                <th colspan="6" class="border-end" style="background-color: #ecfdf5; color: #065f46;">
                  Pembayaran Piutang
                </th>
                <th colspan="5" class="border-end" style="background-color: #fef2f2; color: #991b1b;">
                  Pembayaran Denda
                </th>
                <th colspan="5" style="background-color: #fef2f2; color: #991b1b;">
                  Penghapusan Denda
                </th>
              </tr>
              <tr class="text-center text-nowrap" style="background-color: #f8fafc;">
                <!-- Penagihan Piutang -->
                <th style="width: 80px;">Tgl Terbit</th>
                <th style="width: 130px;">No Invoice</th>
                <th style="width: 100px;">No Bukti Jurnal</th>
                <th>Keterangan</th>
                <th style="width: 95px;" class="text-end">Nominal</th>
                <th style="width: 80px;">Tgl Jatuh Tempo</th>

                <!-- Pembayaran Piutang -->
                <th style="width: 80px;">Tgl Bayar</th>
                <th style="width: 100px;">No Bukti Jurnal</th>
                <th>Keterangan</th>
                <th style="width: 95px;" class="text-end">Nominal</th>
                <th style="width: 60px;" class="text-end">Diskon</th>
                <th style="width: 95px;" class="text-end">Saldo</th>

                <!-- Pembayaran Denda -->
                <th style="width: 80px;" class="text-end">Nominal Denda</th>
                <th style="width: 75px;">Tgl Bayar</th>
                <th style="width: 90px;">No Bukti Jurnal</th>
                <th>Keterangan</th>
                <th style="width: 80px;" class="text-end">Nominal</th>

                <!-- Penghapusan Denda -->
                <th style="width: 75px;">Tgl Hapus</th>
                <th style="width: 80px;">Memo</th>
                <th>Keterangan</th>
                <th style="width: 80px;" class="text-end">Nominal</th>
                <th style="width: 80px;" class="text-end">Saldo Denda</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of kartuRows()" class="align-middle text-nowrap">
                <!-- Penagihan Piutang -->
                <td class="v3-mono text-center">{{ row.tglTerbit }}</td>
                <td class="v3-mono fw-bold text-primary">{{ row.noInvoice }}</td>
                <td class="v3-mono text-secondary small">{{ row.noBuktiJurnalDebet }}</td>
                <td class="text-truncate" style="max-width: 160px;" [title]="row.keteranganDebet || ''">{{ row.keteranganDebet }}</td>
                <td class="text-end v3-mono fw-semibold">{{ (row.nominalDebet || 0) | rupiah }}</td>
                <td class="v3-mono text-center text-muted">{{ row.tglJatuhTempo || '-' }}</td>

                <!-- Pembayaran Piutang -->
                <td class="v3-mono text-center">{{ row.tglBayar }}</td>
                <td class="v3-mono text-secondary small">{{ row.noBuktiJurnalKredit }}</td>
                <td class="text-truncate" style="max-width: 180px;" [title]="row.keteranganKredit || ''">{{ row.keteranganKredit }}</td>
                <td class="text-end v3-mono fw-semibold text-success">{{ (row.nominalKredit || 0) | rupiah }}</td>
                <td class="text-end v3-mono text-muted">{{ (row.diskon || 0) | rupiah }}</td>
                <td class="text-end v3-mono fw-bold" [class.text-danger]="(row.saldoPiutang || 0) > 0">
                  {{ (row.saldoPiutang || 0) | rupiah }}
                </td>

                <!-- Pembayaran Denda -->
                <td class="text-end v3-mono text-danger">{{ (row.nominalDenda || 0) | rupiah }}</td>
                <td class="text-center text-muted">{{ row.tglBayarDenda || '-' }}</td>
                <td class="text-center text-muted">{{ row.noBuktiJurnalDenda || '-' }}</td>
                <td class="text-muted">{{ row.keteranganDenda || '-' }}</td>
                <td class="text-end v3-mono">{{ (row.nominalBayarDenda || 0) | rupiah }}</td>

                <!-- Penghapusan Denda -->
                <td class="text-center text-muted">{{ row.tglHapusDenda || '-' }}</td>
                <td class="text-center text-muted">{{ row.memoHapusDenda || '-' }}</td>
                <td class="text-muted">{{ row.keteranganHapusDenda || '-' }}</td>
                <td class="text-end v3-mono">{{ (row.nominalHapusDenda || 0) | rupiah }}</td>
                <td class="text-end v3-mono fw-semibold">{{ (row.saldoDenda || 0) | rupiah }}</td>
              </tr>
              <tr *ngIf="kartuRows().length === 0">
                <td colspan="22" class="text-center py-4 text-muted">
                  Tidak ada transaksi kartu piutang untuk pelanggan ini pada periode terpilih.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class KartuPiutangComponent {
  readonly arService = inject(ArDataService);

  kartuStartDate = signal<string>('2026-08-01');
  kartuEndDate = signal<string>('2026-09-30');
  kartuSelectedPerusahaan = signal<string>('PT. SINAR GALESONG PRATAMA');
  kartuSelectedCustomerId = signal<string>('cust-1');

  selectedKartuCustomer = computed(() => {
    return this.arService.customers().find(c => c.id === this.kartuSelectedCustomerId()) || null;
  });

  kartuRows = computed(() => {
    const custId = this.kartuSelectedCustomerId();
    if (!custId) return [];
    return this.arService.getKartuPiutang(custId, this.kartuStartDate(), this.kartuEndDate());
  });
}
