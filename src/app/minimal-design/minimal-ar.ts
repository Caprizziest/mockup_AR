import { Component, signal, computed, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from '../services/ar-data.service';
import { Customer, Invoice, Payment, InvoiceStatus, PaymentMethod } from '../models/ar.models';

type MinimalView = 'dashboard' | 'invoices' | 'invoice-detail' | 'customers' | 'customer-detail' | 'aging-report';

@Component({
  selector: 'app-minimal-ar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './minimal-ar.html',
  styleUrl: './minimal-ar.css'
})
export class MinimalArComponent {
  readonly arService = inject(ArDataService);
  readonly switchToClassic = output<void>();
  readonly switchMode = output<'classic' | 'minimal' | 'v3' | 'v4'>();

  // Current view
  activeView = signal<MinimalView>('dashboard');

  // Selection
  selectedInvoice = signal<Invoice | null>(null);
  selectedCustomer = signal<Customer | null>(null);
  customerActiveTab = signal<'invoices' | 'payments' | 'profile'>('invoices');

  // Filters
  invoiceFilter = signal<'ALL' | 'OUTSTANDING' | 'OVERDUE' | 'PAID' | 'OTHER'>('ALL');
  searchQuery = signal<string>('');
  customerSearch = signal<string>('');
  agingAsOfDate = signal<string>(this.arService.today);

  // Quick action modal states
  showPaymentModal = signal<boolean>(false);
  showVoidModal = signal<boolean>(false);
  paymentCustomerId = signal<string>('');
  paymentAmount = signal<number>(0);
  paymentDate = signal<string>(this.arService.today);
  paymentMethod = signal<PaymentMethod>('bank_transfer');
  paymentRef = signal<string>('');
  paymentAllocations = signal<{ invoiceId: string; invoiceNumber: string; balanceDue: number; dueDate: string; allocatedAmount: number }[]>([]);

  voidInvoiceId = signal<string>('');
  voidInvoiceNumber = signal<string>('');
  voidReason = signal<string>('');

  toastMsg = signal<string | null>(null);

  // Computed data
  filteredInvoices = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.invoiceFilter();

    return this.arService.invoices().filter(inv => {
      const matchQ = !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q);

      if (!matchQ) return false;
      if (filter === 'ALL') return true;
      if (filter === 'OUTSTANDING') return (inv.status === 'Sent' || inv.status === 'Partial') && inv.balanceDue > 0;
      if (filter === 'OVERDUE') return inv.status === 'Overdue';
      if (filter === 'PAID') return inv.status === 'Paid';
      if (filter === 'OTHER') return inv.status === 'Draft' || inv.status === 'Void';
      return true;
    });
  });

  categoryCounts = computed(() => {
    const list = this.arService.invoices();
    return {
      all: list.length,
      outstanding: list.filter(i => (i.status === 'Sent' || i.status === 'Partial') && i.balanceDue > 0).length,
      overdue: list.filter(i => i.status === 'Overdue').length,
      paid: list.filter(i => i.status === 'Paid').length,
      other: list.filter(i => i.status === 'Draft' || i.status === 'Void').length
    };
  });

  priorityOverdue = computed(() => {
    return this.arService.invoices()
      .filter(i => i.status === 'Overdue')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  });

  agingData = computed(() => {
    return this.arService.getAgingReport(this.agingAsOfDate());
  });

  customerInvoices = computed(() => {
    const c = this.selectedCustomer();
    if (!c) return [];
    return this.arService.invoices().filter(i => i.customerId === c.id);
  });

  customerPayments = computed(() => {
    const c = this.selectedCustomer();
    if (!c) return [];
    return this.arService.payments().filter(p => p.customerId === c.id);
  });

  filteredCustomers = computed(() => {
    const q = this.customerSearch().toLowerCase().trim();
    return this.arService.customers().filter(c =>
      !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.contactPerson.toLowerCase().includes(q)
    );
  });

  formatMoney(amount: number): string {
    return 'Rp ' + (amount || 0).toLocaleString('id-ID');
  }

  getDaysPastDue(dueDateStr: string): number {
    const due = new Date(dueDateStr).getTime();
    const today = new Date(this.arService.today).getTime();
    const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  navigate(view: MinimalView) {
    this.activeView.set(view);
  }

  viewInvoice(inv: Invoice) {
    this.selectedInvoice.set(inv);
    this.navigate('invoice-detail');
  }

  viewCustomer(cust: Customer) {
    this.selectedCustomer.set(cust);
    this.customerActiveTab.set('invoices');
    this.navigate('customer-detail');
  }

  issueDraft(inv: Invoice) {
    this.arService.issueInvoice(inv.id);
    this.showToast(`Invoice ${inv.invoiceNumber} diterbitkan.`);
    const updated = this.arService.invoices().find(i => i.id === inv.id);
    if (updated) this.selectedInvoice.set(updated);
  }

  openPayment(customerId: string, invoiceId?: string) {
    this.paymentCustomerId.set(customerId);
    this.paymentDate.set(this.arService.today);
    this.paymentMethod.set('bank_transfer');
    this.paymentRef.set(`TRF-${Math.floor(100000 + Math.random() * 900000)}`);

    const openInvoices = this.arService.invoices().filter(
      i => i.customerId === customerId && i.status !== 'Void' && i.status !== 'Paid' && i.status !== 'Draft' && i.balanceDue > 0
    );

    let defaultAmt = 0;
    const allocations = openInvoices.map(inv => {
      let allocated = 0;
      if (invoiceId && inv.id === invoiceId) {
        allocated = inv.balanceDue;
        defaultAmt = inv.balanceDue;
      }
      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        balanceDue: inv.balanceDue,
        dueDate: inv.dueDate,
        allocatedAmount: allocated
      };
    });

    if (!invoiceId && allocations.length > 0) {
      defaultAmt = allocations[0].balanceDue;
      allocations[0].allocatedAmount = allocations[0].balanceDue;
    }

    this.paymentAmount.set(defaultAmt);
    this.paymentAllocations.set(allocations);
    this.showPaymentModal.set(true);
  }

  submitPayment() {
    const amt = this.paymentAmount();
    if (amt <= 0) return;

    const validAllocs = this.paymentAllocations()
      .filter(a => a.allocatedAmount > 0)
      .map(a => ({ invoiceId: a.invoiceId, allocatedAmount: Number(a.allocatedAmount) }));

    this.arService.recordPayment({
      customerId: this.paymentCustomerId(),
      paymentDate: this.paymentDate(),
      amount: amt,
      method: this.paymentMethod(),
      referenceNumber: this.paymentRef(),
      allocations: validAllocs
    });

    this.showPaymentModal.set(false);
    this.showToast('Pembayaran berhasil dicatat.');

    if (this.selectedInvoice()) {
      const refreshed = this.arService.invoices().find(i => i.id === this.selectedInvoice()!.id);
      if (refreshed) this.selectedInvoice.set(refreshed);
    }
  }

  openVoid(inv: Invoice) {
    this.voidInvoiceId.set(inv.id);
    this.voidInvoiceNumber.set(inv.invoiceNumber);
    this.voidReason.set('');
    this.showVoidModal.set(true);
  }

  confirmVoid() {
    if (!this.voidReason().trim()) return;
    this.arService.voidInvoice(this.voidInvoiceId(), this.voidReason().trim());
    this.showVoidModal.set(false);
    this.showToast(`Invoice ${this.voidInvoiceNumber()} di-void.`);
    if (this.selectedInvoice()?.id === this.voidInvoiceId()) {
      const refreshed = this.arService.invoices().find(i => i.id === this.voidInvoiceId());
      if (refreshed) this.selectedInvoice.set(refreshed);
    }
  }

  getPaymentsForInvoice(invoiceId: string) {
    return this.arService.payments().filter(p =>
      p.allocations.some(a => a.invoiceId === invoiceId)
    );
  }

  showToast(msg: string) {
    this.toastMsg.set(msg);
    setTimeout(() => this.toastMsg.set(null), 3500);
  }
}
