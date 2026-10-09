import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Customer, Invoice } from '../models/ar.models';

export type V3ActiveView =
  | 'dashboard'
  | 'invoices'
  | 'invoice-create'
  | 'invoice-edit'
  | 'invoice-detail'
  | 'payments'
  | 'income-audit'
  | 'customers'
  | 'customer-detail'
  | 'aging-report'
  | 'bank-accounts'
  | 'activity-logs'
  | 'mutasi-piutang'
  | 'kartu-piutang'
  | 'dp-management';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private readonly router = inject(Router);

  // Active view state
  readonly activeView = signal<V3ActiveView>('dashboard');
  readonly sidebarMobileOpen = signal<boolean>(false);
  readonly showActionInbox = signal<boolean>(false);

  // Selection states
  readonly selectedInvoice = signal<Invoice | null>(null);
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly customerActiveTab = signal<'invoices' | 'payments' | 'dp' | 'profile'>('invoices');

  navigateTo(view: V3ActiveView, params?: { invoice?: Invoice; customer?: Customer }) {
    if (params?.invoice) {
      this.selectedInvoice.set(params.invoice);
    }
    if (params?.customer) {
      this.selectedCustomer.set(params.customer);
    }

    this.activeView.set(view);
    this.sidebarMobileOpen.set(false);

    // Map view to route path
    const routeMap: Record<V3ActiveView, string[]> = {
      'dashboard': ['/dashboard'],
      'invoices': ['/invoices'],
      'invoice-create': ['/invoices', 'create'],
      'invoice-edit': ['/invoices', 'edit'],
      'invoice-detail': ['/invoices', 'detail'],
      'payments': ['/payments'],
      'income-audit': ['/income-audit'],
      'customers': ['/customers'],
      'customer-detail': ['/customers', 'detail'],
      'aging-report': ['/reports', 'aging'],
      'mutasi-piutang': ['/reports', 'mutasi'],
      'kartu-piutang': ['/reports', 'kartu-piutang'],
      'dp-management': ['/dp-management'],
      'bank-accounts': ['/settings', 'bank-accounts'],
      'activity-logs': ['/settings', 'activity-logs']
    };

    if (routeMap[view]) {
      this.router.navigate(routeMap[view]).catch(() => {
        // Fallback gracefully if route is not registered yet
      });
    }
  }

  toggleSidebarMobile() {
    this.sidebarMobileOpen.update(v => !v);
  }

  toggleActionInbox() {
    this.showActionInbox.update(v => !v);
  }

  // Toast Notification System
  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'danger' | 'info' | 'warning'>('info');
  private toastTimeout: any;

  showToast(msg: string, type: 'success' | 'danger' | 'info' | 'warning' = 'info') {
    this.toastMessage.set(msg);
    this.toastType.set(type);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  // Global Payment Modal State
  readonly showPaymentModal = signal<boolean>(false);
  readonly paymentModalTarget = signal<{ customerId?: string; invoiceId?: string } | null>(null);

  openPaymentModal(target?: { customerId?: string; invoiceId?: string }) {
    this.paymentModalTarget.set(target || null);
    this.showPaymentModal.set(true);
  }

  closePaymentModal() {
    this.showPaymentModal.set(false);
    this.paymentModalTarget.set(null);
  }
}
