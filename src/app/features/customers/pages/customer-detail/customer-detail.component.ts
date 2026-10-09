import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from '../../../../core/services/ar-data.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { RupiahPipe } from '../../../../shared/pipes/rupiah.pipe';
import { Customer, Invoice, Payment } from '../../../../core/models/ar.models';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe],
  template: `
    <div *ngIf="customer() as cust" class="d-flex flex-column gap-3">
      <div class="d-flex align-items-center justify-content-between">
        <button type="button" class="v3-btn-secondary" (click)="navService.navigateTo('customers')">
          &larr; Kembali ke Data Pelanggan
        </button>
        <div class="d-flex gap-2">
          <button type="button" class="v3-btn-primary" [disabled]="isViewer" (click)="startCreateInvoice(cust.id)">
            + Buat Invoice
          </button>
        </div>
      </div>

      <!-- Customer Summary Card -->
      <div class="v3-card p-4">
        <div class="row g-3 align-items-center">
          <div class="col-12 col-md-7">
            <div class="d-flex align-items-center gap-2">
              <h2 class="fw-bold text-dark mb-0" style="font-size: 1.3rem;">{{ cust.name }}</h2>
              <span class="v3-badge" [ngClass]="cust.status === 'active' ? 'v3-badge-paid' : 'v3-badge-overdue'">
                {{ cust.status === 'active' ? 'Aktif' : 'Credit Hold' }}
              </span>
            </div>
            <div class="text-muted small mt-2">
              <span class="me-3">Kode: <strong class="v3-mono text-dark">{{ cust.code }}</strong></span>
              <span class="me-3">NIK: <strong class="v3-mono text-dark">{{ cust.nik || '-' }}</strong></span>
              <span class="me-3">NPWP: <strong class="v3-mono text-dark">{{ cust.npwp || '-' }}</strong></span>
              <span>Termin: Net {{ cust.dueDays }} hari</span>
            </div>
            <div class="text-muted small mt-1">
              Alamat: {{ cust.address }} &bull; Kontak: {{ cust.contactPerson }} ({{ cust.phone }}) &bull; Email: {{ cust.email }}
            </div>
          </div>

          <div class="col-12 col-md-5 text-md-end">
            <div class="d-inline-flex gap-4">
              <div>
                <div class="text-muted small">Sisa Piutang Berjalan</div>
                <div class="v3-mono fw-bold fs-4 text-danger">{{ arService.getCustomerBalance(cust.id) | rupiah }}</div>
              </div>
              <div>
                <div class="text-muted small">Batas Plafon Kredit</div>
                <div class="v3-mono fw-bold fs-4 text-dark">{{ cust.creditLimit | rupiah }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sub Tabs -->
      <div class="v3-tabs-bar">
        <button type="button" class="v3-tab-btn" [class.active]="activeTab() === 'invoices'"
          (click)="activeTab.set('invoices')">
          Riwayat Invoice ({{ customerInvoices().length }})
        </button>
        <button type="button" class="v3-tab-btn" [class.active]="activeTab() === 'payments'"
          (click)="activeTab.set('payments')">
          Riwayat Pembayaran ({{ customerPayments().length }})
        </button>
        <button type="button" class="v3-tab-btn" [class.active]="activeTab() === 'dp'"
          (click)="activeTab.set('dp')">
          Uang Muka / DP (Saldo: {{ (cust.dpBalance || 0) | rupiah }})
        </button>
      </div>

      <!-- Invoices Tab -->
      <div class="d-flex flex-column gap-2" *ngIf="activeTab() === 'invoices'">
        <div class="p-2 bg-white rounded border d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div class="d-flex flex-wrap align-items-center gap-2">
            <div style="min-width: 160px;">
              <select class="form-select form-select-sm" [ngModel]="custDetailInvoiceStatus()"
                (ngModelChange)="custDetailInvoiceStatus.set($event)">
                <option value="ALL">Semua Status Invoice</option>
                <option value="Draft">Draft</option>
                <option value="Issued">Issued</option>
                <option value="Partially Paid">Sebagian Dibayar</option>
                <option value="Overdue">Overdue (Jatuh Tempo)</option>
                <option value="Paid">Lunas (Paid)</option>
                <option value="Cancelled">Dibatalkan</option>
              </select>
            </div>
          </div>

          <div class="text-muted small">
            Menampilkan <strong class="text-dark">{{ filteredCustomerInvoices().length }}</strong> dari {{ customerInvoices().length }} invoice
          </div>
        </div>

        <div class="v3-card">
          <div class="v3-table-container">
            <table class="v3-table">
              <thead>
                <tr>
                  <th>No. Invoice</th>
                  <th>Tgl Terbit</th>
                  <th>Jatuh Tempo</th>
                  <th>Jenis Tagihan</th>
                  <th class="text-end">Total</th>
                  <th class="text-end">Dibayar</th>
                  <th class="text-end">Sisa Tagihan</th>
                  <th>Status</th>
                  <th class="text-end">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let inv of filteredCustomerInvoices()">
                  <td class="v3-mono fw-bold">
                    <a href="javascript:void(0)" class="text-primary text-decoration-none" (click)="viewInvoice(inv)">
                      {{ inv.invoiceNumber }}
                    </a>
                  </td>
                  <td class="v3-mono text-muted">{{ inv.issueDate }}</td>
                  <td class="v3-mono" [class.text-danger]="inv.status === 'Overdue'">{{ inv.dueDate }}</td>
                  <td class="small">{{ inv.invoiceType }}</td>
                  <td class="text-end v3-mono">{{ inv.total | rupiah }}</td>
                  <td class="text-end v3-mono text-muted">{{ inv.amountPaid | rupiah }}</td>
                  <td class="text-end v3-mono fw-bold" [class.text-danger]="inv.balanceDue > 0">
                    {{ inv.balanceDue | rupiah }}
                  </td>
                  <td>
                    <span class="v3-badge" [ngClass]="{
                      'v3-badge-draft': inv.status === 'Draft',
                      'v3-badge-issued': inv.status === 'Issued',
                      'v3-badge-partial': inv.status === 'Partially Paid',
                      'v3-badge-paid': inv.status === 'Paid',
                      'v3-badge-overdue': inv.status === 'Overdue',
                      'v3-badge-cancelled': inv.status === 'Cancelled'
                    }">{{ inv.status }}</span>
                  </td>
                  <td class="text-end">
                    <button type="button" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.72rem;"
                      (click)="viewInvoice(inv)">
                      Detail
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredCustomerInvoices().length === 0">
                  <td colspan="9" class="text-center py-4 text-muted">
                    {{ customerInvoices().length === 0 ? 'Belum ada invoice yang diterbitkan untuk pelanggan ini.' : 'Tidak ada invoice yang cocok dengan filter.' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Payments Tab -->
      <div class="v3-card" *ngIf="activeTab() === 'payments'">
        <div class="v3-table-container">
          <table class="v3-table">
            <thead>
              <tr>
                <th>No. Kuitansi</th>
                <th>Tanggal</th>
                <th>Metode & Kanal</th>
                <th>Referensi</th>
                <th class="text-end">Nominal</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let pay of customerPayments()">
                <td class="v3-mono fw-bold text-success">{{ pay.paymentNumber }}</td>
                <td class="v3-mono text-muted">{{ pay.paymentDate }}</td>
                <td>
                  <span class="text-capitalize fw-medium">{{ pay.method.replace('_', ' ') }}</span>
                  <small class="d-block text-muted">{{ pay.paymentChannel }}</small>
                </td>
                <td class="v3-mono text-muted">{{ pay.referenceNumber }}</td>
                <td class="text-end v3-mono fw-bold text-success">{{ pay.amount | rupiah }}</td>
              </tr>
              <tr *ngIf="customerPayments().length === 0">
                <td colspan="5" class="text-center py-4 text-muted">Belum ada pembayaran yang dicatat untuk pelanggan ini.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- DP Tab -->
      <div class="v3-card p-3" *ngIf="activeTab() === 'dp'">
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3 border-bottom pb-2">
          <div>
            <div class="fw-bold fs-6 text-dark">Buku Pembantu Uang Muka (DP): {{ cust.name }}</div>
            <div class="text-secondary small">Riwayat setoran deposit dan pemotongan invoice pelanggan ini.</div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small">Saldo DP Aktif:</span>
            <strong class="v3-mono fs-5 text-success">{{ (cust.dpBalance || 0) | rupiah }}</strong>
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
              <tr *ngFor="let t of arService.getCustomerDpTransactions(cust.id)">
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
              <tr *ngIf="arService.getCustomerDpTransactions(cust.id).length === 0">
                <td colspan="5" class="text-center py-4 text-muted">
                  Belum ada riwayat mutasi uang muka untuk pelanggan ini.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class CustomerDetailComponent {
  readonly arService = inject(ArDataService);
  readonly navService = inject(NavigationService);

  activeTab = signal<'invoices' | 'payments' | 'dp'>('invoices');
  custDetailInvoiceStatus = signal<string>('ALL');

  customer = computed(() => {
    return this.navService.selectedCustomer() || this.arService.customers()[0] || null;
  });

  customerInvoices = computed(() => {
    const cust = this.customer();
    if (!cust) return [];
    return this.arService.invoices().filter(i => i.customerId === cust.id);
  });

  filteredCustomerInvoices = computed(() => {
    let list = this.customerInvoices();
    const st = this.custDetailInvoiceStatus();
    if (st !== 'ALL') {
      list = list.filter(i => i.status === st);
    }
    return list;
  });

  customerPayments = computed(() => {
    const cust = this.customer();
    if (!cust) return [];
    return this.arService.payments().filter(p => p.customerId === cust.id);
  });

  get isViewer(): boolean {
    return this.arService.currentUser().role === 'Viewer';
  }

  viewInvoice(inv: Invoice) {
    this.navService.navigateTo('invoice-detail', { invoice: inv });
  }

  startCreateInvoice(customerId: string) {
    this.navService.navigateTo('invoice-create');
  }
}
