import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from '../../../../core/services/ar-data.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { PaymentMethod, Invoice } from '../../../../core/models/ar.models';
import { RupiahPipe } from '../../../../shared/pipes/rupiah.pipe';

@Component({
  selector: 'app-payment-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe],
  template: `
    <div class="v3-modal-backdrop" *ngIf="navService.showPaymentModal()">
      <div class="v3-modal v3-modal-xl">
        <!-- Modal Header -->
        <div class="v3-modal-header bg-white py-3 px-4 border-bottom">
          <div>
            <h4 class="fw-bold mb-0 fs-5 text-dark">Pencatatan Pembayaran Masuk</h4>
          </div>
          <button type="button" class="btn-close" (click)="closeModal()"></button>
        </div>

        <!-- Modal Body (2-Column Architecture) -->
        <div class="v3-modal-body p-0">
          <div class="row g-0">

            <!-- ==================== KOLOM KIRI (38%): SUMBER PENERIMAAN KAS & BUKTI FISIK ==================== -->
            <div class="col-12 col-lg-5 p-3 p-md-4 border-end bg-light-subtle d-flex flex-column gap-3">

              <!-- 1. Pelanggan & Informasi Piutang -->
              <div>
                <label class="form-label small fw-bold text-dark mb-1">Pelanggan <span class="text-danger">*</span></label>
                <select class="form-select form-select-sm" [ngModel]="paymentCustomerId()"
                  (ngModelChange)="onPaymentCustomerChange($event)">
                  <option value="" disabled>-- Pilih Pelanggan --</option>
                  <option *ngFor="let c of arService.customers()" [value]="c.id">
                    {{ c.name }}
                  </option>
                </select>
                <!-- Info Ringkas Saldo Pelanggan -->
                <div class="d-flex align-items-center justify-content-between p-2 mt-1.5 bg-white border rounded small">
                  <div>
                    <span class="text-muted" style="font-size: 0.7rem;">Total Tagihan:</span>
                    <div class="v3-mono fw-bold text-danger">{{ paymentCustomerTotalOutstanding() | rupiah }}</div>
                  </div>
                  <div class="text-end" *ngIf="(paymentSelectedCustomer()?.dpBalance || 0) > 0">
                    <span class="text-muted" style="font-size: 0.7rem;">Saldo DP:</span>
                    <div class="v3-mono fw-bold text-success">{{ (paymentSelectedCustomer()?.dpBalance || 0) | rupiah }}</div>
                  </div>
                </div>
              </div>

              <!-- 2. HERO AMOUNT: NOMINAL PEMBAYARAN DITERIMA -->
              <div class="p-3 bg-white border rounded shadow-sm">
                <label class="form-label small fw-bold text-dark text-uppercase mb-1" style="letter-spacing: 0.04em;">
                  Nominal Pembayaran <span class="text-danger">*</span>
                </label>
                <div class="input-group input-group-lg">
                  <span class="input-group-text bg-light fw-bold text-dark border-end-0">Rp</span>
                  <input type="number" step="50000" class="form-control border-start-0 v3-mono fw-bold fs-4 text-success"
                    placeholder="0"
                    [ngModel]="paymentAmount()" (ngModelChange)="paymentAmount.set($event)">
                </div>

                <!-- Biaya Admin & Tipe Transaksi -->
                <div class="d-flex align-items-center justify-content-between mt-2 pt-2 border-top gap-2">
                  <div class="d-flex align-items-center gap-1.5 flex-grow-1">
                    <label class="form-label small text-muted mb-0 text-nowrap" style="font-size: 0.72rem;">Admin Bank:</label>
                    <input type="number" min="0" step="1000" class="form-control form-control-sm v3-mono py-0.5 px-2"
                      style="font-size: 0.78rem; max-width: 95px;"
                      [ngModel]="paymentAdminFee()" (ngModelChange)="paymentAdminFee.set($event)">
                  </div>
                  <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-sm py-1 px-2.5" [class.btn-primary]="!paymentIsDownPayment()"
                      [class.btn-outline-secondary]="paymentIsDownPayment()" (click)="paymentIsDownPayment.set(false)"
                      style="font-size: 0.72rem;">
                      Pelunasan
                    </button>
                    <button type="button" class="btn btn-sm py-1 px-2.5" [class.btn-warning]="paymentIsDownPayment()"
                      [class.text-dark]="paymentIsDownPayment()" [class.btn-outline-secondary]="!paymentIsDownPayment()"
                      (click)="paymentIsDownPayment.set(true)" style="font-size: 0.72rem;">
                      Uang Muka (DP)
                    </button>
                  </div>
                </div>
              </div>

              <!-- 3. Rincian Rekening Bank & Metode Pembayaran -->
              <div class="row g-2">
                <div class="col-6">
                  <label class="form-label small fw-semibold mb-1">Tanggal Bayar <span class="text-danger">*</span></label>
                  <input type="date" class="form-control form-control-sm" [ngModel]="paymentDate()"
                    (ngModelChange)="paymentDate.set($event)">
                </div>
                <div class="col-6">
                  <label class="form-label small fw-semibold mb-1">Metode Bayar</label>
                  <select class="form-select form-select-sm" [ngModel]="paymentMethod()"
                    (ngModelChange)="onPaymentMethodChange($event)">
                    <option value="bank_transfer">Transfer Bank</option>
                    <option value="virtual_account">Virtual Account</option>
                    <option value="qris">QRIS</option>
                    <option value="credit_card">Kartu Kredit</option>
                    <option value="e_wallet">E-Wallet</option>
                    <option value="cash">Tunai</option>
                  </select>
                </div>
                <div class="col-12">
                  <label class="form-label small fw-semibold mb-1">Rekening Tujuan</label>
                  <select class="form-select form-select-sm" [ngModel]="paymentBankAccountId()"
                    (ngModelChange)="paymentBankAccountId.set($event)">
                    <option *ngFor="let b of arService.bankAccounts()" [value]="b.id">
                      {{ b.bankName }} &bull; {{ b.accountNumber }}
                    </option>
                  </select>
                </div>
                <div class="col-12">
                  <label class="form-label small fw-semibold mb-1">No. Referensi</label>
                  <input type="text" class="form-control form-control-sm v3-mono" [ngModel]="paymentRef()"
                    (ngModelChange)="paymentRef.set($event)" placeholder="Contoh: TRF-BCA-982103">
                </div>
              </div>

              <!-- 4. Lampiran Bukti Fisik Slip / Mutasi -->
              <div class="border rounded p-2.5 bg-white">
                <label class="form-label small fw-semibold d-flex align-items-center justify-content-between mb-1.5">
                  <span>Lampiran Bukti</span>
                </label>
                <input type="file" #paymentFileInput class="d-none" (change)="onPaymentFileSelected($event)" accept="image/*,.pdf,.doc,.docx">

                <div *ngIf="!paymentAttachmentName()" class="d-flex align-items-center gap-2">
                  <button type="button" class="btn btn-sm btn-outline-secondary py-1 px-2.5 d-flex align-items-center gap-1.5"
                    (click)="paymentFileInput.click()" style="font-size: 0.75rem;">
                    <i class="bi bi-paperclip"></i>
                    <span>Pilih File</span>
                  </button>
                  <span class="text-muted small" style="font-size: 0.72rem;">Belum ada file yang dilampirkan.</span>
                </div>

                <div *ngIf="paymentAttachmentName()" class="d-flex align-items-center justify-content-between p-2 bg-light border rounded">
                  <div class="d-flex align-items-center gap-2 overflow-hidden">
                    <i class="bi bi-file-earmark-check-fill text-success fs-5"></i>
                    <div class="text-truncate">
                      <div class="fw-bold text-dark text-truncate small" style="max-width: 180px;">{{ paymentAttachmentName() }}</div>
                      <div class="text-muted small" style="font-size: 0.68rem;">{{ paymentAttachmentSize() }}</div>
                    </div>
                  </div>
                  <button type="button" class="btn btn-sm btn-outline-danger py-0.5 px-1.5" (click)="removePaymentAttachment()" title="Hapus file" style="font-size: 0.7rem;">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
              </div>

              <!-- 5. Catatan Internal Kasir / AR -->
              <div>
                <label class="form-label small fw-semibold mb-1">Catatan</label>
                <textarea class="form-control form-control-sm" rows="1" placeholder="Catatan opsional..."
                  [ngModel]="paymentNotes()" (ngModelChange)="paymentNotes.set($event)"></textarea>
              </div>

            </div>

            <!-- ==================== KOLOM KANAN (62%): ALOKASI PELUNASAN KE FAKTUR ==================== -->
            <div class="col-12 col-lg-7 p-3 p-md-4 d-flex flex-column gap-3">

              <!-- KASUS A: PELUNASAN TAGIHAN -->
              <ng-container *ngIf="!paymentIsDownPayment()">

                <!-- 1. Live Match KPI Summary Strip -->
                <div class="row g-2">
                  <div class="col-4">
                    <div class="p-2.5 rounded border bg-light">
                      <div class="text-muted small mb-1" style="font-size: 0.7rem;">Nominal Diterima:</div>
                      <div class="v3-mono fw-bold text-dark fs-6">{{ paymentAmount() | rupiah }}</div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="p-2.5 rounded border bg-light">
                      <div class="text-muted small mb-1" style="font-size: 0.7rem;">Teralokasi ke Faktur:</div>
                      <div class="v3-mono fw-bold text-success fs-6">{{ totalAllocatedAmount() | rupiah }}</div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="p-2.5 rounded border" [class.bg-success-subtle]="unallocatedAmount() === 0 && totalAllocatedAmount() > 0"
                      [class.bg-warning-subtle]="unallocatedAmount() > 0" [class.bg-light]="unallocatedAmount() === 0 && totalAllocatedAmount() === 0">
                      <div class="text-muted small mb-1" style="font-size: 0.7rem;">
                        {{ unallocatedAmount() > 0 ? 'Kelebihan (Deposit):' : 'Sisa Belum Dialokasi:' }}
                      </div>
                      <div class="v3-mono fw-bold fs-6" [class.text-warning-emphasis]="unallocatedAmount() > 0" [class.text-dark]="unallocatedAmount() === 0">
                        {{ unallocatedAmount() | rupiah }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 2. Header Tabel Faktur & Tombol Auto-Alokasi -->
                <div class="d-flex align-items-center justify-content-between pt-1">
                  <div>
                    <span class="fw-bold text-dark small">Daftar Faktur Terbuka</span>
                    <span class="text-muted small ms-1">({{ paymentAllocations().length }} faktur aktif)</span>
                  </div>
                  <button type="button" class="btn btn-sm btn-outline-primary py-1 px-2.5 fw-semibold d-flex align-items-center gap-1.5"
                    style="font-size: 0.75rem;" (click)="autoAllocateOldestFirst()"
                    title="Otomatis mendistribusikan nominal ke tagihan paling awal (metode FIFO)">
                    <i class="bi bi-magic"></i>
                    <span>Auto-Alokasi</span>
                  </button>
                </div>

                <!-- 3. Tabel Alokasi Faktur -->
                <div class="border rounded overflow-hidden flex-grow-1" style="max-height: 290px; overflow-y: auto;">
                  <table class="v3-table mb-0 align-middle">
                    <thead class="sticky-top bg-light">
                      <tr>
                        <th style="width: 25%;">No. Faktur</th>
                        <th style="width: 20%;">Jatuh Tempo</th>
                        <th style="width: 25%; text-align: right;">Sisa Tagihan</th>
                        <th style="width: 30%; text-align: right;">Alokasi Bayar (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of paymentAllocations()">
                        <td>
                          <span class="v3-mono fw-bold text-primary">{{ item.invoiceNumber }}</span>
                        </td>
                        <td class="v3-mono text-muted small">{{ item.dueDate }}</td>
                        <td class="text-end v3-mono text-danger fw-semibold">
                          {{ item.balanceDue | rupiah }}
                        </td>
                        <td class="text-end">
                          <div class="d-flex align-items-center justify-content-end gap-1">
                            <input type="number" min="0" [max]="item.balanceDue"
                              class="form-control form-control-sm text-end v3-mono fw-bold"
                              style="max-width: 140px; font-size: 0.85rem;"
                              [(ngModel)]="item.allocatedAmount">
                            <button type="button" class="btn btn-sm btn-light border py-0.5 px-1.5 text-muted"
                              style="font-size: 0.68rem;" (click)="allocateFull(item)" title="Set Lunas Penuh">
                              Max
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr *ngIf="paymentAllocations().length === 0">
                        <td colspan="4" class="text-center py-4 text-muted small">
                          Tidak ada faktur aktif yang memiliki sisa tagihan untuk pelanggan ini.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- 4. Alert & Penanganan Otomatis Kelebihan Bayar -->
                <div *ngIf="unallocatedAmount() > 0" class="alert alert-warning border-warning d-flex align-items-center justify-content-between gap-2 py-2 px-3 mb-0">
                  <div class="d-flex align-items-center gap-2 small">
                    <i class="bi bi-exclamation-triangle-fill text-warning fs-5"></i>
                    <span class="text-dark">
                      Kelebihan pembayaran <strong>{{ unallocatedAmount() | rupiah }}</strong> dialokasikan ke Saldo Deposit (DP).
                    </span>
                  </div>
                  <div class="form-check mb-0 text-nowrap">
                    <input class="form-check-input" type="checkbox" id="autoDepositCheck" [ngModel]="paymentAutoDepositOverpayment()" (ngModelChange)="paymentAutoDepositOverpayment.set($event)">
                    <label class="form-check-label text-dark fw-semibold small" for="autoDepositCheck">
                      Alokasikan ke DP
                    </label>
                  </div>
                </div>

              </ng-container>

              <!-- KASUS B: UANG MUKA / DOWN PAYMENT (DP) -->
              <div *ngIf="paymentIsDownPayment()" class="p-4 bg-light rounded border text-center d-flex flex-column align-items-center justify-content-center h-100">
                <i class="bi bi-wallet2 text-warning fs-1 mb-2"></i>
                <h5 class="fw-bold text-dark fs-6 mb-1">Setoran Uang Muka (DP)</h5>
                <p class="text-secondary small mb-0" style="max-width: 380px;">
                  Nominal pembayaran <strong class="text-dark">{{ paymentAmount() | rupiah }}</strong> akan dicatat ke saldo deposit (DP) pelanggan <strong>{{ paymentSelectedCustomer()?.name }}</strong>.
                </p>
              </div>

            </div>

          </div>
        </div>

        <!-- Modal Footer -->
        <div class="v3-modal-footer bg-white py-2.5 px-4 border-top d-flex align-items-center justify-content-between">
          <div class="small">
            <span *ngIf="!paymentIsDownPayment() && totalAllocatedAmount() > 0" class="text-success fw-medium">
              <i class="bi bi-check-circle-fill me-1"></i>Siap diproses: {{ totalAllocatedAmount() | rupiah }} dialokasikan ke faktur
            </span>
            <span *ngIf="paymentIsDownPayment() && paymentAmount() > 0" class="text-warning-emphasis fw-medium">
              <i class="bi bi-wallet2 me-1"></i>Siap dicatat sebagai Saldo Deposit Uang Muka
            </span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="v3-btn-secondary" (click)="closeModal()">Batal</button>
            <button type="button" class="v3-btn-primary"
              [disabled]="(!paymentIsDownPayment() && totalAllocatedAmount() <= 0) || (paymentIsDownPayment() && paymentAmount() <= 0)"
              (click)="submitPayment()">
              <span>Konfirmasi & Simpan Pembayaran</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  `
})
export class PaymentFormModalComponent {
  readonly arService = inject(ArDataService);
  readonly navService = inject(NavigationService);

