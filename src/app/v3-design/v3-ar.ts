import { Component, signal, computed, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from '../services/ar-data.service';
import {
  Customer,
  Invoice,
  Payment,
  InvoiceStatus,
  PaymentMethod,
  LineItem,
  BankAccount,
  UserRole
} from '../models/ar.models';

export type V3ActiveView =
  | 'dashboard'
  | 'invoices'
  | 'invoice-create'
  | 'invoice-edit'
  | 'invoice-detail'
  | 'customers'
  | 'customer-detail'
  | 'aging-report'
  | 'bank-accounts'
  | 'activity-logs';

export interface DeleteModalState {
  type: 'customer' | 'invoice' | 'bank_account' | 'payment';
  id: string;
  title: string;
  name: string;
  message: string;
  canDelete: boolean;
  blockedReason?: string;
}

@Component({
  selector: 'app-v3-ar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './v3-ar.html',
  styleUrl: './v3-ar.css'
})
export class V3ArComponent {
  readonly arService = inject(ArDataService);
  readonly switchMode = output<'classic' | 'minimal' | 'v3' | 'v4'>();

  // Navigation State (Default to 'invoices' as the primary workspace)
  activeView = signal<V3ActiveView>('invoices');
  sidebarMobileOpen = signal<boolean>(false);

  // Selection state
  selectedInvoice = signal<Invoice | null>(null);
  selectedCustomer = signal<Customer | null>(null);
  customerActiveTab = signal<'invoices' | 'payments' | 'profile'>('invoices');

  // Invoices Filters & Search
  invoiceCategoryFilter = signal<'ALL' | 'Draft' | 'Issued' | 'Partially Paid' | 'Overdue' | 'Paid' | 'Cancelled'>('ALL');
  invoiceSearchQuery = signal<string>('');
  invoiceCustomerFilter = signal<string>('ALL');
  invoiceDateFilter = signal<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR'>('ALL');
  invoiceStartDate = signal<string>('');
  invoiceEndDate = signal<string>('');
  invoiceSortBy = signal<'dueDate_asc' | 'dueDate_desc' | 'issueDate_desc' | 'balanceDue_desc' | 'total_desc'>('dueDate_asc');

  // Customer Filters
  customerSearchQuery = signal<string>('');
  customerFilter = signal<'ALL' | 'OVERDUE' | 'HOLD'>('ALL');
  customerBalanceFilter = signal<'ALL' | 'HAS_BALANCE' | 'NEAR_LIMIT' | 'ZERO_BALANCE'>('ALL');
  customerSortBy = signal<'balance_desc' | 'name_asc' | 'creditLimit_desc'>('balance_desc');

  // Aging Report Filters
  agingAsOfDate = signal<string>(this.arService.today);
  agingCustomerSearch = signal<string>('');
  agingRiskFilter = signal<'ALL' | 'OVERDUE_ONLY' | 'CRITICAL_ONLY' | 'CURRENT_ONLY'>('ALL');
  agingSortBy = signal<'total_desc' | 'critical_desc' | 'name_asc'>('total_desc');
  expandedCustomerAgingId = signal<string | null>(null);

  // Activity Log Filters
  logSearchQuery = signal<string>('');
  logTypeFilter = signal<string>('ALL');
  logUserFilter = signal<string>('ALL');
  logStartDate = signal<string>('');
  logEndDate = signal<string>('');

  // Customer Detail Invoices Filters
  custDetailInvoiceStatus = signal<string>('ALL');
  custDetailInvoiceStartDate = signal<string>('');
  custDetailInvoiceEndDate = signal<string>('');

  hasActiveCustDetailInvoiceFilters = computed(() => {
    return this.custDetailInvoiceStatus() !== 'ALL' ||
      this.custDetailInvoiceStartDate() !== '' ||
      this.custDetailInvoiceEndDate() !== '';
  });

  resetCustDetailInvoiceFilters() {
    this.custDetailInvoiceStatus.set('ALL');
    this.custDetailInvoiceStartDate.set('');
    this.custDetailInvoiceEndDate.set('');
  }

  // Action Inbox Slide-over Drawer State
  showActionInbox = signal<boolean>(false);
  actionInboxTab = signal<'all' | 'overdue' | 'draft'>('all');

  hasActiveInvoiceFilters = computed(() => {
    return this.invoiceCategoryFilter() !== 'ALL' ||
      this.invoiceSearchQuery().trim().length > 0 ||
      this.invoiceCustomerFilter() !== 'ALL' ||
      this.invoiceDateFilter() !== 'ALL' ||
      this.invoiceStartDate() !== '' ||
      this.invoiceEndDate() !== '' ||
      this.invoiceSortBy() !== 'dueDate_asc';
  });

  resetInvoiceFilters() {
    this.invoiceCategoryFilter.set('ALL');
    this.invoiceSearchQuery.set('');
    this.invoiceCustomerFilter.set('ALL');
    this.invoiceDateFilter.set('ALL');
    this.invoiceStartDate.set('');
    this.invoiceEndDate.set('');
    this.invoiceSortBy.set('dueDate_asc');
  }

  hasActiveCustomerFilters = computed(() => {
    return this.customerFilter() !== 'ALL' ||
      this.customerBalanceFilter() !== 'ALL' ||
      this.customerSearchQuery().trim().length > 0 ||
      this.customerSortBy() !== 'balance_desc';
  });

  resetCustomerFilters() {
    this.customerFilter.set('ALL');
    this.customerBalanceFilter.set('ALL');
    this.customerSearchQuery.set('');
    this.customerSortBy.set('balance_desc');
  }

  hasActiveAgingFilters = computed(() => {
    return this.agingCustomerSearch().trim().length > 0 ||
      this.agingRiskFilter() !== 'ALL' ||
      this.agingSortBy() !== 'total_desc';
  });

  resetAgingFilters() {
    this.agingCustomerSearch.set('');
    this.agingRiskFilter.set('ALL');
    this.agingSortBy.set('total_desc');
  }

  hasActiveLogFilters = computed(() => {
    return this.logSearchQuery().trim().length > 0 ||
      this.logTypeFilter() !== 'ALL' ||
      this.logUserFilter() !== 'ALL' ||
      this.logStartDate() !== '' ||
      this.logEndDate() !== '';
  });

  resetLogFilters() {
    this.logSearchQuery.set('');
    this.logTypeFilter.set('ALL');
    this.logUserFilter.set('ALL');
    this.logStartDate.set('');
    this.logEndDate.set('');
  }

  availableLogUsers = computed(() => {
    const users = new Set<string>();
    this.arService.activityLogs().forEach(l => {
      if (l.user) users.add(l.user);
    });
    return Array.from(users);
  });

  // Toast Notification
  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'danger' | 'info' | 'warning'>('info');
  private toastTimeout: any;

  // Modals state
  showPaymentModal = signal<boolean>(false);
  showCustomerModal = signal<boolean>(false);
  isEditingCustomer = signal<boolean>(false);
  editingCustomerId = signal<string>('');

  showCancelModal = signal<boolean>(false);
  cancelInvoiceTarget = signal<Invoice | null>(null);
  cancelReason = signal<string>('');

  showDeleteModal = signal<boolean>(false);
  deleteState = signal<DeleteModalState | null>(null);

  showPdfModal = signal<boolean>(false);

  showBankAccountModal = signal<boolean>(false);
  isEditingBankAccount = signal<boolean>(false);
  editingBankAccountId = signal<string>('');

  // --- Payment Form State ---
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

  // --- Invoice Form State (Create & Edit) ---
  editingInvoiceId = signal<string | null>(null);
  invoiceFormCustomerId = signal<string>('');
  invoiceFormIssueDate = signal<string>(this.arService.today);
  invoiceFormDueDate = signal<string>('2026-10-16');
  invoiceFormInvoiceType = signal<string>('Standard Hospitality Invoice');
  invoiceFormTaxRate = signal<number>(11);      // PPN 11%
  invoiceFormPphRate = signal<number>(2);       // PPh 23 2%
  invoiceFormDpDeduction = signal<number>(0);   // Potongan Uang Muka
  invoiceFormSourceType = signal<'generic' | 'city_ledger' | 'direct'>('generic');
  invoiceFormNotes = signal<string>('');
  invoiceFormLineItems = signal<{
    description: string;
    itemType: LineItem['itemType'];
    quantity: number;
    unitPrice: number;
  }[]>([
    { description: 'Grand Ballroom Rental - Corporate Package', itemType: 'Banquet', quantity: 1, unitPrice: 35000000 },
    { description: 'Executive Buffet Catering (100 pax)', itemType: 'F&B', quantity: 100, unitPrice: 150000 }
  ]);

  // --- Customer Form State ---
  customerFormName = signal<string>('');
  customerFormContact = signal<string>('');
  customerFormEmail = signal<string>('');
  customerFormPhone = signal<string>('');
  customerFormAddress = signal<string>('');
  customerFormNik = signal<string>('');
  customerFormNpwp = signal<string>('');
  customerFormCreditLimit = signal<number>(100000000);
  customerFormDueDays = signal<number>(30);
  customerFormStatus = signal<'active' | 'credit_hold'>('active');
  customerFormNotes = signal<string>('');

  // --- Bank Account Form State ---
  bankAccountFormBankName = signal<string>('');
  bankAccountFormAccountNumber = signal<string>('');
  bankAccountFormAccountHolder = signal<string>('');
  bankAccountFormIsDefault = signal<boolean>(false);

  // RBAC Permission Computations
  currentUser = computed(() => this.arService.currentUser());
  isViewer = computed(() => this.currentUser().role === 'Viewer');
  isManagerOrAdmin = computed(() => this.currentUser().role === 'Manager' || this.currentUser().role === 'Admin');
  isAdmin = computed(() => this.currentUser().role === 'Admin');

  // Filtered Invoices with multi-filter and sort support
  filteredInvoices = computed(() => {
    const q = this.invoiceSearchQuery().toLowerCase().trim();
    const cat = this.invoiceCategoryFilter();
    const custId = this.invoiceCustomerFilter();
    const dateFilter = this.invoiceDateFilter();
    const sort = this.invoiceSortBy();

    let list = this.arService.invoices().filter(inv => {
      // 1. Text Search Query
      const matchesQuery = !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerNpwp && inv.customerNpwp.toLowerCase().includes(q)) ||
        (inv.invoiceType && inv.invoiceType.toLowerCase().includes(q));

      if (!matchesQuery) return false;

      // 2. Status Category Tab
      if (cat !== 'ALL' && inv.status !== cat) return false;

      // 3. Customer Filter
      if (custId !== 'ALL' && inv.customerId !== custId) return false;

      // 4. Date Range Filter
      if (dateFilter !== 'ALL') {
        const invDate = new Date(inv.issueDate);
        const refDate = new Date(this.arService.today);
        if (dateFilter === 'THIS_MONTH') {
          if (invDate.getFullYear() !== refDate.getFullYear() || invDate.getMonth() !== refDate.getMonth()) return false;
        } else if (dateFilter === 'LAST_MONTH') {
          const lastMonth = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
          if (invDate.getFullYear() !== lastMonth.getFullYear() || invDate.getMonth() !== lastMonth.getMonth()) return false;
        } else if (dateFilter === 'THIS_YEAR') {
          if (invDate.getFullYear() !== refDate.getFullYear()) return false;
        }
      }

      // 4b. Optional Date Range Filter
      if (this.invoiceStartDate() && inv.issueDate < this.invoiceStartDate()) return false;
      if (this.invoiceEndDate() && inv.issueDate > this.invoiceEndDate()) return false;

      return true;
    });

    // 5. Sorting
    return list.sort((a, b) => {
      if (sort === 'dueDate_asc') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sort === 'dueDate_desc') return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      if (sort === 'issueDate_desc') return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
      if (sort === 'balanceDue_desc') return b.balanceDue - a.balanceDue;
      if (sort === 'total_desc') return b.total - a.total;
      return 0;
    });
  });

  // Invoice Category Counts (Strictly Table 4.4.2)
  invoiceCategoryCounts = computed(() => {
    const list = this.arService.invoices();
    return {
      all: list.length,
      draft: list.filter(i => i.status === 'Draft').length,
      issued: list.filter(i => i.status === 'Issued').length,
      partiallyPaid: list.filter(i => i.status === 'Partially Paid').length,
      overdue: list.filter(i => i.status === 'Overdue').length,
      paid: list.filter(i => i.status === 'Paid').length,
      cancelled: list.filter(i => i.status === 'Cancelled').length
    };
  });

  // Summary of filtered invoices (Count, Total amount, Balance due)
  filteredSummary = computed(() => {
    const list = this.filteredInvoices();
    const totalAmount = list.reduce((sum, i) => sum + i.total, 0);
    const balanceDue = list.reduce((sum, i) => sum + i.balanceDue, 0);
    return {
      count: list.length,
      totalAmount,
      balanceDue
    };
  });

  // Dashboard Concepts Switcher: 'inbox' (Morning Triage), 'overdue-queue' (Full-width Collection), 'direct-ledger' (Direct Invoices)
  dashboardConcept = signal<'inbox' | 'overdue-queue' | 'direct-ledger'>('overdue-queue');

  // Priority Overdue Invoices
  priorityOverdueInvoices = computed(() => {
    return this.arService.invoices()
      .filter(i => i.status === 'Overdue')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  });

  overdueTotalBalance = computed(() => {
    return this.priorityOverdueInvoices().reduce((sum, inv) => sum + inv.balanceDue, 0);
  });

  // Draft Invoices awaiting issuance
  draftInvoices = computed(() => {
    return this.arService.invoices().filter(i => i.status === 'Draft');
  });

  // Invoices due within the next 7 days (proactive reminder)
  upcomingDueInvoices = computed(() => {
    const today = new Date(this.arService.today).getTime();
    const sevenDaysLater = today + 7 * 24 * 60 * 60 * 1000;
    return this.arService.invoices()
      .filter(i => {
        if (i.status !== 'Issued' && i.status !== 'Partially Paid') return false;
        const due = new Date(i.dueDate).getTime();
        return due >= today && due <= sevenDaysLater;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  });

  getCustomer(customerId: string): Customer | undefined {
    return this.arService.customers().find(c => c.id === customerId);
  }

  // Filtered Customers with multi-filter and sort support
  filteredCustomers = computed(() => {
    const q = this.customerSearchQuery().toLowerCase().trim();
    const filter = this.customerFilter();
    const balanceFilter = this.customerBalanceFilter();
    const sort = this.customerSortBy();

    let list = this.arService.customers().filter(cust => {
      const matchesQuery = !q ||
        cust.name.toLowerCase().includes(q) ||
        cust.code.toLowerCase().includes(q) ||
        cust.contactPerson.toLowerCase().includes(q) ||
        (cust.nik ? cust.nik.toLowerCase().includes(q) : false) ||
        (cust.npwp ? cust.npwp.toLowerCase().includes(q) : false);

      if (!matchesQuery) return false;

      const hasOverdue = this.arService.invoices().some(i => i.customerId === cust.id && i.status === 'Overdue');
      if (filter === 'OVERDUE' && !hasOverdue) return false;
      if (filter === 'HOLD' && cust.status !== 'credit_hold') return false;

      const totalBalance = this.arService.getCustomerBalance(cust.id);
      const limitUsage = cust.creditLimit > 0 ? (totalBalance / cust.creditLimit) * 100 : 0;

      if (balanceFilter === 'HAS_BALANCE' && totalBalance <= 0) return false;
      if (balanceFilter === 'ZERO_BALANCE' && totalBalance > 0) return false;
      if (balanceFilter === 'NEAR_LIMIT' && limitUsage < 70) return false;

      return true;
    });

    return list.sort((a, b) => {
      if (sort === 'balance_desc') return this.arService.getCustomerBalance(b.id) - this.arService.getCustomerBalance(a.id);
      if (sort === 'name_asc') return a.name.localeCompare(b.name);
      if (sort === 'creditLimit_desc') return b.creditLimit - a.creditLimit;
      return 0;
    });
  });

  // Selected Customer's Invoices
  customerInvoices = computed(() => {
    const cust = this.selectedCustomer();
    if (!cust) return [];
    return this.arService.invoices().filter(i => i.customerId === cust.id);
  });

  // Filtered Customer Invoices in Detail View
  filteredCustomerInvoices = computed(() => {
    const cust = this.selectedCustomer();
    if (!cust) return [];
    const status = this.custDetailInvoiceStatus();
    const startDate = this.custDetailInvoiceStartDate();
    const endDate = this.custDetailInvoiceEndDate();

    return this.arService.invoices().filter(i => {
      if (i.customerId !== cust.id) return false;
      if (status !== 'ALL' && i.status !== status) return false;
      if (startDate && i.issueDate < startDate) return false;
      if (endDate && i.issueDate > endDate) return false;
      return true;
    });
  });

  // Selected Customer's Payments
  customerPayments = computed(() => {
    const cust = this.selectedCustomer();
    if (!cust) return [];
    return this.arService.payments().filter(p => p.customerId === cust.id);
  });

  // Aging Data with Invoices, Risk Filter & Sorting
  agingData = computed(() => {
    const data = this.arService.getAgingReport(this.agingAsOfDate());
    const q = this.agingCustomerSearch().toLowerCase().trim();
    const risk = this.agingRiskFilter();
    const sort = this.agingSortBy();

    let filteredBuckets = data.buckets.filter(b => {
      const matchesQuery = !q ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerCode.toLowerCase().includes(q);

      if (!matchesQuery) return false;

      const overdueAmount = b.days1_30 + b.days31_60 + b.days61_90 + b.days90Plus;
      const criticalAmount = b.days61_90 + b.days90Plus;

      if (risk === 'OVERDUE_ONLY' && overdueAmount <= 0) return false;
      if (risk === 'CRITICAL_ONLY' && criticalAmount <= 0) return false;
      if (risk === 'CURRENT_ONLY' && overdueAmount > 0) return false;

      return true;
    });

    filteredBuckets.sort((a, b) => {
      if (sort === 'total_desc') return b.totalOutstanding - a.totalOutstanding;
      if (sort === 'critical_desc') return (b.days61_90 + b.days90Plus) - (a.days61_90 + a.days90Plus);
      if (sort === 'name_asc') return a.customerName.localeCompare(b.customerName);
      return 0;
    });

    return {
      buckets: filteredBuckets,
      grandTotal: data.grandTotal
    };
  });

  // Filtered Activity Logs with User & Date Range Filter
  filteredActivityLogs = computed(() => {
    const q = this.logSearchQuery().toLowerCase().trim();
    const filterType = this.logTypeFilter();
    const user = this.logUserFilter();
    const startDate = this.logStartDate();
    const endDate = this.logEndDate();

    return this.arService.activityLogs().filter(log => {
      const matchesQuery = !q ||
        log.description.toLowerCase().includes(q) ||
        (log.user && log.user.toLowerCase().includes(q)) ||
        (log.referenceId && log.referenceId.toLowerCase().includes(q));

      if (!matchesQuery) return false;
      if (filterType !== 'ALL' && log.type !== filterType) return false;
      if (user !== 'ALL' && log.user !== user) return false;

      if (startDate && log.timestamp.split(' ')[0] < startDate) return false;
      if (endDate && log.timestamp.split(' ')[0] > endDate) return false;

      return true;
    });
  });

  // Invoice Form Computed Financials (SRS-F-08..13)
  invoiceFormSubtotal = computed(() => {
    return this.invoiceFormLineItems().reduce(
      (acc, item) => acc + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)),
      0
    );
  });

  invoiceFormTaxAmount = computed(() => {
    return Math.round((this.invoiceFormSubtotal() * (Number(this.invoiceFormTaxRate()) || 0)) / 100);
  });

  invoiceFormPphAmount = computed(() => {
    return Math.round((this.invoiceFormSubtotal() * (Number(this.invoiceFormPphRate()) || 0)) / 100);
  });

  invoiceFormTotal = computed(() => {
    const sub = this.invoiceFormSubtotal();
    const ppn = this.invoiceFormTaxAmount();
    const pph = this.invoiceFormPphAmount();
    const dp = Number(this.invoiceFormDpDeduction()) || 0;
    return Math.max(0, sub + ppn - pph - dp);
  });

  // Payment Allocation Computed Totals
  totalAllocatedAmount = computed(() => {
    return this.paymentAllocations().reduce((sum, a) => sum + (Number(a.allocatedAmount) || 0), 0);
  });

  unallocatedAmount = computed(() => {
    return Math.max(0, this.paymentAmount() - this.totalAllocatedAmount());
  });

  // Payment Channels dynamic list based on Method selected (SRS-F-21, SRS-F-22)
  availablePaymentChannels = computed(() => {
    switch (this.paymentMethod()) {
      case 'bank_transfer':
        return ['BCA (Overbooking)', 'Bank Mandiri Giro', 'BNI Giro', 'BRI Kliring / RTGS'];
      case 'virtual_account':
        return ['BCA Virtual Account', 'Mandiri Virtual Account', 'BNI Virtual Account', 'BRI Virtual Account'];
      case 'e_wallet':
        return ['GoPay Corporate Merchant', 'OVO Enterprise', 'ShopeePay Hotel', 'DANA Bisnis'];
      case 'qris':
        return ['QRIS Dinamis (BCA)', 'QRIS Statis Front Desk'];
      case 'credit_card':
        return ['EDC BCA (Visa / Mastercard)', 'EDC Mandiri Corporate Card', 'American Express Terminal'];
      case 'cash':
        return ['Kasir Front Office (Resepsi)', 'Kasir Back Office Keuangan'];
      default:
        return ['Transfer Bank'];
    }
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
  navigateTo(view: V3ActiveView) {
    this.activeView.set(view);
    this.sidebarMobileOpen.set(false);
  }

  toggleSidebarMobile() {
    this.sidebarMobileOpen.update(v => !v);
  }

  viewInvoice(inv: Invoice) {
    this.showActionInbox.set(false);
    this.selectedInvoice.set(inv);
    this.navigateTo('invoice-detail');
  }

  viewCustomer(cust: Customer) {
    this.selectedCustomer.set(cust);
    this.customerActiveTab.set('invoices');
    this.navigateTo('customer-detail');
  }

  // Aging matrix expand/collapse drilldown
  toggleAgingRow(customerId: string) {
    if (this.expandedCustomerAgingId() === customerId) {
      this.expandedCustomerAgingId.set(null);
    } else {
      this.expandedCustomerAgingId.set(customerId);
    }
  }

  // Switch role handler
  changeUserRole(role: UserRole) {
    this.arService.switchUserRole(role);
    this.showToast(`Role pengguna dialihkan ke: ${role} (${this.arService.currentUser().fullName})`, 'info');
  }

  // Trigger Overdue Detection
  runOverdueDetection() {
    const count = this.arService.detectOverdueInvoices();
    if (count > 0) {
      this.showToast(`Pemeriksaan Jatuh Tempo: ${count} invoice telah dialihkan statusnya ke Overdue.`, 'warning');
    } else {
      this.showToast('Semua status invoice mutakhir. Tidak ada invoice baru yang melewati jatuh tempo.', 'success');
    }
  }

  // ==========================================
  // INVOICE CREATE & EDIT ACTIONS (SRS-F-04..15)
  // ==========================================

  startCreateInvoice(preselectedCustomerId?: string) {
    this.showActionInbox.set(false);
    if (this.isViewer()) {
      this.showToast('Akses Ditolak: Akun Viewer hanya memiliki izin baca (Read-Only).', 'danger');
      return;
    }

    const custId = preselectedCustomerId || (this.arService.customers()[0]?.id ?? '');
    this.editingInvoiceId.set(null);
    this.invoiceFormCustomerId.set(custId);
    this.onCustomerSelectedForInvoice(custId);
    this.invoiceFormIssueDate.set(this.arService.today);
    this.invoiceFormInvoiceType.set('Banquet & Event Billing');
    this.invoiceFormTaxRate.set(11);
    this.invoiceFormPphRate.set(2);
    this.invoiceFormDpDeduction.set(0);
    this.invoiceFormSourceType.set('generic');
    this.invoiceFormNotes.set('Jatuh tempo pembayaran sesuai termin tagihan hotel. Pembayaran ditransfer ke rekening BCA PT Galesong Pratama.');
    this.invoiceFormLineItems.set([
      { description: 'Sewa Grand Ballroom & Pre-Function Foyer', itemType: 'Banquet', quantity: 1, unitPrice: 30000000 },
      { description: 'Buffet Catering VIP Package (100 pax)', itemType: 'F&B', quantity: 100, unitPrice: 150000 }
    ]);
    this.navigateTo('invoice-create');
  }

  startEditDraftInvoice(inv: Invoice) {
    if (this.isViewer()) {
      this.showToast('Akses Ditolak: Akun Viewer hanya memiliki izin baca (Read-Only).', 'danger');
      return;
    }

    if (inv.status !== 'Draft') {
      this.showToast('Sesuai SRS-F-15, hanya invoice berstatus Draft yang dapat diubah isinya.', 'warning');
      return;
    }

    this.editingInvoiceId.set(inv.id);
    this.invoiceFormCustomerId.set(inv.customerId);
    this.invoiceFormIssueDate.set(inv.issueDate);
    this.invoiceFormDueDate.set(inv.dueDate);
    this.invoiceFormInvoiceType.set(inv.invoiceType || 'Standard Hospitality Invoice');
    this.invoiceFormTaxRate.set(inv.taxRate || 11);
    this.invoiceFormPphRate.set(inv.pphRate || 0);
    this.invoiceFormDpDeduction.set(inv.dpDeduction || 0);
    this.invoiceFormSourceType.set(inv.sourceType || 'generic');
    this.invoiceFormNotes.set(inv.notes || '');
    this.invoiceFormLineItems.set(
      inv.lineItems.map(item => ({
        description: item.description,
        itemType: item.itemType || 'Service',
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    );
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
      { description: '', itemType: 'Service', quantity: 1, unitPrice: 0 }
    ]);
  }

  removeLineItem(index: number) {
    if (this.invoiceFormLineItems().length <= 1) {
      this.showToast('Invoice harus memiliki sekurang-kurangnya satu rincian item.', 'warning');
      return;
    }
    this.invoiceFormLineItems.update(items => items.filter((_, i) => i !== index));
  }

  saveInvoice(saveAs: 'Draft' | 'Issued') {
    if (this.isViewer()) {
      this.showToast('Akses Ditolak: Akun Viewer tidak memiliki izin membuat invoice.', 'danger');
      return;
    }

    const items = this.invoiceFormLineItems().filter(i => i.description.trim() !== '');
    if (items.length === 0) {
      this.showToast('Tambahkan sekurang-kurangnya satu item rincian invoice dengan deskripsi.', 'warning');
      return;
    }

    if (this.invoiceFormDueDate() < this.invoiceFormIssueDate()) {
      this.showToast('Tanggal jatuh tempo tidak boleh lebih awal dari tanggal invoice (SRS-F-14).', 'danger');
      return;
    }

    const isEditing = !!this.editingInvoiceId();

    if (isEditing) {
      const result = this.arService.updateDraftInvoice(this.editingInvoiceId()!, {
        customerId: this.invoiceFormCustomerId(),
        issueDate: this.invoiceFormIssueDate(),
        dueDate: this.invoiceFormDueDate(),
        invoiceType: this.invoiceFormInvoiceType(),
        lineItems: items,
        taxRate: this.invoiceFormTaxRate(),
        pphRate: this.invoiceFormPphRate(),
        dpDeduction: this.invoiceFormDpDeduction(),
        notes: this.invoiceFormNotes(),
        sourceType: this.invoiceFormSourceType()
      });

      if (result.success && result.invoice) {
        if (saveAs === 'Issued') {
          this.arService.issueInvoice(result.invoice.id);
        }
        this.showToast(result.message, 'success');
        const refreshed = this.arService.invoices().find(i => i.id === result.invoice!.id);
        if (refreshed) this.viewInvoice(refreshed);
      } else {
        this.showToast(result.message, 'danger');
      }
    } else {
      const newInvoice = this.arService.createInvoice({
        customerId: this.invoiceFormCustomerId(),
        issueDate: this.invoiceFormIssueDate(),
        dueDate: this.invoiceFormDueDate(),
        invoiceType: this.invoiceFormInvoiceType(),
        lineItems: items,
        taxRate: this.invoiceFormTaxRate(),
        pphRate: this.invoiceFormPphRate(),
        dpDeduction: this.invoiceFormDpDeduction(),
        notes: this.invoiceFormNotes(),
        sourceType: this.invoiceFormSourceType(),
        saveAs
      });

      this.showToast(`Invoice ${newInvoice.invoiceNumber} berhasil disimpan sebagai ${newInvoice.status}!`, 'success');
      this.viewInvoice(newInvoice);
    }
  }

  // Issue Draft Invoice explicitly (UC-03, SRS-F-16)
  issueDraftInvoice(inv: Invoice) {
    if (this.isViewer()) {
      this.showToast('Akses Ditolak: Akun Viewer tidak memiliki izin menerbitkan invoice.', 'danger');
      return;
    }

    const result = this.arService.issueInvoice(inv.id);
    if (result.success) {
      this.showToast(result.message, 'success');
      const refreshed = this.arService.invoices().find(i => i.id === inv.id);
      if (refreshed) this.selectedInvoice.set(refreshed);
    } else {
      this.showToast(result.message, 'danger');
    }
  }

  // Cancel Invoice Dialog (UC-04, SRS-F-18)
  openCancelInvoiceModal(inv: Invoice) {
    if (!this.isManagerOrAdmin()) {
      this.showToast('Akses Ditolak: Pembatalan invoice memerlukan hak akses role Manager atau Admin (SRS-F-17 & UC-04).', 'danger');
      return;
    }

    if (inv.amountPaid > 0) {
      this.showToast('Invoice Memiliki Pembayaran: Invoice yang telah memiliki pembayaran teralokasi tidak dapat dibatalkan (SRS-F-18).', 'danger');
      return;
    }

    this.cancelInvoiceTarget.set(inv);
    this.cancelReason.set('');
    this.showCancelModal.set(true);
  }

  confirmCancelInvoice() {
    const inv = this.cancelInvoiceTarget();
    if (!inv) return;

    const reason = this.cancelReason().trim();
    if (!reason) {
      this.showToast('Harap isi alasan pembatalan invoice (wajib diisi per SRS-F-18).', 'warning');
      return;
    }

    const result = this.arService.cancelInvoice(inv.id, reason);
    if (result.success) {
      this.showCancelModal.set(false);
      this.showToast(result.message, 'success');
      const refreshed = this.arService.invoices().find(i => i.id === inv.id);
      if (refreshed) this.selectedInvoice.set(refreshed);
    } else {
      this.showToast(result.message, 'danger');
    }
  }

  // ==========================================
  // PAYMENT MODAL ACTIONS (UC-05..06, SRS-F-20..31)
  // ==========================================

  openPaymentModal(targetCustomerId?: string, targetInvoiceId?: string) {
    if (this.isViewer()) {
      this.showToast('Akses Ditolak: Akun Viewer tidak memiliki izin mencatat pembayaran.', 'danger');
      return;
    }

    const customers = this.arService.customers();
    const custId = targetCustomerId || (customers[0]?.id ?? '');
    this.paymentCustomerId.set(custId);
    this.paymentDate.set(this.arService.today);
    this.paymentMethod.set('bank_transfer');
    this.paymentChannel.set(this.availablePaymentChannels()[0]);

    // Select default hotel bank account
    const defaultBank = this.arService.bankAccounts().find(b => b.isDefault) || this.arService.bankAccounts()[0];
    this.paymentBankAccountId.set(defaultBank ? defaultBank.id : '');

    this.paymentAdminFee.set(0);
    this.paymentRef.set(`TRF-BCA-${Math.floor(100000 + Math.random() * 900000)}`);
    this.paymentNotes.set('');
    this.paymentIsDownPayment.set(false);

    this.loadInvoicesForPayment(custId, targetInvoiceId);
    this.showActionInbox.set(false);
    this.showPaymentModal.set(true);
  }

  onPaymentMethodChange(method: PaymentMethod) {
    this.paymentMethod.set(method);
    const channels = this.availablePaymentChannels();
    this.paymentChannel.set(channels[0] || '');

    // Set appropriate prefix for reference
    const rand = Math.floor(100000 + Math.random() * 900000);
    if (method === 'bank_transfer') this.paymentRef.set(`TRF-BCA-${rand}`);
    else if (method === 'virtual_account') this.paymentRef.set(`VA-BCA-${rand}`);
    else if (method === 'qris') this.paymentRef.set(`QRIS-NMD-${rand}`);
    else if (method === 'e_wallet') this.paymentRef.set(`EWL-GOPAY-${rand}`);
    else if (method === 'credit_card') this.paymentRef.set(`EDC-BCA-${rand}`);
    else this.paymentRef.set(`KW-CASH-${rand}`);
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

  autoAllocateOldestFirst() {
    const totalAmount = this.paymentAmount();
    if (totalAmount <= 0) {
      this.showToast('Masukkan nominal pembayaran lebih dari 0 untuk auto-alokasi.', 'warning');
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
    this.showToast(`Auto-alokasi berhasil: ${this.formatMoney(totalAmount - remaining)} teralokasi ke invoice tertua.`, 'success');
  }

  submitPayment() {
    if (this.isViewer()) {
      this.showToast('Akses Ditolak: Akun Viewer tidak memiliki izin mencatat pembayaran.', 'danger');
      return;
    }

    const amount = Number(this.paymentAmount()) || 0;
    if (amount <= 0) {
      this.showToast('Nominal pembayaran harus lebih besar dari 0.', 'warning');
      return;
    }

    const isDP = this.paymentIsDownPayment();
    const allocs = this.paymentAllocations()
      .filter(a => Number(a.allocatedAmount) > 0)
      .map(a => ({ invoiceId: a.invoiceId, allocatedAmount: Number(a.allocatedAmount) }));

    if (!isDP && allocs.length === 0) {
      this.showToast('Alokasikan pembayaran ke sekurang-kurangnya satu invoice, atau centang Uang Muka (DP).', 'warning');
      return;
    }

    const totalAlloc = allocs.reduce((sum, a) => sum + a.allocatedAmount, 0);
    if (!isDP && totalAlloc > amount) {
      this.showToast(`Total alokasi (${this.formatMoney(totalAlloc)}) melebihi nominal pembayaran (${this.formatMoney(amount)}). Sesuaikan angka alokasi (SRS-F-26).`, 'danger');
      return;
    }

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
      allocations: allocs
    });

    if (payment) {
      this.showPaymentModal.set(false);
      this.showToast(`Pembayaran ${payment.paymentNumber} berhasil dicatat via ${payment.paymentChannel || 'Bank Transfer'}!`, 'success');

      if (this.selectedInvoice()) {
        const refreshed = this.arService.invoices().find(i => i.id === this.selectedInvoice()!.id);
        if (refreshed) this.selectedInvoice.set(refreshed);
      }
    } else {
      this.showToast('Gagal mencatat pembayaran.', 'danger');
    }
  }

  // ==========================================
  // CUSTOMER CRUD & DELETE (SRS-F-01..03)
  // ==========================================

  openNewCustomerModal() {
    if (this.isViewer()) {
      this.showToast('Akses Ditolak: Akun Viewer tidak memiliki izin mendaftarkan customer.', 'danger');
      return;
    }

    this.isEditingCustomer.set(false);
    this.editingCustomerId.set('');
    this.customerFormName.set('');
    this.customerFormContact.set('');
    this.customerFormEmail.set('');
    this.customerFormPhone.set('');
    this.customerFormAddress.set('');
    this.customerFormNik.set('');
    this.customerFormNpwp.set('');
    this.customerFormCreditLimit.set(100000000);
    this.customerFormDueDays.set(30);
    this.customerFormStatus.set('active');
    this.customerFormNotes.set('');
    this.showCustomerModal.set(true);
  }

  openEditCustomerModal(cust: Customer) {
    if (this.isViewer()) {
      this.showToast('Akses Ditolak: Akun Viewer tidak memiliki izin mengubah data customer.', 'danger');
      return;
    }

    this.isEditingCustomer.set(true);
    this.editingCustomerId.set(cust.id);
    this.customerFormName.set(cust.name);
    this.customerFormContact.set(cust.contactPerson);
    this.customerFormEmail.set(cust.email);
    this.customerFormPhone.set(cust.phone);
    this.customerFormAddress.set(cust.address);
    this.customerFormNik.set(cust.nik || '');
    this.customerFormNpwp.set(cust.npwp || '');
    this.customerFormCreditLimit.set(cust.creditLimit);
    this.customerFormDueDays.set(cust.dueDays);
    this.customerFormStatus.set(cust.status);
    this.customerFormNotes.set(cust.notes || '');
    this.showCustomerModal.set(true);
  }

  submitCustomerForm() {
    const name = this.customerFormName().trim();
    if (!name) {
      this.showToast('Nama pelanggan atau badan usaha wajib diisi (SRS-F-01).', 'warning');
      return;
    }

    if (this.isEditingCustomer()) {
      const result = this.arService.updateCustomer(this.editingCustomerId(), {
        name,
        contactPerson: this.customerFormContact().trim(),
        email: this.customerFormEmail().trim(),
        phone: this.customerFormPhone().trim(),
        address: this.customerFormAddress().trim(),
        nik: this.customerFormNik().trim(),
        npwp: this.customerFormNpwp().trim(),
        creditLimit: Number(this.customerFormCreditLimit()) || 0,
        dueDays: Number(this.customerFormDueDays()) || 30,
        status: this.customerFormStatus(),
        notes: this.customerFormNotes().trim()
      });

      if (result.success) {
        this.showCustomerModal.set(false);
        this.showToast(result.message, 'success');
        if (this.selectedCustomer()?.id === this.editingCustomerId()) {
          const refreshed = this.arService.getCustomer(this.editingCustomerId());
          if (refreshed) this.selectedCustomer.set(refreshed);
        }
      } else {
        this.showToast(result.message, 'danger');
      }
    } else {
      const newCust = this.arService.createCustomer({
        name,
        contactPerson: this.customerFormContact().trim(),
        email: this.customerFormEmail().trim(),
        phone: this.customerFormPhone().trim(),
        address: this.customerFormAddress().trim(),
        nik: this.customerFormNik().trim(),
        npwp: this.customerFormNpwp().trim(),
        creditLimit: Number(this.customerFormCreditLimit()) || 100000000,
        dueDays: Number(this.customerFormDueDays()) || 30,
        status: this.customerFormStatus(),
        notes: this.customerFormNotes().trim()
      });

      if (newCust) {
        this.showCustomerModal.set(false);
        this.showToast(`Pelanggan baru "${newCust.name}" (${newCust.code}) berhasil didaftarkan!`, 'success');
        this.viewCustomer(newCust);
      } else {
        this.showToast('Gagal mendaftarkan pelanggan.', 'danger');
      }
    }
  }

  // Generic Safe Deletion Confirmation (SRS-F-03, SRS-F-15, SRS-NF-08)
  requestDeleteCustomer(cust: Customer) {
    if (this.isViewer()) {
      this.showToast('Akses Ditolak: Akun Viewer tidak memiliki izin menghapus customer.', 'danger');
      return;
    }

    const hasInvoices = this.arService.customerHasInvoices(cust.id);
    const invoiceCount = this.arService.getCustomerInvoiceCount(cust.id);

    this.deleteState.set({
      type: 'customer',
      id: cust.id,
      title: 'Hapus Data Pelanggan',
      name: `${cust.name} (${cust.code})`,
      message: hasInvoices
        ? `Sesuai aturan SRS-F-03, pelanggan "${cust.name}" TIDAK DAPAT DIHAPUS karena telah memiliki ${invoiceCount} invoice terdaftar di dalam sistem.`
        : `Apakah Anda yakin ingin menghapus data pelanggan "${cust.name}"? Tindakan ini tidak dapat dibatalkan.`,
      canDelete: !hasInvoices,
      blockedReason: hasInvoices
        ? `Pelanggan memiliki ${invoiceCount} riwayat invoice. Data transaksi keuangan harus tetap tersimpan untuk integritas audit (SRS-NF-08).`
        : undefined
    });
    this.showDeleteModal.set(true);
  }

  requestDeleteInvoice(inv: Invoice) {
    if (this.isViewer()) {
      this.showToast('Akses Ditolak: Akun Viewer tidak memiliki izin menghapus invoice.', 'danger');
      return;
    }

    const canDelete = inv.status === 'Draft';
    this.deleteState.set({
      type: 'invoice',
      id: inv.id,
      title: 'Hapus Invoice',
      name: `${inv.invoiceNumber} (${inv.customerName})`,
      message: canDelete
        ? `Apakah Anda yakin ingin menghapus invoice Draft "${inv.invoiceNumber}"? Seluruh rincian item akan dihapus permanen.`
        : `Sesuai aturan SRS-F-15 & SRS-NF-08, invoice berstatus "${inv.status}" TIDAK DAPAT DIHAPUS. Hanya invoice berstatus Draft yang dapat dihapus. Untuk membatalkan tagihan resmi, gunakan fungsi "Batalkan Invoice".`,
      canDelete,
      blockedReason: !canDelete
        ? `Invoice telah diterbitkan (Status: ${inv.status}). Data faktur resmi tidak boleh dihapus secara fisik demi kepatuhan audit keuangan (SRS-NF-16).`
        : undefined
    });
    this.showDeleteModal.set(true);
  }

  requestDeletePayment(pay: Payment) {
    if (!this.isManagerOrAdmin()) {
      this.showToast('Akses Ditolak: Pembatalan pembayaran memerlukan hak akses role Manager atau Admin.', 'danger');
      return;
    }

    this.deleteState.set({
      type: 'payment',
      id: pay.id,
      title: 'Batalkan / Rollback Pembayaran',
      name: `${pay.paymentNumber} (${this.formatMoney(pay.amount)})`,
      message: `Apakah Anda yakin ingin membatalkan pembayaran ${pay.paymentNumber}? Sistem akan memulihkan sisa tagihan (outstanding balance) pada invoice terkait secara otomatis.`,
      canDelete: true
    });
    this.showDeleteModal.set(true);
  }

  requestDeleteBankAccount(bank: BankAccount) {
    if (!this.isAdmin()) {
      this.showToast('Akses Ditolak: Pengelolaan rekening bank hanya dapat dilakukan oleh role Admin (UC-07).', 'danger');
      return;
    }

    const isUsed = this.arService.payments().some(p => p.bankAccountId === bank.id);
    this.deleteState.set({
      type: 'bank_account',
      id: bank.id,
      title: 'Hapus Rekening Bank',
      name: `${bank.bankName} - ${bank.accountNumber}`,
      message: isUsed
        ? `Rekening ${bank.bankName} (${bank.accountNumber}) telah digunakan pada transaksi pembayaran dan tidak dapat dihapus sesuai SRS-F-32.`
        : `Apakah Anda yakin ingin menghapus rekening bank ${bank.bankName} (${bank.accountNumber})?`,
      canDelete: !isUsed,
      blockedReason: isUsed ? 'Rekening bank telah memiliki riwayat penerimaan pembayaran.' : undefined
    });
    this.showDeleteModal.set(true);
  }

  executeConfirmedDelete() {
    const state = this.deleteState();
    if (!state || !state.canDelete) return;

    if (state.type === 'customer') {
      const res = this.arService.deleteCustomer(state.id);
      if (res.success) {
        this.showToast(res.message, 'success');
        this.showDeleteModal.set(false);
        this.navigateTo('customers');
      } else {
        this.showToast(res.message, 'danger');
      }
    } else if (state.type === 'invoice') {
      const res = this.arService.deleteDraftInvoice(state.id);
      if (res.success) {
        this.showToast(res.message, 'success');
        this.showDeleteModal.set(false);
        this.navigateTo('invoices');
      } else {
        this.showToast(res.message, 'danger');
      }
    } else if (state.type === 'payment') {
      const res = this.arService.deletePayment(state.id);
      if (res.success) {
        this.showToast(res.message, 'success');
        this.showDeleteModal.set(false);
        if (this.selectedInvoice()) {
          const refreshed = this.arService.invoices().find(i => i.id === this.selectedInvoice()!.id);
          if (refreshed) this.selectedInvoice.set(refreshed);
        }
      } else {
        this.showToast(res.message, 'danger');
      }
    } else if (state.type === 'bank_account') {
      const res = this.arService.deleteBankAccount(state.id);
      if (res.success) {
        this.showToast(res.message, 'success');
        this.showDeleteModal.set(false);
      } else {
        this.showToast(res.message, 'danger');
      }
    }
  }

  // ==========================================
  // BANK ACCOUNT CRUD (UC-07, SRS-F-32)
  // ==========================================

  openNewBankAccountModal() {
    if (!this.isAdmin()) {
      this.showToast('Akses Ditolak: Hanya Admin yang dapat mengelola rekening bank (UC-07).', 'danger');
      return;
    }

    this.isEditingBankAccount.set(false);
    this.editingBankAccountId.set('');
    this.bankAccountFormBankName.set('');
    this.bankAccountFormAccountNumber.set('');
    this.bankAccountFormAccountHolder.set('PT Galesong Pratama');
    this.bankAccountFormIsDefault.set(false);
    this.showBankAccountModal.set(true);
  }

  openEditBankAccountModal(b: BankAccount) {
    if (!this.isAdmin()) {
      this.showToast('Akses Ditolak: Hanya Admin yang dapat mengelola rekening bank (UC-07).', 'danger');
      return;
    }

    this.isEditingBankAccount.set(true);
    this.editingBankAccountId.set(b.id);
    this.bankAccountFormBankName.set(b.bankName);
    this.bankAccountFormAccountNumber.set(b.accountNumber);
    this.bankAccountFormAccountHolder.set(b.accountHolder);
    this.bankAccountFormIsDefault.set(b.isDefault || false);
    this.showBankAccountModal.set(true);
  }

  submitBankAccountForm() {
    const bankName = this.bankAccountFormBankName().trim();
    const accNo = this.bankAccountFormAccountNumber().trim();
    const holder = this.bankAccountFormAccountHolder().trim();

    if (!bankName || !accNo || !holder) {
      this.showToast('Nama bank, nomor rekening, dan nama pemilik rekening wajib diisi.', 'warning');
      return;
    }

    if (this.isEditingBankAccount()) {
      const res = this.arService.updateBankAccount(this.editingBankAccountId(), {
        bankName,
        accountNumber: accNo,
        accountHolder: holder,
        isDefault: this.bankAccountFormIsDefault()
      });
      if (res.success) {
        this.showBankAccountModal.set(false);
        this.showToast(res.message, 'success');
      } else {
        this.showToast(res.message, 'danger');
      }
    } else {
      const res = this.arService.createBankAccount({
        bankName,
        accountNumber: accNo,
        accountHolder: holder,
        isDefault: this.bankAccountFormIsDefault()
      });
      if (res.success) {
        this.showBankAccountModal.set(false);
        this.showToast(res.message, 'success');
      } else {
        this.showToast(res.message, 'danger');
      }
    }
  }

  // ==========================================
  // PDF PREVIEW & EXPORT (UC-08, SRS-F-35)
  // ==========================================

  openPdfPreview(inv?: Invoice) {
    if (inv) this.selectedInvoice.set(inv);
    this.showPdfModal.set(true);
  }

  // Toast notification utility
  showToast(msg: string, type: 'success' | 'danger' | 'info' | 'warning' = 'info') {
    this.toastMessage.set(msg);
    this.toastType.set(type);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 4500);
  }

  // Payments applied to selected invoice
  getPaymentsForInvoice(invoiceId: string) {
    return this.arService.payments().filter(p =>
      p.allocations.some(a => a.invoiceId === invoiceId)
    );
  }

  // Bank Account helper
  getBankAccount(bankId?: string): BankAccount | undefined {
    if (!bankId) return undefined;
    return this.arService.bankAccounts().find(b => b.id === bankId);
  }

  // Customer credit utilization percentage
  getCustomerCreditUtilization(cust: Customer): number {
    const bal = this.arService.getCustomerBalance(cust.id);
    if (!cust.creditLimit || cust.creditLimit <= 0) return 0;
    return Math.min(100, Math.round((bal / cust.creditLimit) * 100));
  }
}
