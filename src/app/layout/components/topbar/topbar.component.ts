import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../core/services/navigation.service';
import { ArDataService } from '../../../core/services/ar-data.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="v3-topbar">
      <div class="d-flex align-items-center gap-3">
        <button type="button" class="btn btn-sm btn-outline-secondary d-lg-none"
          (click)="navService.toggleSidebarMobile()">
          Menu
        </button>

        <div class="v3-breadcrumb">
          <span class="v3-breadcrumb-root">Sistem Piutang Usaha</span>
          <span class="text-muted">/</span>
          <span class="v3-breadcrumb-current">
            <ng-container [ngSwitch]="navService.activeView()">
              <span *ngSwitchCase="'dashboard'">Ikhtisar Finansial AR</span>
              <span *ngSwitchCase="'invoices'">Daftar Invoice</span>
              <span *ngSwitchCase="'invoice-create'">Buat Invoice Baru</span>
              <span *ngSwitchCase="'invoice-edit'">Ubah Invoice Draft</span>
              <span *ngSwitchCase="'invoice-detail'">Faktur {{ navService.selectedInvoice()?.invoiceNumber }}</span>
              <span *ngSwitchCase="'payments'">Riwayat Pembayaran</span>
              <span *ngSwitchCase="'income-audit'">Income Audit</span>
              <span *ngSwitchCase="'customers'">Data Pelanggan</span>
              <span *ngSwitchCase="'customer-detail'">{{ navService.selectedCustomer()?.name }}</span>
              <span *ngSwitchCase="'aging-report'">Umur Piutang (Aging)</span>
              <span *ngSwitchCase="'bank-accounts'">Rekening Bank</span>
              <span *ngSwitchCase="'activity-logs'">Log Aktivitas</span>
              <span *ngSwitchCase="'mutasi-piutang'">Laporan Mutasi Piutang</span>
              <span *ngSwitchCase="'kartu-piutang'">Kartu Piutang</span>
              <span *ngSwitchCase="'dp-management'">Uang Muka (DP)</span>
            </ng-container>
          </span>
          <span class="v3-date-pill ms-2 d-none d-md-inline-flex" title="Tanggal Acuan Sistem">
            {{ arService.today }}
          </span>
        </div>
      </div>

      <div class="d-flex align-items-center gap-2">
        <!-- Action Inbox Trigger -->
        <button type="button" class="v3-action-pill-btn" (click)="navService.toggleActionInbox()"
          title="Daftar Tindak Lanjut Penagihan & Draft">
          <i class="bi bi-bell-fill text-danger"></i>
          <span>Tindak Lanjut</span>
          <span class="v3-pill-badge" *ngIf="actionItemCount > 0">
            {{ actionItemCount }}
          </span>
        </button>

        <button type="button" class="v3-btn-secondary" [disabled]="isViewer" (click)="onRecordPayment()">
          <span>Catat Pembayaran</span>
        </button>

        <button type="button" class="v3-btn-primary" [disabled]="isViewer" (click)="onCreateInvoice()">
          <span>+ Buat Invoice</span>
        </button>
      </div>
    </header>
  `
})
export class TopbarComponent {
  readonly navService = inject(NavigationService);
  readonly arService = inject(ArDataService);

  @Output() recordPayment = new EventEmitter<void>();
  @Output() createInvoice = new EventEmitter<void>();

  onRecordPayment() {
    this.recordPayment.emit();
    this.navService.openPaymentModal();
  }

  onCreateInvoice() {
    this.createInvoice.emit();
    this.navService.navigateTo('invoice-create');
  }

  get isViewer(): boolean {
    return this.arService.currentUser().role === 'Viewer';
  }

  get actionItemCount(): number {
    const overdue = this.arService.invoices().filter(i => i.status === 'Overdue').length;
    const draft = this.arService.invoices().filter(i => i.status === 'Draft').length;
    return overdue + draft;
  }
}