  paymentCustomerId = signal<string>('');
  paymentAmount = signal<number>(0);
  paymentDate = signal<string>(this.arService.today);
  paymentMethod = signal<PaymentMethod>('bank_transfer');
  paymentChannel = signal<string>('BCA (Overbooking)');
  paymentBankAccountId = signal<string>('');
  paymentAdminFee = signal<number>(0);
  paymentRef = signal<string>('');
  paymentNotes = signal<string>('');
  paymentIsDownPayment = signal<boolean>(false);
  paymentAllocations = signal<{
    invoiceId: string;
    invoiceNumber: string;
    balanceDue: number;
    dueDate: string;
    allocatedAmount: number;
  }[]>([]);
  paymentAutoDepositOverpayment = signal<boolean>(true);
  paymentAttachmentName = signal<string>('');
  paymentAttachmentSize = signal<string>('');
  paymentAttachmentUrl = signal<string>('');

  constructor() {
    // When global payment modal opens, initialize fields
    effect(() => {
      const isOpen = this.navService.showPaymentModal();
      if (isOpen) {
        const target = this.navService.paymentModalTarget();
        this.initializeModal(target?.customerId, target?.invoiceId);
      }
    });

    // Listen to custom event fallback if triggered via window
    if (typeof window !== 'undefined') {
      window.addEventListener('open-payment-modal', () => {
        this.navService.openPaymentModal();
      });
    }
  }

