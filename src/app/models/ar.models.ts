export type InvoiceStatus = 'Draft' | 'Sent' | 'Partial' | 'Paid' | 'Overdue' | 'Void';

export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'cash' | 'cheque';

export interface Customer {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  creditLimit: number;
  dueDays: number;
  status: 'active' | 'credit_hold';
  notes?: string;
  createdAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number; // in percentage e.g. 11 for 11%
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  sourceType: 'generic' | 'city_ledger' | 'direct';
  createdAt: string;
  voidReason?: string;
  voidDate?: string;
}

export interface PaymentAllocation {
  invoiceId: string;
  invoiceNumber: string;
  allocatedAmount: number;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber: string;
  notes?: string;
  allocations: PaymentAllocation[];
  createdAt: string;
}

export interface AgingBucket {
  customerId: string;
  customerCode: string;
  customerName: string;
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90Plus: number;
  totalOutstanding: number;
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
  type: 'invoice_created' | 'payment_recorded' | 'invoice_voided' | 'status_changed' | 'customer_created';
  description: string;
  amount?: number;
  referenceId?: string;
  badgeType: 'info' | 'success' | 'warning' | 'danger' | 'secondary';
}
