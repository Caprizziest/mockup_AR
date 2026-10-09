import { Component, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../core/services/navigation.service';
import { ArDataService } from '../../../core/services/ar-data.service';
import { Invoice } from '../../../core/models/ar.models';
import { RupiahPipe } from '../../../shared/pipes/rupiah.pipe';

@Component({
  selector: 'app-action-inbox-drawer',
  standalone: true,
  imports: [CommonModule, RupiahPipe],
  template: `
    <div class="v3-drawer-backdrop" *ngIf="navService.showActionInbox()" (click)="navService.showActionInbox.set(false)">
      <div class="v3-drawer" (click)="$event.stopPropagation()">

        <!-- Drawer Header -->
        <div class="v3-drawer-header">
          <div class="d-flex align-items-center gap-2">
            <div
              class="rounded-2 p-1.5 bg-danger bg-opacity-10 text-danger d-flex align-items-center justify-content-center"
              style="width: 32px; height: 32px;">
              <i class="bi bi-bell-fill fs-6"></i>
            </div>
            <div>
              <div class="fw-bold text-dark" style="font-size: 0.95rem;">Tindak Lanjut Penagihan</div>
            </div>
          </div>
          <button type="button" class="btn-close" (click)="navService.showActionInbox.set(false)" title="Tutup Panel"></button>
        </div>

        <!-- Quick Filter Tabs inside Drawer -->
        <div class="px-3 pt-2.5 pb-2 bg-white border-bottom d-flex align-items-center gap-1.5">
          <button type="button" class="btn btn-sm py-1 px-2.5 rounded-pill"
            [ngClass]="actionInboxTab() === 'all' ? 'btn-dark' : 'btn-light border text-muted'"
            style="font-size: 0.75rem;" (click)="actionInboxTab.set('all')">
            Semua ({{ priorityOverdueInvoices().length + draftInvoices().length }})
          </button>
          <button type="button" class="btn btn-sm py-1 px-2.5 rounded-pill"
            [ngClass]="actionInboxTab() === 'overdue' ? 'btn-danger' : 'btn-light border text-muted'"
            style="font-size: 0.75rem;" (click)="actionInboxTab.set('overdue')">
            Overdue ({{ priorityOverdueInvoices().length }})
          </button>
          <button type="button" class="btn btn-sm py-1 px-2.5 rounded-pill"
            [ngClass]="actionInboxTab() === 'draft' ? 'btn-secondary' : 'btn-light border text-muted'"
            style="font-size: 0.75rem;" (click)="actionInboxTab.set('draft')">
            Draft ({{ draftInvoices().length }})
          </button>
        </div>

        <!-- Drawer Body -->
        <div class="v3-drawer-body d-flex flex-column gap-3">

          <!-- 1. Overdue Section -->
          <div *ngIf="actionInboxTab() === 'all' || actionInboxTab() === 'overdue'">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <div class="text-uppercase fw-bold text-danger" style="font-size: 0.7rem; letter-spacing: 0.05em;">
                <i class="bi bi-telephone-outbound-fill me-1"></i>Lewat Jatuh Tempo
              </div>
              <span class="v3-badge v3-badge-overdue py-0 px-1.5">{{ priorityOverdueInvoices().length }}</span>
            </div>

            <div class="d-flex flex-column gap-2">
              <div *ngFor="let inv of priorityOverdueInvoices()" class="v3-inbox-card v3-inbox-card-overdue shadow-sm">
                <div class="d-flex align-items-start justify-content-between gap-2">
                  <div>
                    <div class="d-flex align-items-center gap-1.5">
                      <a href="javascript:void(0)" class="v3-mono fw-bold text-primary text-decoration-none"
                        style="font-size: 0.85rem;" (click)="viewInvoice(inv)">
                        {{ inv.invoiceNumber }}
                      </a>
                      <span class="v3-badge v3-badge-overdue" style="font-size: 0.65rem; padding: 0.1rem 0.4rem;">
                        +{{ getDaysPastDue(inv.dueDate) }} hari
                      </span>
                    </div>
                    <div class="fw-bold text-dark mt-1" style="font-size: 0.85rem;">{{ inv.customerName }}</div>

                    <div class="text-muted small mt-1 d-flex flex-wrap align-items-center gap-2"
                      *ngIf="getCustomer(inv.customerId) as cust">
                      <span><i class="bi bi-person me-1"></i>{{ cust.contactPerson }}</span>
                      <span>&bull;</span>
                      <a [href]="'tel:' + cust.phone" class="text-primary text-decoration-none v3-mono fw-medium">
                        <i class="bi bi-telephone-fill me-1"></i>{{ cust.phone }}
                      </a>
                    </div>
                  </div>

                  <div class="text-end">
                    <div class="v3-mono fw-bold text-danger fs-6">{{ inv.balanceDue | rupiah }}</div>
                    <div class="text-muted v3-mono" style="font-size: 0.68rem;" *ngIf="inv.amountPaid > 0">
                      Sisa dari {{ inv.total | rupiah }}
                    </div>
                  </div>
                </div>

                <div class="d-flex align-items-center justify-content-between pt-2 mt-2 border-top border-light">
                  <span class="text-muted" style="font-size: 0.72rem;">
                    Jatuh tempo: <strong class="v3-mono text-dark">{{ inv.dueDate }}</strong>
                  </span>
                  <div class="d-flex gap-1.5">
                    <button type="button" class="btn btn-sm btn-light border py-1 px-2.5" style="font-size: 0.72rem;"
                      (click)="viewInvoice(inv)">
                      Rincian
                    </button>
                    <button type="button" class="v3-btn-primary py-1 px-3" style="font-size: 0.72rem;"
                      [disabled]="isViewer" (click)="onRecordPaymentForInvoice(inv)">
                      Catat Bayar
                    </button>
                  </div>
                </div>
              </div>

              <div *ngIf="priorityOverdueInvoices().length === 0"
                class="text-center py-4 bg-white rounded border text-muted">
                <i class="bi bi-check-circle-fill text-success fs-3 d-block mb-1"></i>
                <div class="fw-medium text-dark" style="font-size: 0.85rem;">Semua tagihan lancar!</div>
                <small style="font-size: 0.72rem;">Tidak ada invoice yang lewat jatuh tempo.</small>
              </div>
            </div>
          </div>

          <!-- 2. Draft Section -->
          <div *ngIf="actionInboxTab() === 'all' || actionInboxTab() === 'draft'">
            <div class="d-flex align-items-center justify-content-between mb-2 mt-2">
              <div class="text-uppercase fw-bold text-secondary" style="font-size: 0.7rem; letter-spacing: 0.05em;">
                <i class="bi bi-file-earmark-check me-1"></i>Draft Invoice
              </div>
              <span class="v3-badge v3-badge-draft py-0 px-1.5">{{ draftInvoices().length }}</span>
            </div>

            <div class="d-flex flex-column gap-2">
              <div *ngFor="let inv of draftInvoices()" class="v3-inbox-card v3-inbox-card-draft shadow-sm">
                <div class="d-flex align-items-center justify-content-between gap-2">
                  <div>
                    <div class="d-flex align-items-center gap-1.5">
                      <span class="v3-mono fw-bold text-secondary" style="font-size: 0.85rem;">{{ inv.invoiceNumber }}</span>
                      <span class="v3-badge v3-badge-draft" style="font-size: 0.65rem;">Draft</span>
                    </div>
                    <div class="fw-semibold text-dark mt-0.5 text-truncate" style="max-width: 250px; font-size: 0.82rem;">
                      {{ inv.customerName }}
                    </div>
                    <div class="text-muted" style="font-size: 0.7rem;">Dibuat: {{ inv.issueDate }}</div>
                  </div>

                  <div class="text-end">
                    <div class="v3-mono fw-bold text-dark fs-6">{{ inv.total | rupiah }}</div>
                    <button type="button" class="btn btn-sm btn-outline-primary py-1 px-2.5 mt-1.5"
                      style="font-size: 0.72rem;" (click)="viewInvoice(inv)">
                      Buka & Terbitkan &rarr;
                    </button>
                  </div>
                </div>
              </div>

              <div *ngIf="draftInvoices().length === 0" class="text-center py-4 bg-white rounded border text-muted">
                <i class="bi bi-clipboard-check text-success fs-3 d-block mb-1"></i>
                <div class="fw-medium text-dark" style="font-size: 0.85rem;">Semua draft telah diterbitkan!</div>
                <small style="font-size: 0.72rem;">Tidak ada dokumen draft tertunda.</small>
              </div>
            </div>
          </div>

        </div>

        <!-- Drawer Footer -->
        <div class="v3-drawer-footer">
          <div class="text-muted" style="font-size: 0.75rem;">
            Total tertunggak: <strong class="v3-mono text-danger">{{ overdueTotalBalance() | rupiah }}</strong>
          </div>
          <button type="button" class="btn btn-sm btn-outline-secondary" (click)="navService.showActionInbox.set(false)"
            style="font-size: 0.75rem;">
            Tutup
          </button>
        </div>

      </div>
    </div>
  `
})
export class ActionInboxDrawerComponent {
  readonly navService = inject(NavigationService);
  readonly arService = inject(ArDataService);

  @Output() recordPaymentForInvoice = new EventEmitter<{ customerId: string; invoiceId: string }>();

  actionInboxTab = signal<'all' | 'overdue' | 'draft'>('all');

  priorityOverdueInvoices = computed(() => {
    return this.arService.invoices()
      .filter(i => i.status === 'Overdue')
      .sort((a, b) => b.balanceDue - a.balanceDue);
  });

  draftInvoices = computed(() => {
    return this.arService.invoices()
      .filter(i => i.status === 'Draft')
      .sort((a, b) => b.total - a.total);
  });

  overdueTotalBalance = computed(() => {
    return this.priorityOverdueInvoices().reduce((acc, curr) => acc + (curr.balanceDue || 0), 0);
  });

  get isViewer(): boolean {
    return this.arService.currentUser().role === 'Viewer';
  }

  getCustomer(customerId: string) {
    return this.arService.getCustomer(customerId);
  }

  getDaysPastDue(dueDateStr: string): number {
    const dueTime = new Date(dueDateStr).getTime();
    const todayTime = new Date(this.arService.today).getTime();
    const diff = Math.floor((todayTime - dueTime) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  viewInvoice(inv: Invoice) {
    this.navService.showActionInbox.set(false);
    this.navService.navigateTo('invoice-detail', { invoice: inv });
  }

  onRecordPaymentForInvoice(inv: Invoice) {
    this.recordPaymentForInvoice.emit({ customerId: inv.customerId, invoiceId: inv.id });
    this.navService.showActionInbox.set(false);
    this.navService.openPaymentModal({ customerId: inv.customerId, invoiceId: inv.id });
  }
}