  get isViewer(): boolean {
    return this.arService.currentUser().role === 'Viewer';
  }

  paymentSelectedCustomer = computed(() => {
    return this.arService.customers().find(c => c.id === this.paymentCustomerId());
  });

  paymentCustomerTotalOutstanding = computed(() => {
    const custId = this.paymentCustomerId();
    return this.arService.invoices()
      .filter(i => i.customerId === custId && i.status !== 'Cancelled' && i.status !== 'Paid' && i.status !== 'Draft')
      .reduce((sum, i) => sum + i.balanceDue, 0);
  });

  totalAllocatedAmount = computed(() => {
    return this.paymentAllocations().reduce((sum, item) => sum + (Number(item.allocatedAmount) || 0), 0);
  });

  unallocatedAmount = computed(() => {
    const remaining = (Number(this.paymentAmount()) || 0) - this.totalAllocatedAmount();
    return remaining > 0 ? remaining : 0;
  });

  initializeModal(targetCustomerId?: string, targetInvoiceId?: string) {
    const defaultCustId = targetCustomerId || (this.arService.customers()[0]?.id ?? '');
    this.paymentCustomerId.set(defaultCustId);
    this.paymentDate.set(this.arService.today);
    this.paymentMethod.set('bank_transfer');
    this.paymentChannel.set('BCA (Overbooking)');

    const bcaAccount = this.arService.bankAccounts().find(b => b.isDefault) || this.arService.bankAccounts()[0];
    this.paymentBankAccountId.set(bcaAccount ? bcaAccount.id : '');
    this.paymentAdminFee.set(0);
    this.paymentRef.set(`TRF-BCA-${Math.floor(100000 + Math.random() * 900000)}`);
    this.paymentNotes.set('');
    this.paymentIsDownPayment.set(false);
    this.removePaymentAttachment();
    this.paymentAutoDepositOverpayment.set(true);

    this.loadInvoicesForPayment(defaultCustId, targetInvoiceId);
  }

