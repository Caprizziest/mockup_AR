import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from './services/ar-data.service';
import { Customer, Invoice, Payment, InvoiceStatus, PaymentMethod } from './models/ar.models';
import { MinimalArComponent } from './minimal-design/minimal-ar';
import { V3ArComponent } from './v3-design/v3-ar';
import { V4ArComponent } from './v4-design/v4-ar';

type ActiveView = 'dashboard' | 'invoices' | 'invoice-create' | 'invoice-detail' | 'customers' | 'customer-detail' | 'aging-report';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, MinimalArComponent, V3ArComponent, V4ArComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly arService = inject(ArDataService);

  // Active Design Version: 'classic' (V1), 'minimal' (V2), 'v3' (Focused V3), 'v4' (Enterprise ERP V4)
  designMode = signal<'classic' | 'minimal' | 'v3' | 'v4'>('v3');

  toggleDesignMode(mode: 'classic' | 'minimal' | 'v3' | 'v4') {
    this.designMode.set(mode);
  }

  // Current Active View
  activeView = signal<ActiveView>('dashboard');
  sidebarMobileOpen = signal<boolean>(false);

  // Selection state
  selectedInvoice = signal<Invoice | null>(null);
  selectedCustomer = signal<Customer | null>(null);
  customerActiveTab = signal<'invoices' | 'payments' | 'profile'>('invoices');

  // Filters & Search
  invoiceSearchQuery = signal<string>('');
  invoiceStatusFilter = signal<string>('ALL');
  customerSearchQuery = signal<string>('');
  customerFilter = signal<'ALL' | 'OVERDUE' | 'HOLD'>('ALL');
  agingAsOfDate = signal<string>(this.arService.today);

  // Toast Notification
  toastMessage = signal<string | null>(null);
  private toastTimeout: any;

  // Modals state
  showPaymentModal = signal<boolean>(false);
  showCustomerModal = signal<boolean>(false);
  showVoidModal = signal<boolean>(false);
  showPdfModal = signal<boolean>(false);

  // --- Payment Form State ---
  paymentCustomerId = signal<string>('');
  paymentAmount = signal<number>(0);
  paymentDate = signal<string>(this.arService.today);
  paymentMethod = signal<PaymentMethod>('bank_transfer');
  paymentRef = signal<string>('');
  paymentNotes = signal<string>('');
  paymentAllocations = signal<{ invoiceId: string; invoiceNumber: string; balanceDue: number; dueDate: string; allocatedAmount: number }[]>([]);

  // --- Invoice Form State ---
  invoiceFormCustomerId = signal<string>('');
  invoiceFormIssueDate = signal<string>(this.arService.today);
  invoiceFormDueDate = signal<string>('2026-10-16');
  invoiceFormTaxRate = signal<number>(11);
  invoiceFormSourceType = signal<'generic' | 'city_ledger'>('generic');
  invoiceFormNotes = signal<string>('');
  invoiceFormLineItems = signal<{ description: string; quantity: number; unitPrice: number }[]>([
    { description: 'Professional Accounting Implementation Retainer', quantity: 1, unitPrice: 25000000 }
  ]);

  // --- Customer Form State ---
  customerFormName = signal<string>('');
  customerFormContact = signal<string>('');
  customerFormEmail = signal<string>('');
  customerFormPhone = signal<string>('');
  customerFormAddress = signal<string>('');
  customerFormCreditLimit = signal<number>(100000000);
  customerFormDueDays = signal<number>(30);
  customerFormNotes = signal<string>('');

  // --- Void Form State ---
  voidInvoiceId = signal<string>('');
  voidInvoiceNumber = signal<string>('');
  voidReason = signal<string>('');

  // Filter state for simplified categories:
  // 'ALL' | 'OUTSTANDING' (Sent & Partial not overdue) | 'OVERDUE' | 'PAID' | 'OTHER' (Draft / Void)
  invoiceCategoryFilter = signal<string>('ALL');

  // Invoices filtered by clean simplified category
  filteredInvoices = computed(() => {
    const q = this.invoiceSearchQuery().toLowerCase().trim();
    const cat = this.invoiceCategoryFilter();
    return this.arService.invoices().filter(inv => {
      const matchesQuery = !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q);

      if (!matchesQuery) return false;
      if (cat === 'ALL') return true;
      if (cat === 'OUTSTANDING') {
        // Active unpaid / partial that is not void and not overdue
        return (inv.status === 'Sent' || inv.status === 'Partial') && inv.balanceDue > 0;
      }
      if (cat === 'OVERDUE') {
        return inv.status === 'Overdue';
      }
      if (cat === 'PAID') {
        return inv.status === 'Paid';
      }
      if (cat === 'OTHER') {
        return inv.status === 'Draft' || inv.status === 'Void';
      }
      return true;
    });
  });

  // Invoice Category Counts for Quick Badges
  invoiceCategoryCounts = computed(() => {
    const list = this.arService.invoices();
    return {
      all: list.length,
      outstanding: list.filter(i => (i.status === 'Sent' || i.status === 'Partial') && i.balanceDue > 0).length,
      overdue: list.filter(i => i.status === 'Overdue').length,
      paid: list.filter(i => i.status === 'Paid').length,
      other: list.filter(i => i.status === 'Draft' || i.status === 'Void').length
    };
  });

  // Overdue Invoices for Priority List
  priorityOverdueInvoices = computed(() => {
    return this.arService.invoices()
      .filter(i => i.status === 'Overdue')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  });

  // Filtered Customers
  filteredCustomers = computed(() => {
    const q = this.customerSearchQuery().toLowerCase().trim();
    const filter = this.customerFilter();
    return this.arService.customers().filter(cust => {
      const matchesQuery = !q ||
        cust.name.toLowerCase().includes(q) ||
        cust.code.toLowerCase().includes(q) ||
        cust.contactPerson.toLowerCase().includes(q);

      const balance = this.arService.getCustomerBalance(cust.id);
      const hasOverdue = this.arService.invoices().some(i => i.customerId === cust.id && i.status === 'Overdue');

      if (filter === 'OVERDUE') return matchesQuery && hasOverdue;
      if (filter === 'HOLD') return matchesQuery && cust.status === 'credit_hold';
      return matchesQuery;
    });
  });

  // Selected Customer's Invoices
  customerInvoices = computed(() => {
    const cust = this.selectedCustomer();
    if (!cust) return [];
    return this.arService.invoices().filter(i => i.customerId === cust.id);
  });

  // Selected Customer's Payments
  customerPayments = computed(() => {
    const cust = this.selectedCustomer();
    if (!cust) return [];
    return this.arService.payments().filter(p => p.customerId === cust.id);
  });

  // Aging Data
  agingData = computed(() => {
    return this.arService.getAgingReport(this.agingAsOfDate());
  });

  // Invoice Form Computed Totals
  invoiceFormSubtotal = computed(() => {
    return this.invoiceFormLineItems().reduce((acc, item) => acc + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
  });

  invoiceFormTaxAmount = computed(() => {
    return Math.round((this.invoiceFormSubtotal() * this.invoiceFormTaxRate()) / 100);
  });

  invoiceFormTotal = computed(() => {
    return this.invoiceFormSubtotal() + this.invoiceFormTaxAmount();
  });

  // Payment Allocation Computed Totals
  totalAllocatedAmount = computed(() => {
    return this.paymentAllocations().reduce((sum, a) => sum + (Number(a.allocatedAmount) || 0), 0);
  });

  unallocatedAmount = computed(() => {
    return Math.max(0, this.paymentAmount() - this.totalAllocatedAmount());
  });

  // Format currency helper (IDR)
  formatMoney(amount: number): string {
    return 'Rp ' + (amount || 0).toLocaleString('id-ID');
  }

  // Calculate days overdue
  getDaysPastDue(dueDateStr: string): number {
    const dueTime = new Date(dueDateStr).getTime();
    const todayTime = new Date(this.arService.today).getTime();
    const diff = Math.floor((todayTime - dueTime) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  // Navigation handlers
  navigateTo(view: ActiveView) {
    this.activeView.set(view);
    this.sidebarMobileOpen.set(false);
  }

  toggleSidebarMobile() {
    this.sidebarMobileOpen.update(v => !v);
  }

  viewInvoice(inv: Invoice) {
    this.selectedInvoice.set(inv);
    this.navigateTo('invoice-detail');
  }

  viewCustomer(cust: Customer) {
    this.selectedCustomer.set(cust);
    this.customerActiveTab.set('invoices');
    this.navigateTo('customer-detail');
  }

  // --- Invoice Create Actions ---
  startCreateInvoice(preselectedCustomerId?: string) {
    const custId = preselectedCustomerId || (this.arService.customers()[0]?.id ?? '');
    this.invoiceFormCustomerId.set(custId);
    this.onCustomerSelectedForInvoice(custId);
    this.invoiceFormIssueDate.set(this.arService.today);
    this.invoiceFormTaxRate.set(11);
    this.invoiceFormSourceType.set('generic');
    this.invoiceFormNotes.set('');
    this.invoiceFormLineItems.set([
      { description: 'Professional Accounting Implementation Retainer', quantity: 1, unitPrice: 25000000 }
    ]);
    this.navigateTo('invoice-create');
  }

  onCustomerSelectedForInvoice(customerId: string) {
    this.invoiceFormCustomerId.set(customerId);
    const cust = this.arService.customers().find(c => c.id === customerId);
    if (cust) {
      const d = new Date(this.invoiceFormIssueDate());
      d.setDate(d.getDate() + (cust.dueDays || 30));
      this.invoiceFormDueDate.set(d.toISOString().split('T')[0]);
    }
  }

  addLineItem() {
    this.invoiceFormLineItems.update(items => [
      ...items,
      { description: '', quantity: 1, unitPrice: 0 }
    ]);
  }

  removeLineItem(index: number) {
    this.invoiceFormLineItems.update(items => items.filter((_, i) => i !== index));
  }

  saveInvoice(saveAs: 'Draft' | 'Sent') {
    const items = this.invoiceFormLineItems().filter(i => i.description.trim() !== '');
    if (items.length === 0) {
      this.showToast('Please add at least one line item with a description.');
      return;
    }

    const created = this.arService.createInvoice({
      customerId: this.invoiceFormCustomerId(),
      issueDate: this.invoiceFormIssueDate(),
      dueDate: this.invoiceFormDueDate(),
      lineItems: items,
      taxRate: this.invoiceFormTaxRate(),
      notes: this.invoiceFormNotes(),
      sourceType: this.invoiceFormSourceType(),
      saveAs
    });

    this.showToast(`Invoice ${created.invoiceNumber} created successfully as ${saveAs}!`);
    this.viewInvoice(created);
  }

  // Issue Draft Invoice explicitly (Flow step: Draft -> Sent)
  issueDraftInvoice(inv: Invoice) {
    const success = this.arService.issueInvoice(inv.id);
    if (success) {
      this.showToast(`Invoice ${inv.invoiceNumber} berhasil diterbitkan dan status beralih ke Sent / Outstanding!`);
      const refreshed = this.arService.invoices().find(i => i.id === inv.id);
      if (refreshed) this.selectedInvoice.set(refreshed);
    }
  }

  // Helper untuk Lifecycle Stepper (1: Draft, 2: Sent/Outstanding, 3: Partial/In-Payment, 4: Paid)
  getInvoiceWorkflowStep(status: InvoiceStatus): number {
    switch (status) {
      case 'Draft': return 1;
      case 'Sent': return 2;
      case 'Overdue': return 2; // Overdue berada di stage penagihan/sent
      case 'Partial': return 3;
      case 'Paid': return 4;
      case 'Void': return 0; // Void adalah status terminal pembatalan
      default: return 2;
    }
  }

  // --- Payment Modal Actions ---
  openPaymentModal(targetCustomerId?: string, targetInvoiceId?: string) {
    const customers = this.arService.customers();
    const custId = targetCustomerId || (customers[0]?.id ?? '');
    this.paymentCustomerId.set(custId);
    this.paymentDate.set(this.arService.today);
    this.paymentMethod.set('bank_transfer');
    this.paymentRef.set(`TRF-${Math.floor(100000 + Math.random() * 900000)}`);
    this.paymentNotes.set('');

    this.loadInvoicesForPayment(custId, targetInvoiceId);
    this.showPaymentModal.set(true);
  }

  loadInvoicesForPayment(customerId: string, priorityInvoiceId?: string) {
    const openInvoices = this.arService.invoices().filter(
      i => i.customerId === customerId && i.status !== 'Void' && i.status !== 'Paid' && i.status !== 'Draft' && i.balanceDue > 0
    );

    let defaultAmount = 0;
    const allocations = openInvoices.map(inv => {
      let allocated = 0;
      if (priorityInvoiceId) {
        if (inv.id === priorityInvoiceId) {
          allocated = inv.balanceDue;
          defaultAmount = inv.balanceDue;
        }
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

  // Auto-allocate payment amount across oldest invoices first
  autoAllocateOldestFirst() {
    const totalAmount = this.paymentAmount();
    if (totalAmount <= 0) {
      this.showToast('Please enter a payment amount greater than 0.');
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
    this.showToast(`Auto-allocated ${this.formatMoney(totalAmount - remaining)} across open invoices.`);
  }

  submitPayment() {
    const amount = this.paymentAmount();
    if (amount <= 0) {
      this.showToast('Payment amount must be greater than 0.');
      return;
    }

    const allocs = this.paymentAllocations()
      .filter(a => a.allocatedAmount > 0)
      .map(a => ({ invoiceId: a.invoiceId, allocatedAmount: Number(a.allocatedAmount) }));

    if (allocs.length === 0) {
      this.showToast('Please allocate the payment to at least one invoice.');
      return;
    }

    const payment = this.arService.recordPayment({
      customerId: this.paymentCustomerId(),
      paymentDate: this.paymentDate(),
      amount,
      method: this.paymentMethod(),
      referenceNumber: this.paymentRef(),
      notes: this.paymentNotes(),
      allocations: allocs
    });

    this.showPaymentModal.set(false);
    this.showToast(`Payment ${payment.paymentNumber} recorded successfully!`);

    if (this.selectedInvoice()) {
      const refreshed = this.arService.invoices().find(i => i.id === this.selectedInvoice()!.id);
      if (refreshed) {
        this.selectedInvoice.set(refreshed);
      }
    }
  }

  // --- Void Invoice Actions ---
  openVoidModal(inv: Invoice) {
    this.voidInvoiceId.set(inv.id);
    this.voidInvoiceNumber.set(inv.invoiceNumber);
    this.voidReason.set('');
    this.showVoidModal.set(true);
  }

  confirmVoidInvoice() {
    const reason = this.voidReason().trim();
    if (!reason) {
      this.showToast('Please provide a valid reason for voiding this invoice.');
      return;
    }

    const success = this.arService.voidInvoice(this.voidInvoiceId(), reason);
    if (success) {
      this.showVoidModal.set(false);
      this.showToast(`Invoice ${this.voidInvoiceNumber()} voided (audit trail preserved).`);
      if (this.selectedInvoice()?.id === this.voidInvoiceId()) {
        const refreshed = this.arService.invoices().find(i => i.id === this.voidInvoiceId());
        if (refreshed) this.selectedInvoice.set(refreshed);
      }
    }
  }

  // --- Customer Creation Actions ---
  openNewCustomerModal() {
    this.customerFormName.set('');
    this.customerFormContact.set('');
    this.customerFormEmail.set('');
    this.customerFormPhone.set('');
    this.customerFormAddress.set('');
    this.customerFormCreditLimit.set(100000000);
    this.customerFormDueDays.set(30);
    this.customerFormNotes.set('');
    this.showCustomerModal.set(true);
  }

  submitNewCustomer() {
    if (!this.customerFormName().trim()) {
      this.showToast('Customer company name is required.');
      return;
    }

    const newCust = this.arService.createCustomer({
      name: this.customerFormName().trim(),
      contactPerson: this.customerFormContact().trim(),
      email: this.customerFormEmail().trim(),
      phone: this.customerFormPhone().trim(),
      address: this.customerFormAddress().trim(),
      creditLimit: this.customerFormCreditLimit(),
      dueDays: this.customerFormDueDays(),
      status: 'active',
      notes: this.customerFormNotes().trim()
    });

    this.showCustomerModal.set(false);
    this.showToast(`Customer ${newCust.name} (${newCust.code}) created successfully!`);
    this.viewCustomer(newCust);
  }

  // --- PDF Preview Modal ---
  openPdfPreview(inv?: Invoice) {
    if (inv) this.selectedInvoice.set(inv);
    this.showPdfModal.set(true);
  }

  // Toast utility
  showToast(msg: string) {
    this.toastMessage.set(msg);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  // Payments applied to selected invoice
  getPaymentsForInvoice(invoiceId: string) {
    return this.arService.payments().filter(p =>
      p.allocations.some(a => a.invoiceId === invoiceId)
    );
  }
}
