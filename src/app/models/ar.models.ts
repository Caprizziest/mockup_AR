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

export interface InstallmentItem {
  installmentNumber: number; // Angsuran Ke-1, Ke-2, dst.
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: 'Unpaid' | 'Paid' | 'Overdue';
  paidDate?: string;
}

export interface CustomerDpTransaction {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  type: 'deposit' | 'applied'; // Setoran DP atau Pemotongan ke Invoice
  amount: number;
  balanceAfter: number;
  invoiceNumber?: string;
  paymentNumber?: string;
  referenceNumber?: string;
  notes: string;
}

export interface MutasiCustomerSummary {
  customerId: string;
  customerName: string;
  transactionCount: number;
  totalPiutang: number;
  piutangDibayar: number;
  saldo: number;
}

export interface MutasiTransactionDetail {
  id: string;
  tanggal: string;
  noInvoice: string;
  noKwitansi: string;
  keterangan: string;
  piutang: number;
  terbayar: number;
  saldo: number;
  type: 'invoice' | 'payment';
}

export interface KartuPiutangRow {
  // Penagihan Piutang (Debet)
  tglTerbit?: string;
  noInvoice?: string;
  noBuktiJurnalDebet?: string;
  keteranganDebet?: string;
  nominalDebet?: number;
  tglJatuhTempo?: string;
  
  // Pembayaran Piutang (Kredit)
  tglBayar?: string;
  noBuktiJurnalKredit?: string;
  keteranganKredit?: string;
  nominalKredit?: number;
  diskon?: number;
  saldoPiutang?: number;
  umurPiutang?: number;

  // Denda (Penalti & Penghapusan)
  nominalDenda?: number;
  tglBayarDenda?: string;
  noBuktiJurnalDenda?: string;
  keteranganDenda?: string;
  nominalBayarDenda?: number;
  tglHapusDenda?: string;
  memoHapusDenda?: string;
  keteranganHapusDenda?: string;
  nominalHapusDenda?: number;
  saldoDenda?: number;
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
  dpBalance?: number; // Saldo Uang Muka yang tersedia
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
  journalNumber?: string; // No Bukti Jurnal Akuntansi Galesong (e.g. FN00260803008)
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

  // Fitur Cicilan (Installments) & Rollover
  isInstallment?: boolean;
  installmentCount?: number;            // e.g. 3 kali
  installmentIntervalDays?: number;     // e.g. 30 hari
  installmentSchedule?: InstallmentItem[];
  timesOverdue?: number;                // Berapa kali jatuh tempo terlewati
  hasRollover?: boolean;                // Apakah tagihan ini mencakup akumulasi tunggakan sebelumnya
  rolledOverAmount?: number;            // Nominal tunggakan yang digulung
  rolledOverFrom?: string;              // Nomor invoice asal tunggakan
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
  journalNumber?: string;       // No Bukti Jurnal Kas/Bank Galesong (e.g. BD00260828001)
  kwitansiNumber?: string;      // No Kwitansi Resmi (e.g. 540/KLBR-FNC/MKS/I/2026)
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  discountAmount?: number;      // Diskon pembayaran pelunasan jika ada
  method: PaymentMethod;
  paymentChannel: string;       // e.g. BCA, Mandiri, BCA VA, GoPay, OVO, ShopeePay, EDC BCA, Tunai Front Office
  referenceNumber: string;
  adminFee?: number;
  bankAccountId?: string;
  notes?: string;
  allocations: PaymentAllocation[];
  isDownPayment?: boolean;      // Payment recorded as unallocated down payment
  createdAt: string;

  // Income Audit Status (Pencatatan kas masuk vs Verifikasi Fisik oleh Dept FA)
  auditStatus?: 'pending_fa' | 'verified_fa';
  auditedBy?: string;
  auditedAt?: string;
  auditNotes?: string;

  // Lampiran Bukti Transfer / Slip Setoran Bank (Bukti Fisik Pajak & Audit)
  attachmentName?: string;
  attachmentSize?: string;
  attachmentUrl?: string;

  // Penanganan Kelebihan Bayar (Overpayment dialihkan ke Saldo Deposit / AP Tamu)
  overpaymentToDeposit?: number;
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
