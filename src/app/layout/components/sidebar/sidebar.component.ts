import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService, V3ActiveView } from '../../../core/services/navigation.service';
import { ArDataService } from '../../../core/services/ar-data.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="v3-sidebar" [class.mobile-open]="navService.sidebarMobileOpen()">
      <div class="v3-sidebar-header">
        <div class="v3-brand" (click)="navigateTo('dashboard')" role="button" tabindex="0"
          title="PT Galesong Pratama - Sistem Piutang">
          <img src="asset/image3.png" alt="PT Galesong Pratama" class="v3-sidebar-logo" />
        </div>
      </div>

      <nav class="v3-sidebar-nav">
        <div class="v3-nav-group-label">Ringkasan Eksekutif</div>
        <button type="button" class="v3-nav-item"
          [class.active]="navService.activeView() === 'dashboard'"
          (click)="navigateTo('dashboard')">
          <span class="d-flex align-items-center gap-2">
            <i class="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </span>
        </button>

        <div class="v3-nav-group-label mt-3">Operasional AR</div>
        <button type="button" class="v3-nav-item"
          [class.active]="navService.activeView() === 'invoices' || navService.activeView() === 'invoice-detail' || navService.activeView() === 'invoice-create' || navService.activeView() === 'invoice-edit'"
          (click)="navigateTo('invoices')">
          <span class="d-flex align-items-center gap-2">
            <i class="bi bi-receipt"></i>
            <span>Daftar Invoice</span>
          </span>
          <span class="v3-nav-pill-danger" *ngIf="arService.dashboardMetrics().overdueInvoicesCount > 0">
            {{ arService.dashboardMetrics().overdueInvoicesCount }}
          </span>
        </button>

        <button type="button" class="v3-nav-item"
          [class.active]="navService.activeView() === 'payments'"
          (click)="navigateTo('payments')">
          <span class="d-flex align-items-center gap-2">
            <i class="bi bi-wallet2"></i>
            <span>Riwayat Pembayaran</span>
          </span>
        </button>

        <button type="button" class="v3-nav-item"
          [class.active]="navService.activeView() === 'income-audit'"
          (click)="navigateTo('income-audit')">
          <span class="d-flex align-items-center gap-2">
            <i class="bi bi-shield-check"></i>
            <span>Income Audit</span>
          </span>
          <span class="v3-nav-pill-danger" *ngIf="pendingIncomeAuditCount() > 0">
            {{ pendingIncomeAuditCount() }}
          </span>
        </button>

        <button type="button" class="v3-nav-item"
          [class.active]="navService.activeView() === 'customers' || navService.activeView() === 'customer-detail'"
          (click)="navigateTo('customers')">
          <span class="d-flex align-items-center gap-2">
            <i class="bi bi-people"></i>
            <span>Data Pelanggan</span>
          </span>
        </button>

        <button type="button" class="v3-nav-item"
          [class.active]="navService.activeView() === 'dp-management'"
          (click)="navigateTo('dp-management')">
          <span class="d-flex align-items-center gap-2">
            <i class="bi bi-piggy-bank"></i>
            <span>Uang Muka (DP)</span>
          </span>
        </button>

        <div class="v3-nav-group-label mt-3">Laporan & Audit</div>
        <button type="button" class="v3-nav-item" [class.active]="navService.activeView() === 'mutasi-piutang'"
          (click)="navigateTo('mutasi-piutang')">
          <span class="d-flex align-items-center gap-2">
            <i class="bi bi-journal-text"></i>
            <span>Laporan Mutasi Piutang</span>
          </span>
        </button>

        <button type="button" class="v3-nav-item" [class.active]="navService.activeView() === 'kartu-piutang'"
          (click)="navigateTo('kartu-piutang')">
          <span class="d-flex align-items-center gap-2">
            <i class="bi bi-layout-split"></i>
            <span>Kartu Piutang Seimbang</span>
          </span>
        </button>

        <button type="button" class="v3-nav-item" [class.active]="navService.activeView() === 'aging-report'"
          (click)="navigateTo('aging-report')">
          <span class="d-flex align-items-center gap-2">
            <i class="bi bi-bar-chart-steps"></i>
            <span>Laporan Aging</span>
          </span>
        </button>

        <button type="button" class="v3-nav-item" [class.active]="navService.activeView() === 'activity-logs'"
          (click)="navigateTo('activity-logs')">
          <span class="d-flex align-items-center gap-2">
            <i class="bi bi-clock-history"></i>
            <span>Log Aktivitas (Audit)</span>
          </span>
        </button>

        <div class="v3-nav-group-label mt-3">Master Data & Pengaturan</div>
        <button type="button" class="v3-nav-item" [class.active]="navService.activeView() === 'bank-accounts'"
          (click)="navigateTo('bank-accounts')">
          <span class="d-flex align-items-center gap-2">
            <i class="bi bi-bank"></i>
            <span>Rekening Bank Hotel</span>
          </span>
        </button>
      </nav>

      <!-- Sidebar Footer -->
      <div class="v3-sidebar-footer">
        <div class="d-flex align-items-center gap-2">
          <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
            style="width: 28px; height: 28px; font-size: 0.72rem; font-weight: 700;">
            {{ arService.currentUser().role.substring(0, 2).toUpperCase() }}
          </div>
          <div class="overflow-hidden">
            <div class="text-white fw-semibold text-truncate" style="font-size: 0.78rem;">
              {{ arService.currentUser().fullName }}
            </div>
            <div class="text-secondary text-truncate" style="font-size: 0.68rem;">
              Role: {{ arService.currentUser().role }}
            </div>
          </div>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  readonly navService = inject(NavigationService);
  readonly arService = inject(ArDataService);

  readonly pendingIncomeAuditCount = computed(() => {
    return this.arService.payments().filter(p => !p.auditStatus || p.auditStatus === 'pending_fa').length;
  });

  navigateTo(view: V3ActiveView) {
    this.navService.navigateTo(view);
  }
}