  loadInvoicesForPayment(customerId: string, priorityInvoiceId?: string) {
    const openInvoices = this.arService.invoices().filter(
      i => i.customerId === customerId && i.status !== 'Cancelled' && i.status !== 'Paid' && i.status !== 'Draft' && i.balanceDue > 0
    );

    let defaultAmount = 0;
    const allocations = openInvoices.map(inv => {
      let allocated = 0;
      if (priorityInvoiceId && inv.id === priorityInvoiceId) {
        allocated = inv.balanceDue;
        defaultAmount = inv.balanceDue;
      }
      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        balanceDue: inv.balanceDue,
        dueDate: inv.dueDate,
        allocatedAmount: allocated
      };
    });

    if (!priorityInvoiceId && defaultAmount === 0 && allocations.length > 0) {
      defaultAmount = allocations[0].balanceDue;
      allocations[0].allocatedAmount = allocations[0].balanceDue;
    }

    this.paymentAmount.set(defaultAmount);
    this.paymentAllocations.set(allocations);
  }

  onPaymentCustomerChange(customerId: string) {
    this.paymentCustomerId.set(customerId);
    this.loadInvoicesForPayment(customerId);
  }

  onPaymentMethodChange(method: PaymentMethod) {
    this.paymentMethod.set(method);
    const rand = Math.floor(100000 + Math.random() * 900000);
    if (method === 'bank_transfer') {
      this.paymentChannel.set('BCA (Overbooking)');
      this.paymentRef.set(`TRF-BCA-${rand}`);
    } else if (method === 'virtual_account') {
      this.paymentChannel.set('BCA Virtual Account');
      this.paymentRef.set(`VA-BCA-${rand}`);
    } else if (method === 'qris') {
      this.paymentChannel.set('QRIS Dinamis (NMID)');
      this.paymentRef.set(`QRIS-NMD-${rand}`);
    } else if (method === 'credit_card') {
      this.paymentChannel.set('EDC BCA');
      this.paymentRef.set(`EDC-BCA-${rand}`);
    } else if (method === 'e_wallet') {
      this.paymentChannel.set('GoPay Merchant');
      this.paymentRef.set(`EWL-GOPAY-${rand}`);
    } else {
      this.paymentChannel.set('Kasir Front Office');
      this.paymentRef.set(`KW-CASH-${rand}`);
    }
  }

  onPaymentFileSelected(event: any) {
    const file = event?.target?.files?.[0];
    if (!file) return;

    this.paymentAttachmentName.set(file.name);
    const sizeKB = Math.round(file.size / 1024);
    this.paymentAttachmentSize.set(sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.paymentAttachmentUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      this.paymentAttachmentUrl.set('');
    }
  }

  removePaymentAttachment() {
    this.paymentAttachmentName.set('');
    this.paymentAttachmentSize.set('');
    this.paymentAttachmentUrl.set('');
  }

  autoAllocateOldestFirst() {
    const totalAmount = this.paymentAmount();
    if (totalAmount <= 0) {
      this.navService.showToast('Masukkan nominal pembayaran lebih dari 0 untuk auto-alokasi.', 'warning');
      return;
    }

    let remaining = totalAmount;
    const sorted = [...this.paymentAllocations()].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    const updated = sorted.map(item => {
      if (remaining <= 0) {
        return { ...item, allocatedAmount: 0 };
      }
      const toApply = Math.min(remaining, item.balanceDue);
      remaining -= toApply;
      return { ...item, allocatedAmount: toApply };
    });

    this.paymentAllocations.set(updated);
    this.navService.showToast('Auto-alokasi berhasil: nominal teralokasi ke invoice tertua (FIFO).', 'success');
  }

  allocateFull(item: any) {
    item.allocatedAmount = item.balanceDue;
  }

  clearAllocation(item: any) {
    item.allocatedAmount = 0;
  }

  submitPayment() {
    if (this.isViewer) {
      this.navService.showToast('Akses Ditolak: Akun Viewer tidak memiliki izin mencatat pembayaran.', 'danger');
      return;
    }

    const amount = Number(this.paymentAmount()) || 0;
    if (amount <= 0) {
      this.navService.showToast('Nominal pembayaran harus lebih besar dari 0.', 'warning');
      return;
    }

    const isDP = this.paymentIsDownPayment();
    const allocs = this.paymentAllocations()
      .filter(a => Number(a.allocatedAmount) > 0)
      .map(a => ({ invoiceId: a.invoiceId, allocatedAmount: Number(a.allocatedAmount) }));

    if (!isDP && allocs.length === 0) {
      this.navService.showToast('Alokasikan pembayaran ke sekurang-kurangnya satu invoice, atau centang Uang Muka (DP).', 'warning');
      return;
    }

    const totalAlloc = allocs.reduce((sum, a) => sum + a.allocatedAmount, 0);
    if (!isDP && totalAlloc > amount) {
      this.navService.showToast(`Total alokasi melebihi nominal pembayaran. Sesuaikan alokasi.`, 'danger');
      return;
    }

    const overpayment = (!isDP && amount > totalAlloc) ? (amount - totalAlloc) : 0;
    const overpaymentToDeposit = (overpayment > 0 && this.paymentAutoDepositOverpayment()) ? overpayment : 0;

    const payment = this.arService.recordPayment({
      customerId: this.paymentCustomerId(),
      paymentDate: this.paymentDate(),
      amount,
      method: this.paymentMethod(),
      paymentChannel: this.paymentChannel(),
      referenceNumber: this.paymentRef(),
      bankAccountId: this.paymentBankAccountId(),
      adminFee: this.paymentAdminFee(),
      notes: this.paymentNotes(),
      isDownPayment: isDP,
      allocations: allocs,
      attachmentName: this.paymentAttachmentName() || undefined,
      attachmentSize: this.paymentAttachmentSize() || undefined,
      attachmentUrl: this.paymentAttachmentUrl() || undefined,
      overpaymentToDeposit: overpaymentToDeposit || undefined
    });

    if (payment) {
      this.closeModal();
      let successMsg = `Pembayaran ${payment.paymentNumber} berhasil dicatat via ${payment.paymentChannel || 'Bank Transfer'}!`;
      if (overpaymentToDeposit > 0) {
        successMsg += ` Kelebihan bayar otomatis dialokasikan ke Saldo Deposit.`;
      }
      this.navService.showToast(successMsg, 'success');
    } else {
      this.navService.showToast('Gagal mencatat pembayaran.', 'danger');
    }
  }

  closeModal() {
    this.navService.closePaymentModal();
  }
}
