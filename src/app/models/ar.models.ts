export type InvoiceStatus =
  | 'Draft'
  | 'Issued'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Cancelled'
  | 'Sent'
  | 'Partial'
  | 'Void';

export type PaymentMethod =
  | 'bank_transfer'
  | 'virtual_account'
  | 'e_wallet'
  | 'qris'
  | 'credit_card'
  | 'cash'
  | 'cheque';

export type UserRole = 'Admin' | 'User' | 'Manager' | 'Viewer';

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault?: boolean;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  nik?: string;   // 16 digits
  npwp?: string;  // 15 or 16 digits
  creditLimit: number;
  dueDays: number;
  status: 'active' | 'credit_hold';
  notes?: string;
  createdAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  itemType?: 'Room' | 'F&B' | 'Banquet' | 'Service' | 'Facility' | 'Other';
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerNik?: string;
  customerNpwp?: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  invoiceType: string;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;      // PPN percentage e.g. 11%
  taxAmount: number;    // PPN amount
  pphRate: number;      // PPh withholding percentage e.g. 2% (PPh 23)
  pphAmount: number;    // PPh withholding amount
  dpDeduction: number;  // Potongan Uang Muka (DP deduction)
  total: number;        // Final total payable = subtotal + taxAmount - pphAmount - dpDeduction
  amountPaid: number;
  balanceDue: number;   // Outstanding balance = total - amountPaid
  notes?: string;
  sourceType: 'generic' | 'city_ledger' | 'direct';
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  voidDate?: string;
  voidReason?: string;
}

export interface PaymentAllocation {
  invoiceId: string;
  invoiceNumber: string;
  allocatedAmount: number;
  timesPaid?: number; // Urutan pembayaran / installment sequence (Ke-1, Ke-2, etc.)
}

export interface Payment {
  id: string;
  paymentNumber: string;
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  paymentChannel: string; // e.g. BCA, Mandiri, BCA VA, GoPay, OVO, ShopeePay, EDC BCA, Tunai Front Office
  referenceNumber: string;
  adminFee?: number;
  bankAccountId?: string;
  notes?: string;
  allocations: PaymentAllocation[];
  isDownPayment?: boolean; // Payment recorded as unallocated down payment
  createdAt: string;
}

export interface AgingBucket {
  customerId: string;
  customerCode: string;
  customerName: string;
  current: number;      // Belum Jatuh Tempo
  days1_30: number;     // 1-30 Hari
  days31_60: number;    // 31-60 Hari
  days61_90: number;    // 61-90 Hari
  days90Plus: number;   // >90 Hari (Critical)
  totalOutstanding: number;
  invoices?: Invoice[]; // Underlying invoices for drill-down (SRS-F-34)
}

export interface DashboardMetrics {
  totalOutstanding: number;
  totalOverdue: number;
  collectedThisMonth: number;
  openInvoicesCount: number;
  overdueInvoicesCount: number;
  paidThisMonthCount: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user?: string;
  role?: UserRole;
  type:
    | 'invoice_created'
    | 'invoice_issued'
    | 'invoice_updated'
    | 'invoice_deleted'
    | 'invoice_cancelled'
    | 'payment_recorded'
    | 'payment_deleted'
    | 'customer_created'
    | 'customer_updated'
    | 'customer_deleted'
    | 'bank_account_created'
    | 'bank_account_deleted'
    | 'status_changed';
  description: string;
  amount?: number;
  referenceId?: string;
  badgeType: 'info' | 'success' | 'warning' | 'danger' | 'secondary';
}
