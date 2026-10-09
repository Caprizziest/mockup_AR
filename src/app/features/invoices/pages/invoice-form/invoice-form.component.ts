import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from '../../../../core/services/ar-data.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { RupiahPipe } from '../../../../shared/pipes/rupiah.pipe';
import { LineItem, InstallmentItem, InvoiceStatus } from '../../../../core/models/ar.models';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe],
  template: `
    <div class="d-flex flex-column gap-3">
      <div class="d-flex align-items-center justify-content-between">
        <button type="button" class="v3-btn-secondary" (click)="navService.navigateTo('invoices')">
          &larr; Batal & Kembali
        </button>
        <div class="d-flex gap-2">
          <button type="button" class="v3-btn-secondary" (click)="saveInvoice('Draft')">
            Simpan sebagai Draft
          </button>
          <button type="button" class="v3-btn-primary" (click)="saveInvoice('Issued')">
            Simpan & Terbitkan Langsung
          </button>
        </div>
      </div>

      <div class="v3-card p-4">
        <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <h3 class="v3-card-title mb-0 fs-5">Buat Invoice Baru</h3>
        </div>

        <!-- Form Header -->
        <div class="row g-3 mb-4">
          <div class="col-12 col-md-5">
            <label class="form-label small fw-semibold">Pelanggan *</label>
            <select class="form-select form-select-sm" [ngModel]="formCustomerId()"
              (ngModelChange)="onCustomerSelected($event)">
              <option *ngFor="let c of arService.customers()" [value]="c.id">
                {{ c.name }} (Termin: {{ c.dueDays }} hari &bull; NPWP: {{ c.npwp }})
              </option>
            </select>
          </div>

          <div class="col-6 col-md-2">
            <label class="form-label small fw-semibold">Tanggal Invoice *</label>
            <input type="date" class="form-control form-control-sm" [ngModel]="formIssueDate()"
              (ngModelChange)="formIssueDate.set($event)">
          </div>

          <div class="col-6 col-md-2">
            <label class="form-label small fw-semibold">Tanggal Jatuh Tempo *</label>
            <input type="date" class="form-control form-control-sm" [ngModel]="formDueDate()"
              (ngModelChange)="formDueDate.set($event)">
          </div>

          <div class="col-12 col-md-3">
            <label class="form-label small fw-semibold">Tipe Tagihan</label>
            <select class="form-select form-select-sm" [ngModel]="formInvoiceType()"
              (ngModelChange)="formInvoiceType.set($event)">
              <option value="Banquet & Event Billing">Banquet & Event Billing</option>
              <option value="Room & Suites Accommodation">Room & Suites Accommodation</option>
              <option value="City Ledger Folio Transfer">City Ledger Folio Transfer</option>
              <option value="Corporate Catering Services">Corporate Catering Services</option>
              <option value="Meeting Room & Facility">Meeting Room & Facility</option>
            </select>
          </div>
        </div>

        <!-- Dynamic Line Items Table -->
        <div class="d-flex align-items-center justify-content-between mb-2">
          <label class="small fw-bold text-dark mb-0">Rincian Item</label>
          <button type="button" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.75rem;"
            (click)="addLineItem()">
            + Tambah Baris
          </button>
        </div>

        <div class="border rounded mb-3 overflow-hidden">
          <table class="v3-table mb-0">
            <thead>
              <tr>
                <th>Deskripsi *</th>
                <th style="width: 140px;">Kategori</th>
                <th style="width: 100px;">Qty</th>
                <th style="width: 180px;">Harga Satuan (Rp)</th>
                <th style="width: 180px;" class="text-end">Total</th>
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of lineItems(); let i = index">
                <td>
                  <input type="text" class="form-control form-control-sm"
                    placeholder="Ketik deskripsi item..." [(ngModel)]="item.description">
                </td>
                <td>
                  <select class="form-select form-select-sm" [(ngModel)]="item.itemType">
                    <option value="Banquet">Banquet</option>
                    <option value="Room">Room</option>
                    <option value="F&B">F&B</option>
                    <option value="Facility">Facility</option>
                    <option value="Service">Service</option>
                    <option value="Other">Other</option>
                  </select>
                </td>
                <td>
                  <input type="number" min="1" class="form-control form-control-sm v3-mono"
                    [(ngModel)]="item.quantity">
                </td>
                <td>
                  <input type="number" min="0" step="10000" class="form-control form-control-sm v3-mono"
                    [(ngModel)]="item.unitPrice">
                </td>
                <td class="text-end v3-mono fw-semibold">
                  {{ ((item.quantity || 0) * (item.unitPrice || 0)) | rupiah }}
                </td>
                <td class="text-center">
                  <button type="button" class="btn btn-sm text-danger p-0 fw-bold fs-5" (click)="removeLineItem(i)"
                    *ngIf="lineItems().length > 1" title="Hapus baris ini">
                    &times;
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bottom Totals & Notes -->
        <div class="row g-4 border-top pt-3">
          <div class="col-12 col-md-7">
            <label class="form-label small fw-semibold">Catatan</label>
            <textarea class="form-control form-control-sm" rows="4"
              placeholder="Instruksi transfer pembayaran, no referensi pesanan hotel..."
              [ngModel]="formNotes()" (ngModelChange)="formNotes.set($event)"></textarea>
          </div>

          <div class="col-12 col-md-5">
            <div class="p-3 bg-light rounded d-flex flex-column gap-2 border">
              <div class="d-flex justify-content-between text-muted small">
                <span>Subtotal Item</span>
                <span class="v3-mono text-dark fw-medium">{{ subtotal() | rupiah }}</span>
              </div>

              <div class="d-flex justify-content-between align-items-center text-muted small">
                <span>PPN / Pajak ({{ taxRate() }}%)</span>
                <span class="v3-mono text-dark">+ {{ taxAmount() | rupiah }}</span>
              </div>

              <div class="d-flex justify-content-between align-items-center text-muted small">
                <span>PPh 23 Dipotong ({{ pphRate() }}%)</span>
                <span class="v3-mono text-danger">- {{ pphAmount() | rupiah }}</span>
              </div>

              <div class="d-flex justify-content-between align-items-center text-muted small">
                <span>Potongan DP</span>
                <input type="number" min="0" step="100000" style="width: 140px;"
                  class="form-control form-control-sm text-end v3-mono py-0" [ngModel]="dpDeduction()"
                  (ngModelChange)="dpDeduction.set(+$event)">
              </div>

              <div class="d-flex justify-content-between fw-bold text-dark pt-2 border-top fs-5">
                <span>Total Tagihan</span>
                <span class="v3-mono text-primary">{{ totalCalculated() | rupiah }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InvoiceFormComponent {
  readonly arService = inject(ArDataService);
  readonly navService = inject(NavigationService);

  formCustomerId = signal<string>('cust-1');
  formIssueDate = signal<string>(this.arService.today);
  formDueDate = signal<string>('2026-10-16');
  formInvoiceType = signal<string>('Banquet & Event Billing');
  formNotes = signal<string>('Pembayaran melalui rekening BCA Hotel. Mohon cantumkan nomor faktur.');

  taxRate = signal<number>(11);
  pphRate = signal<number>(2);
  dpDeduction = signal<number>(0);

  lineItems = signal<LineItem[]>([
    { id: '1', description: 'Paket Wedding Grand Ballroom', itemType: 'Banquet', quantity: 1, unitPrice: 85000000, lineTotal: 85000000 },
    { id: '2', description: 'Executive Suite - 3 Malam', itemType: 'Room', quantity: 3, unitPrice: 2500000, lineTotal: 7500000 }
  ]);

  subtotal = computed(() => {
    return this.lineItems().reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  });

  taxAmount = computed(() => {
    return Math.round((this.subtotal() * this.taxRate()) / 100);
  });

  pphAmount = computed(() => {
    return Math.round((this.subtotal() * this.pphRate()) / 100);
  });

  totalCalculated = computed(() => {
    return Math.max(0, this.subtotal() + this.taxAmount() - this.pphAmount() - this.dpDeduction());
  });

  onCustomerSelected(customerId: string) {
    this.formCustomerId.set(customerId);
    const cust = this.arService.getCustomer(customerId);
    if (cust) {
      const issueTime = new Date(this.formIssueDate()).getTime();
      const dueTime = new Date(issueTime + (cust.dueDays || 30) * 86400000);
      this.formDueDate.set(dueTime.toISOString().substring(0, 10));
    }
  }

  addLineItem() {
    this.lineItems.update(items => [
      ...items,
      { id: String(Date.now()), description: '', itemType: 'Service', quantity: 1, unitPrice: 0, lineTotal: 0 }
    ]);
  }

  removeLineItem(index: number) {
    this.lineItems.update(items => items.filter((_, i) => i !== index));
  }

  saveInvoice(targetStatus: InvoiceStatus) {
    const calculatedItems = this.lineItems().map(item => ({
      ...item,
      lineTotal: (item.quantity || 0) * (item.unitPrice || 0)
    }));

    const saveAsMode: 'Draft' | 'Sent' | 'Issued' = targetStatus === 'Draft' ? 'Draft' : 'Issued';

    this.arService.createInvoice({
      customerId: this.formCustomerId(),
      issueDate: this.formIssueDate(),
      dueDate: this.formDueDate(),
      saveAs: saveAsMode,
      invoiceType: this.formInvoiceType(),
      lineItems: calculatedItems,
      taxRate: this.taxRate(),
      pphRate: this.pphRate(),
      dpDeduction: this.dpDeduction(),
      notes: this.formNotes(),
      sourceType: 'generic'
    });

    this.navService.navigateTo('invoices');
  }
}
