import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArDataService } from '../../../../core/services/ar-data.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { RupiahPipe } from '../../../../shared/pipes/rupiah.pipe';
import { Invoice, Customer, Payment } from '../../../../core/models/ar.models';
import { CancelInvoiceModalComponent } from '../../components/cancel-invoice-modal/cancel-invoice-modal.component';
import { ConfirmDialogComponent, DeleteModalState } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RupiahPipe, CancelInvoiceModalComponent, ConfirmDialogComponent],
  template: `
    <div *ngIf="invoice() as inv" class="d-flex flex-column gap-3">
      <!-- Back Button & Action Toolbar -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <button type="button" class="v3-btn-secondary" (click)="navService.navigateTo('invoices')">
          &larr; Kembali ke Daftar Invoice
        </button>

        <div class="d-flex align-items-center gap-2">
          <button type="button" class="v3-btn-secondary" (click)="printInvoice()">
            Cetak / Export PDF
          </button>

          <!-- Issue Draft Button -->
          <button type="button" class="btn btn-sm btn-success" *ngIf="inv.status === 'Draft'" [disabled]="isViewer"
            (click)="issueDraftInvoice(inv)">
            Terbitkan Invoice Resmi
          </button>

          <!-- Delete Draft Button -->
          <button type="button" class="btn btn-sm btn-outline-danger" *ngIf="inv.status === 'Draft'"
            [disabled]="isViewer" (click)="requestDeleteInvoice(inv)">
            Hapus Draft
          </button>

          <!-- Cancel Button -->
          <button type="button" class="v3-btn-danger-outline"
            *ngIf="inv.status !== 'Draft' && inv.status !== 'Cancelled' && inv.amountPaid === 0" [disabled]="isViewer"
            (click)="openCancelInvoiceModal(inv)">
            Batalkan Invoice
          </button>
        </div>
      </div>

      <!-- Cancellation Banner if Cancelled -->
      <div class="alert alert-dark border-secondary d-flex align-items-start gap-3"
        *ngIf="inv.status === 'Cancelled'">
        <div>
          <strong class="d-block text-danger">INVOICE TELAH DIBATALKAN (CANCELLED)</strong>
          <div class="small text-muted mt-1">
            Dibatalkan pada: <strong>{{ inv.cancelledAt }}</strong> oleh <strong>{{ inv.cancelledBy || 'Manager' }}</strong>
          </div>
          <div class="small mt-1">
            <strong>Alasan Pembatalan:</strong> "{{ inv.cancellationReason || 'Pembatalan transaksi administrasi' }}"
          </div>
        </div>
      </div>

      <!-- Invoice Title Banner & Metadata -->
      <div class="v3-card p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <div class="d-flex align-items-center gap-2">
            <h2 class="v3-mono fw-bold mb-0" style="font-size: 1.35rem;">{{ inv.invoiceNumber }}</h2>
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
            <span class="badge bg-light text-dark border">{{ inv.invoiceType }}</span>
          </div>
          <div class="text-muted small mt-1">
            Tanggal Terbit: <span class="v3-mono text-dark fw-medium">{{ inv.issueDate }}</span> &bull;
            Jatuh Tempo: <span class="v3-mono fw-medium" [class.text-danger]="inv.status === 'Overdue'">{{ inv.dueDate }}</span>
            <span *ngIf="inv.status === 'Overdue'" class="text-danger fw-bold ms-1">(Terlambat {{ getDaysPastDue(inv.dueDate) }} hari)</span>
            &bull; Pembuat: {{ inv.createdByName || 'Staf AR' }}
          </div>
        </div>

        <div class="text-end">
          <div class="text-muted small">Sisa Tagihan</div>
          <div class="v3-mono fw-bold fs-3" [class.text-danger]="inv.balanceDue > 0"
            [class.text-success]="inv.balanceDue === 0">
            {{ inv.balanceDue | rupiah }}
          </div>
        </div>
      </div>

      <!-- 2-Column Detail Layout -->
      <div class="row g-4">
        <!-- Left: Customer Bill-To & Line Items -->
        <div class="col-12 col-xl-8">
          <div class="d-flex flex-column gap-3">
            <!-- Customer Billing Info -->
            <div class="v3-card p-3">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <span class="text-muted small text-uppercase fw-semibold">Ditagihkan Kepada</span>
                  <h4 class="fw-bold text-dark mt-1 mb-1" style="font-size: 1.1rem;">{{ inv.customerName }}</h4>
                  <div class="text-muted small">
                    <span class="me-3">NIK: <strong class="v3-mono text-dark">{{ inv.customerNik || '-' }}</strong></span>
                    <span>NPWP: <strong class="v3-mono text-dark">{{ inv.customerNpwp || '-' }}</strong></span>
                  </div>
                  <div class="text-muted small mt-1" *ngIf="arService.getCustomer(inv.customerId) as cust">
                    Alamat: {{ cust.address }} &bull; Kontak: {{ cust.contactPerson }} ({{ cust.phone }})
                  </div>
                </div>
                <button type="button" class="btn btn-sm btn-link text-decoration-none p-0"
                  *ngIf="arService.getCustomer(inv.customerId) as cust" (click)="viewCustomer(cust)">
                  Profil Pelanggan &rarr;
                </button>
              </div>
            </div>

            <!-- Line Items Table -->
            <div class="v3-card">
              <div class="v3-card-header">
                <h3 class="v3-card-title">Rincian Item</h3>
                <span class="text-muted small">{{ inv.lineItems.length }} item</span>
              </div>
              <div class="v3-table-container">
                <table class="v3-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Deskripsi</th>
                      <th>Kategori</th>
                      <th class="text-end">Qty</th>
                      <th class="text-end">Harga Satuan</th>
                      <th class="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of inv.lineItems; let idx = index">
                      <td class="text-muted">{{ idx + 1 }}</td>
                      <td class="fw-medium">{{ item.description }}</td>
                      <td>
                        <span class="badge bg-light text-secondary border" style="font-size: 0.7rem;">
                          {{ item.itemType || 'Service' }}
                        </span>
                      </td>
                      <td class="text-end v3-mono">{{ item.quantity }}</td>
                      <td class="text-end v3-mono text-muted">{{ item.unitPrice | rupiah }}</td>
                      <td class="text-end v3-mono fw-semibold">{{ item.lineTotal | rupiah }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="p-3 bg-light border-top text-muted small" *ngIf="inv.notes">
                <strong>Catatan:</strong> {{ inv.notes }}
              </div>
            </div>

            <!-- Payment Receipts Allocation History -->
            <div class="v3-card" *ngIf="paymentsForInvoice().length > 0">
              <div class="v3-card-header">
                <h3 class="v3-card-title text-success">Riwayat Pembayaran</h3>
                <span class="text-muted small">{{ paymentsForInvoice().length }} transaksi</span>
              </div>
              <div class="v3-table-container">
                <table class="v3-table">
                  <thead>
                    <tr>
                      <th>No. Kuitansi</th>
                      <th>Tanggal Bayar</th>
                      <th>Metode & Kanal</th>
                      <th>No. Referensi</th>
                      <th class="text-end">Nominal Diterapkan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let p of paymentsForInvoice()">
                      <td class="fw-bold v3-mono text-success">{{ p.paymentNumber }}</td>
                      <td class="v3-mono text-muted">{{ p.paymentDate }}</td>
                      <td>
                        <span class="text-capitalize fw-medium">{{ p.method.replace('_', ' ') }}</span>
                        <small class="d-block text-muted">{{ p.paymentChannel }}</small>
                      </td>
                      <td class="v3-mono text-muted">{{ p.referenceNumber }}</td>
                      <td class="text-end v3-mono fw-bold text-success">{{ p.amount | rupiah }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Financial Breakdown Card -->
        <div class="col-12 col-xl-4">
          <div class="v3-card p-3">
            <h3 class="v3-card-title mb-3">Ringkasan Nilai & Pajak</h3>

            <div class="d-flex flex-column gap-2 border-bottom pb-3">
              <div class="d-flex justify-content-between text-muted" style="font-size: 0.82rem;">
                <span>Subtotal Item</span>
                <span class="v3-mono text-dark">{{ inv.subtotal | rupiah }}</span>
              </div>
              <div class="d-flex justify-content-between text-muted" style="font-size: 0.82rem;">
                <span>PPN ({{ inv.taxRate }}%)</span>
                <span class="v3-mono text-dark">+ {{ inv.taxAmount | rupiah }}</span>
              </div>
              <div class="d-flex justify-content-between text-muted" style="font-size: 0.82rem;">
                <span>PPh 23 Dipotong ({{ inv.pphRate }}%)</span>
                <span class="v3-mono text-danger">- {{ inv.pphAmount | rupiah }}</span>
              </div>
              <div class="d-flex justify-content-between text-muted" style="font-size: 0.82rem;">
                <span>Potongan Uang Muka (DP)</span>
                <span class="v3-mono text-danger">- {{ inv.dpDeduction | rupiah }}</span>
              </div>
              <div class="d-flex justify-content-between fw-bold text-dark pt-2 border-top" style="font-size: 0.95rem;">
                <span>Total Tagihan Bersih</span>
                <span class="v3-mono text-primary">{{ inv.total | rupiah }}</span>
              </div>
            </div>

            <div class="d-flex flex-column gap-2 pt-3">
              <div class="d-flex justify-content-between text-muted" style="font-size: 0.82rem;">
                <span>Total Telah Dibayar</span>
                <span class="v3-mono text-success">- {{ inv.amountPaid | rupiah }}</span>
              </div>

              <div class="p-3 rounded mt-2 text-center"
                [ngClass]="inv.balanceDue > 0 ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-success-subtle text-success border border-success-subtle'">
                <div class="small fw-semibold text-uppercase" style="letter-spacing: 0.05em;">Sisa Tagihan (Balance Due)</div>
                <div class="v3-mono fw-bold fs-3 mt-1">{{ inv.balanceDue | rupiah }}</div>
                <div class="small mt-1" *ngIf="inv.balanceDue === 0">Lunas &bull; Saldo Nol</div>
                <div class="small mt-1" *ngIf="inv.balanceDue > 0">Piutang Belum Dilunasi</div>
              </div>
            </div>
          </div>
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
export class InvoiceDetailComponent {
  readonly arService = inject(ArDataService);
  readonly navService = inject(NavigationService);

  showCancelModal = signal<boolean>(false);
  cancelInvoiceTarget = signal<Invoice | null>(null);

  showDeleteModal = signal<boolean>(false);
  deleteState = signal<DeleteModalState | null>(null);

  invoice = computed(() => {
    return this.navService.selectedInvoice() || this.arService.invoices()[0] || null;
  });

  get isViewer(): boolean {
    return this.arService.currentUser().role === 'Viewer';
  }

  paymentsForInvoice = computed(() => {
    const inv = this.invoice();
    if (!inv) return [];
    return this.arService.payments().filter(p => p.allocations && p.allocations.some(a => a.invoiceId === inv.id));
  });

  getDaysPastDue(dueDateStr: string): number {
    const dueTime = new Date(dueDateStr).getTime();
    const todayTime = new Date(this.arService.today).getTime();
    const diff = Math.floor((todayTime - dueTime) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  viewCustomer(cust: Customer) {
    this.navService.navigateTo('customer-detail', { customer: cust });
  }

  printInvoice() {
    window.print();
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
    this.navService.navigateTo('invoices');
  }
}
