import { Injectable, signal, computed } from '@angular/core';
import {
  Customer,
  Invoice,
  Payment,
  AgingBucket,
  DashboardMetrics,
  ActivityLog,
  InvoiceStatus,
  PaymentMethod,
  BankAccount,
  UserRole,
  AppUser,
  LineItem
} from '../models/ar.models';

@Injectable({
  providedIn: 'root'
})
export class ArDataService {
  // Today reference (YYYY-MM-DD)
  readonly today = '2026-09-16';

  // Current logged in user & role (Interactive RBAC Switcher)
  readonly currentUser = signal<AppUser>({
    id: 'user-01',
    username: 'finance.ar',
    fullName: 'Staf Penagihan AR',
    role: 'Admin' // Default to Admin so user can test all features, or switch freely
  });

  // Hotel Master Bank Accounts (SRS-F-32, UC-07)
  readonly bankAccounts = signal<BankAccount[]>([
    {
      id: 'bank-01',
      bankName: 'Bank Central Asia (BCA)',
      accountNumber: '802-099-1234',
      accountHolder: 'PT Galesong Pratama - Hotel Operations',
      isDefault: true
    },
    {
      id: 'bank-02',
      bankName: 'Bank Mandiri',
      accountNumber: '137-00-1928374-1',
      accountHolder: 'PT Galesong Pratama',
      isDefault: false
    },
    {
      id: 'bank-03',
      bankName: 'Bank Negara Indonesia (BNI)',
      accountNumber: '028-394-8192',
      accountHolder: 'PT Galesong Pratama - Banquet & Events',
      isDefault: false
    }
  ]);

  // Reactive Customers with NIK & NPWP (SRS-F-01, SRS-F-02, SRS-F-03)
  readonly customers = signal<Customer[]>([
    {
      id: 'cust-1',
      code: 'CUST-001',
      name: 'PT Telekomunikasi Nusantara Tbk',
      contactPerson: 'Bambang Sudiro',
      email: 'finance@telkom-nusantara.co.id',
      phone: '+62 21 5299 1000',
      address: 'Jl. Jend. Gatot Subroto Kav. 52, Jakarta Selatan',
      nik: '3174051203840001',
      npwp: '01.345.678.9-012.000',
      creditLimit: 250000000,
      dueDays: 30,
      status: 'active',
      notes: 'Key Corporate Account - Net 30 terms negotiated',
      createdAt: '2026-01-10'
    },
    {
      id: 'cust-2',
      code: 'CUST-002',
      name: 'PT Sinarmas Mitra Sejati',
      contactPerson: 'Dewi Lestari',
      email: 'ar-vendor@sinarmas-mitra.com',
      phone: '+62 21 3925 800',
      address: 'Plaza Simas Jl. Fachrudin No. 18, Jakarta Pusat',
      nik: '3171025508890002',
      npwp: '02.456.789.0-013.000',
      creditLimit: 150000000,
      dueDays: 30,
      status: 'active',
      notes: 'Consistent prompt payer, electronic remittance via BCA',
      createdAt: '2026-02-14'
    },
    {
      id: 'cust-3',
      code: 'CUST-003',
      name: 'CV Surya Perkasa Mandiri',
      contactPerson: 'Hendrik Pratama',
      email: 'hpratama@suryaperkasa.id',
      phone: '+62 31 5678 990',
      address: 'Kawasan Industri Rungkut Blok B-4, Surabaya',
      nik: '3578011904770003',
      npwp: '03.567.890.1-014.000',
      creditLimit: 80000000,
      dueDays: 14,
      status: 'credit_hold',
      notes: 'Overdue > 60 days on banquet reservation. Credit hold active.',
      createdAt: '2026-03-01'
    },
    {
      id: 'cust-4',
      code: 'CUST-004',
      name: 'Grand Horizon Resort & Hospitality',
      contactPerson: 'Amanda Putri',
      email: 'accounting@grandhorizonresort.com',
      phone: '+62 361 771 234',
      address: 'Kawasan Pariwisata Nusa Dua Lot NW-1, Bali',
      nik: '5171034407920004',
      npwp: '04.678.901.2-015.000',
      creditLimit: 300000000,
      dueDays: 45,
      status: 'active',
      notes: 'City Ledger Corporate client - seasonal banquet and guest suites',
      createdAt: '2026-03-20'
    },
    {
      id: 'cust-5',
      code: 'CUST-005',
      name: 'PT Karya Bakti Integra',
      contactPerson: 'Rudi Hartono',
      email: 'invoicing@karyabakti.co.id',
      phone: '+62 22 4208 112',
      address: 'Jl. Asia Afrika No. 115, Bandung',
      nik: '3273062306850005',
      npwp: '05.789.012.3-016.000',
      creditLimit: 100000000,
      dueDays: 30,
      status: 'active',
      notes: 'Monthly executive meeting room and catering package',
      createdAt: '2026-04-05'
    },
    {
      id: 'cust-6',
      code: 'CUST-006',
      name: 'PT Digital Kreasi Media',
      contactPerson: 'Siti Rahmawati',
      email: 'billing@digitalkreasi.com',
      phone: '+62 21 7268 440',
      address: 'One Pacific Place Lt. 15, SCBD Jakarta',
      nik: '3174096001940006',
      npwp: '06.890.123.4-017.000',
      creditLimit: 60000000,
      dueDays: 15,
      status: 'active',
      notes: 'Company annual gala dinner booking, Net 15 terms',
      createdAt: '2026-05-12'
    },
    {
      id: 'cust-7',
      code: 'CUST-007',
      name: 'Dr. Hendra Wijaya, Sp.A',
      contactPerson: 'Dr. Hendra Wijaya',
      email: 'hendra.wijaya@gmail.com',
      phone: '+62 811 882 391',
      address: 'Jl. Cemara Indah No. 42, Menteng, Jakarta Pusat',
      nik: '3171011503780007',
      npwp: '07.901.234.5-018.000',
      creditLimit: 50000000,
      dueDays: 14,
      status: 'active',
      notes: 'Individual VIP Customer (No active invoices - test deletion candidate)',
      createdAt: '2026-09-01'
    }
  ]);

  // Reactive Invoices adhering strictly to SRS Table 4.4.2 & Hospitality Context
  readonly invoices = signal<Invoice[]>([
    {
      id: 'inv-101',
      invoiceNumber: 'INV-2026-0001',
      customerId: 'cust-1',
      customerName: 'PT Telekomunikasi Nusantara Tbk',
      customerNik: '3174051203840001',
      customerNpwp: '01.345.678.9-012.000',
      issueDate: '2026-08-01',
      dueDate: '2026-08-31',
      status: 'Paid',
      invoiceType: 'Corporate Conference & Banquet',
      lineItems: [
        { id: 'li-1', description: 'Grand Ballroom Rental - Full Day Package', itemType: 'Banquet', quantity: 1, unitPrice: 45000000, lineTotal: 45000000 },
        { id: 'li-2', description: 'VIP Executive Catering (150 pax)', itemType: 'F&B', quantity: 150, unitPrice: 100000, lineTotal: 15000000 }
      ],
      subtotal: 60000000,
      taxRate: 11,
      taxAmount: 6600000,
      pphRate: 2,
      pphAmount: 1200000,
      dpDeduction: 0,
      total: 65400000,
      amountPaid: 65400000,
      balanceDue: 0,
      notes: 'Paid in full via Bank Transfer BCA on 2026-08-25',
      sourceType: 'generic',
      createdById: 'user-01',
      createdByName: 'Staf Penagihan AR',
      createdAt: '2026-08-01'
    },
    {
      id: 'inv-102',
      invoiceNumber: 'INV-2026-0002',
      customerId: 'cust-1',
      customerName: 'PT Telekomunikasi Nusantara Tbk',
      customerNik: '3174051203840001',
      customerNpwp: '01.345.678.9-012.000',
      issueDate: '2026-09-01',
      dueDate: '2026-10-01',
      status: 'Partially Paid',
      invoiceType: 'Executive Meeting & Suites',
      lineItems: [
        { id: 'li-3', description: 'Deluxe Executive Suite (5 nights)', itemType: 'Room', quantity: 5, unitPrice: 3000000, lineTotal: 15000000 },
        { id: 'li-4', description: 'Boardroom VIP Package + Audio Visual', itemType: 'Facility', quantity: 2, unitPrice: 15000000, lineTotal: 30000000 }
      ],
      subtotal: 45000000,
      taxRate: 11,
      taxAmount: 4950000,
      pphRate: 2,
      pphAmount: 900000,
      dpDeduction: 5000000, // Uang muka Rp 5.000.000 applied
      total: 44050000,
      amountPaid: 20000000,
      balanceDue: 24050000,
      notes: 'Installment 1 received on Sep 10 (Rp 20.000.000). Remaining balance due Oct 01.',
      sourceType: 'generic',
      createdById: 'user-01',
      createdByName: 'Staf Penagihan AR',
      createdAt: '2026-09-01'
    },
    {
      id: 'inv-103',
      invoiceNumber: 'INV-2026-0003',
      customerId: 'cust-2',
      customerName: 'PT Sinarmas Mitra Sejati',
      customerNik: '3171025508890002',
      customerNpwp: '02.456.789.0-013.000',
      issueDate: '2026-09-05',
      dueDate: '2026-10-05',
      status: 'Issued',
      invoiceType: 'Corporate Retreat & Training',
      lineItems: [
        { id: 'li-5', description: 'Function Hall Orchid - 2 Days', itemType: 'Banquet', quantity: 2, unitPrice: 20000000, lineTotal: 40000000 },
        { id: 'li-6', description: 'Buffet Lunch & Coffee Breaks (100 pax)', itemType: 'F&B', quantity: 100, unitPrice: 250000, lineTotal: 25000000 }
      ],
      subtotal: 65000000,
      taxRate: 11,
      taxAmount: 7150000,
      pphRate: 2,
      pphAmount: 1300000,
      dpDeduction: 10000000,
      total: 60850000,
      amountPaid: 0,
      balanceDue: 60850000,
      notes: 'Issued to Dewi Lestari. Net 30 days due Oct 05.',
      sourceType: 'generic',
      createdById: 'user-01',
      createdByName: 'Staf Penagihan AR',
      createdAt: '2026-09-05'
    },
    {
      id: 'inv-104',
      invoiceNumber: 'INV-2026-0004',
      customerId: 'cust-3',
      customerName: 'CV Surya Perkasa Mandiri',
      customerNik: '3578011904770003',
      customerNpwp: '03.567.890.1-014.000',
      issueDate: '2026-06-15',
      dueDate: '2026-06-29',
      status: 'Overdue',
      invoiceType: 'Product Launch & Reception',
      lineItems: [
        { id: 'li-7', description: 'Grand Ballroom Setup & LED Wall', itemType: 'Facility', quantity: 1, unitPrice: 35000000, lineTotal: 35000000 },
        { id: 'li-8', description: 'Cocktail Reception Canape Package', itemType: 'F&B', quantity: 1, unitPrice: 15000000, lineTotal: 15000000 }
      ],
      subtotal: 50000000,
      taxRate: 11,
      taxAmount: 5500000,
      pphRate: 0,
      pphAmount: 0,
      dpDeduction: 0,
      total: 55500000,
      amountPaid: 10000000,
      balanceDue: 45500000,
      notes: '78 days overdue! 2nd collection letter issued. Customer placed on Credit Hold.',
      sourceType: 'generic',
      createdById: 'user-01',
      createdByName: 'Staf Penagihan AR',
      createdAt: '2026-06-15'
    },
    {
      id: 'inv-105',
      invoiceNumber: 'INV-2026-0005',
      customerId: 'cust-3',
      customerName: 'CV Surya Perkasa Mandiri',
      customerNik: '3578011904770003',
      customerNpwp: '03.567.890.1-014.000',
      issueDate: '2026-07-20',
      dueDate: '2026-08-03',
      status: 'Overdue',
      invoiceType: 'VIP Guest Accommodation',
      lineItems: [
        { id: 'li-9', description: 'Superior Rooms (10 nights)', itemType: 'Room', quantity: 10, unitPrice: 1800000, lineTotal: 18000000 }
      ],
      subtotal: 18000000,
      taxRate: 11,
      taxAmount: 1980000,
      pphRate: 0,
      pphAmount: 0,
      dpDeduction: 0,
      total: 19980000,
      amountPaid: 0,
      balanceDue: 19980000,
      notes: '44 days overdue. Contacting Hendrik Pratama for settlement.',
      sourceType: 'generic',
      createdById: 'user-01',
      createdByName: 'Staf Penagihan AR',
      createdAt: '2026-07-20'
    },
    {
      id: 'inv-106',
      invoiceNumber: 'INV-2026-0006',
      customerId: 'cust-4',
      customerName: 'Grand Horizon Resort & Hospitality',
      customerNik: '5171034407920004',
      customerNpwp: '04.678.901.2-015.000',
      issueDate: '2026-08-10',
      dueDate: '2026-09-24',
      status: 'Issued',
      invoiceType: 'City Ledger Folio Transfer',
      lineItems: [
        { id: 'li-10', description: 'Inter-hotel Guest Billing Folio #88192', itemType: 'Room', quantity: 1, unitPrice: 75000000, lineTotal: 75000000 },
        { id: 'li-11', description: 'Banquet Shared Event Fee', itemType: 'Banquet', quantity: 1, unitPrice: 20000000, lineTotal: 20000000 }
      ],
      subtotal: 95000000,
      taxRate: 11,
      taxAmount: 10450000,
      pphRate: 2,
      pphAmount: 1900000,
      dpDeduction: 0,
      total: 103550000,
      amountPaid: 0,
      balanceDue: 103550000,
      notes: 'City Ledger agreement, Net 45 terms, due Sep 24, 2026',
      sourceType: 'city_ledger',
      createdById: 'user-01',
      createdByName: 'Staf Penagihan AR',
      createdAt: '2026-08-10'
    },
    {
      id: 'inv-107',
      invoiceNumber: 'INV-2026-0007',
      customerId: 'cust-5',
      customerName: 'PT Karya Bakti Integra',
      customerNik: '3273062306850005',
      customerNpwp: '05.789.012.3-016.000',
      issueDate: '2026-08-15',
      dueDate: '2026-09-14',
      status: 'Overdue',
      invoiceType: 'Monthly Corporate Meeting',
      lineItems: [
        { id: 'li-12', description: 'Meeting Room Package & Buffet Lunch', itemType: 'Banquet', quantity: 1, unitPrice: 28000000, lineTotal: 28000000 }
      ],
      subtotal: 28000000,
      taxRate: 11,
      taxAmount: 3080000,
      pphRate: 2,
      pphAmount: 560000,
      dpDeduction: 0,
      total: 30520000,
      amountPaid: 0,
      balanceDue: 30520000,
      notes: '2 days overdue. Sent reminder via WhatsApp & email.',
      sourceType: 'generic',
      createdById: 'user-01',
      createdByName: 'Staf Penagihan AR',
      createdAt: '2026-08-15'
    },
    {
      id: 'inv-108',
      invoiceNumber: 'INV-2026-0008',
      customerId: 'cust-6',
      customerName: 'PT Digital Kreasi Media',
      customerNik: '3174096001940006',
      customerNpwp: '06.890.123.4-017.000',
      issueDate: '2026-09-12',
      dueDate: '2026-09-27',
      status: 'Draft',
      invoiceType: 'Annual Gathering & Dinner',
      lineItems: [
        { id: 'li-13', description: 'Poolside Terrace Gala Event Area', itemType: 'Facility', quantity: 1, unitPrice: 22000000, lineTotal: 22000000 },
        { id: 'li-14', description: 'International Buffet & Live Cooking (50 pax)', itemType: 'F&B', quantity: 50, unitPrice: 200000, lineTotal: 10000000 }
      ],
      subtotal: 32000000,
      taxRate: 11,
      taxAmount: 3520000,
      pphRate: 2,
      pphAmount: 640000,
      dpDeduction: 5000000,
      total: 29880000,
      amountPaid: 0,
      balanceDue: 29880000,
      notes: 'Draft awaiting final review before dispatch. Editable and deletable.',
      sourceType: 'generic',
      createdById: 'user-01',
      createdByName: 'Staf Penagihan AR',
      createdAt: '2026-09-12'
    },
    {
      id: 'inv-109',
      invoiceNumber: 'INV-2026-0009',
      customerId: 'cust-2',
      customerName: 'PT Sinarmas Mitra Sejati',
      customerNik: '3171025508890002',
      customerNpwp: '02.456.789.0-013.000',
      issueDate: '2026-07-01',
      dueDate: '2026-07-31',
      status: 'Cancelled',
      invoiceType: 'Erroneous Duplicate Invoice',
      lineItems: [
        { id: 'li-15', description: 'Duplicate Banquet Billing for Hall Orchid', itemType: 'Banquet', quantity: 1, unitPrice: 15000000, lineTotal: 15000000 }
      ],
      subtotal: 15000000,
      taxRate: 11,
      taxAmount: 1650000,
      pphRate: 0,
      pphAmount: 0,
      dpDeduction: 0,
      total: 16650000,
      amountPaid: 0,
      balanceDue: 0,
      notes: 'Cancelled per Manager approval. Duplicate billing detected.',
      sourceType: 'generic',
      createdById: 'user-01',
      createdByName: 'Staf Penagihan AR',
      createdAt: '2026-07-01',
      cancellationReason: 'Replaced by INV-2026-0003 - incorrect PO details and duplicate room package',
      cancelledAt: '2026-07-05',
      cancelledBy: 'Manager Keuangan'
    }
  ]);

  // Reactive Payments with Channels, Bank Account and Installment Sequence (SRS-F-20 to SRS-F-25)
  readonly payments = signal<Payment[]>([
    {
      id: 'pay-201',
      paymentNumber: 'PAY-2026-0001',
      customerId: 'cust-1',
      customerName: 'PT Telekomunikasi Nusantara Tbk',
      paymentDate: '2026-08-25',
      amount: 65400000,
      method: 'bank_transfer',
      paymentChannel: 'BCA (Overbooking)',
      referenceNumber: 'TRF-BCA-8839120',
      bankAccountId: 'bank-01',
      adminFee: 0,
      notes: 'Full settlement of INV-2026-0001',
      allocations: [
        { invoiceId: 'inv-101', invoiceNumber: 'INV-2026-0001', allocatedAmount: 65400000, timesPaid: 1 }
      ],
      createdAt: '2026-08-25'
    },
    {
      id: 'pay-202',
      paymentNumber: 'PAY-2026-0002',
      customerId: 'cust-1',
      customerName: 'PT Telekomunikasi Nusantara Tbk',
      paymentDate: '2026-09-10',
      amount: 20000000,
      method: 'virtual_account',
      paymentChannel: 'BCA Virtual Account',
      referenceNumber: 'VA-BCA-9921004',
      bankAccountId: 'bank-01',
      adminFee: 5000,
      notes: 'Installment 1 of 2 against INV-2026-0002',
      allocations: [
        { invoiceId: 'inv-102', invoiceNumber: 'INV-2026-0002', allocatedAmount: 20000000, timesPaid: 1 }
      ],
      createdAt: '2026-09-10'
    },
    {
      id: 'pay-203',
      paymentNumber: 'PAY-2026-0003',
      customerId: 'cust-3',
      customerName: 'CV Surya Perkasa Mandiri',
      paymentDate: '2026-07-15',
      amount: 10000000,
      method: 'bank_transfer',
      paymentChannel: 'Bank Mandiri Giro',
      referenceNumber: 'MDR-GIRO-004812',
      bankAccountId: 'bank-02',
      adminFee: 0,
      notes: 'Partial settlement for launch reception',
      allocations: [
        { invoiceId: 'inv-104', invoiceNumber: 'INV-2026-0004', allocatedAmount: 10000000, timesPaid: 1 }
      ],
      createdAt: '2026-07-15'
    }
  ]);

  // Activity Logs / Audit Trail (UC-11, UC-16, SRS-F-39, SRS-F-40)
  readonly activityLogs = signal<ActivityLog[]>([
    {
      id: 'log-1',
      timestamp: '2026-09-16 09:30',
      user: 'Sistem',
      role: 'Admin',
      type: 'status_changed',
      description: 'System recalculated aging: INV-2026-0007 flagged as Overdue (2 days past due)',
      badgeType: 'warning'
    },
    {
      id: 'log-2',
      timestamp: '2026-09-12 14:15',
      user: 'Budi Santoso',
      role: 'User',
      type: 'invoice_created',
      description: 'Draft invoice INV-2026-0008 created for PT Digital Kreasi Media',
      amount: 29880000,
      referenceId: 'INV-2026-0008',
      badgeType: 'secondary'
    },
    {
      id: 'log-3',
      timestamp: '2026-09-10 11:20',
      user: 'Budi Santoso',
      role: 'User',
      type: 'payment_recorded',
      description: 'Payment PAY-2026-0002 (Rp 20.000.000) recorded via BCA VA for PT Telekomunikasi Nusantara',
      amount: 20000000,
      referenceId: 'PAY-2026-0002',
      badgeType: 'success'
    },
    {
      id: 'log-4',
      timestamp: '2026-09-05 16:45',
      user: 'Budi Santoso',
      role: 'User',
      type: 'invoice_issued',
      description: 'Invoice INV-2026-0003 issued & sent to PT Sinarmas Mitra Sejati',
      amount: 60850000,
      referenceId: 'INV-2026-0003',
      badgeType: 'info'
    },
    {
      id: 'log-5',
      timestamp: '2026-07-05 10:00',
      user: 'Siti Rahayu',
      role: 'Manager',
      type: 'invoice_cancelled',
      description: 'Invoice INV-2026-0009 cancelled with reason: "Replaced by INV-2026-0003 - duplicate billing"',
      referenceId: 'INV-2026-0009',
      badgeType: 'danger'
    }
  ]);

  // Derived Dashboard Metrics
  readonly dashboardMetrics = computed<DashboardMetrics>(() => {
    const invs = this.invoices();
    const pays = this.payments();

    let totalOutstanding = 0;
    let totalOverdue = 0;
    let openCount = 0;
    let overdueCount = 0;

    for (const inv of invs) {
      if (inv.status !== 'Cancelled' && inv.status !== 'Paid' && inv.status !== 'Draft') {
        totalOutstanding += inv.balanceDue;
        openCount++;
        if (inv.status === 'Overdue') {
          totalOverdue += inv.balanceDue;
          overdueCount++;
        }
      }
    }

    // Collected in current month (2026-09)
    let collectedThisMonth = 0;
    let paidThisMonthCount = 0;
    for (const p of pays) {
      if (p.paymentDate.startsWith('2026-09')) {
        collectedThisMonth += p.amount;
        paidThisMonthCount++;
      }
    }

    return {
      totalOutstanding,
      totalOverdue,
      collectedThisMonth,
      openInvoicesCount: openCount,
      overdueInvoicesCount: overdueCount,
      paidThisMonthCount
    };
  });

  // Role Switcher method
  switchUserRole(role: UserRole) {
    this.currentUser.update(user => ({
      ...user,
      role,
      fullName:
        role === 'Admin'
          ? 'System Administrator'
          : role === 'Manager'
          ? 'Finance & AR Manager'
          : role === 'User'
          ? 'Staf Penagihan AR'
          : 'Executive Viewer (Read Only)'
    }));
    this.addActivityLog({
      type: 'status_changed',
      description: `Active role switched to ${role}`,
      badgeType: 'info'
    });
  }

  // Derive status based on payments, dates, and current status (SRS Table 4.4.2)
  deriveInvoiceStatus(inv: {
    status: InvoiceStatus;
    amountPaid: number;
    total: number;
    dueDate: string;
  }): InvoiceStatus {
    if (inv.status === 'Cancelled') return 'Cancelled';
    if (inv.status === 'Draft') return 'Draft';
    if (inv.amountPaid >= inv.total) return 'Paid';

    const isPastDue = inv.dueDate < this.today;
    if (isPastDue) return 'Overdue';
    if (inv.amountPaid > 0) return 'Partially Paid';
    return 'Issued';
  }

  // Get Customer by ID
  getCustomer(customerId: string): Customer | undefined {
    return this.customers().find(c => c.id === customerId);
  }

  // Get Customer's calculated running balance
  getCustomerBalance(customerId: string): number {
    return this.invoices()
      .filter(i => i.customerId === customerId && i.status !== 'Cancelled' && i.status !== 'Draft')
      .reduce((sum, i) => sum + i.balanceDue, 0);
  }

  // Check if customer has any active or past invoices (SRS-F-03)
  customerHasInvoices(customerId: string): boolean {
    return this.invoices().some(i => i.customerId === customerId);
  }

  // Get count of invoices for customer
  getCustomerInvoiceCount(customerId: string): number {
    return this.invoices().filter(i => i.customerId === customerId).length;
  }

  // Generate Next Invoice Number
  getNextInvoiceNumber(): string {
    const existing = this.invoices();
    const count = existing.length + 1;
    return `INV-2026-${count.toString().padStart(4, '0')}`;
  }

  // Generate Next Payment Number
  getNextPaymentNumber(): string {
    const existing = this.payments();
    const count = existing.length + 1;
    return `PAY-2026-${count.toString().padStart(4, '0')}`;
  }

  // ==========================================
  // CUSTOMER OPERATIONS (UC-01, SRS-F-01..03)
  // ==========================================

  createCustomer(payload: Omit<Customer, 'id' | 'code' | 'createdAt'>): Customer {
    const cleanNik = payload.nik ? payload.nik.replace(/\D/g, '') : '';
    const count = this.customers().length + 1;
    const newCustomer: Customer = {
      ...payload,
      nik: cleanNik || undefined,
      id: `cust-${Date.now()}`,
      code: `CUST-${count.toString().padStart(3, '0')}`,
      createdAt: this.today
    };

    this.customers.update(list => [newCustomer, ...list]);

    this.addActivityLog({
      type: 'customer_created',
      description: `Customer baru "${newCustomer.name}" (${newCustomer.code}) didaftarkan`,
      referenceId: newCustomer.code,
      badgeType: 'info'
    });

    return newCustomer;
  }

  updateCustomer(id: string, payload: Partial<Omit<Customer, 'id' | 'code' | 'createdAt'>>): { success: boolean; message: string } {
    const exists = this.customers().find(c => c.id === id);
    if (!exists) {
      return { success: false, message: 'Customer tidak ditemukan.' };
    }

    this.customers.update(list =>
      list.map(c => (c.id === id ? { ...c, ...payload } : c))
    );

    this.addActivityLog({
      type: 'customer_updated',
      description: `Data profil customer "${exists.name}" (${exists.code}) diperbarui`,
      referenceId: exists.code,
      badgeType: 'info'
    });

    return { success: true, message: `Data customer ${exists.name} berhasil diperbarui!` };
  }

  deleteCustomer(id: string): { success: boolean; message: string } {
    const customer = this.customers().find(c => c.id === id);
    if (!customer) {
      return { success: false, message: 'Customer tidak ditemukan.' };
    }

    // SRS-F-03 Rule: "mencegah penghapusan pelanggan yang telah memiliki invoice"
    const hasInvoices = this.customerHasInvoices(id);
    if (hasInvoices) {
      const invCount = this.getCustomerInvoiceCount(id);
      return {
        success: false,
        message: `Pelanggan "${customer.name}" tidak dapat dihapus karena telah memiliki ${invCount} invoice terdaftar sesuai SRS-F-03.`
      };
    }

    this.customers.update(list => list.filter(c => c.id !== id));

    this.addActivityLog({
      type: 'customer_deleted',
      description: `Customer "${customer.name}" (${customer.code}) dihapus dari sistem`,
      referenceId: customer.code,
      badgeType: 'danger'
    });

    return { success: true, message: `Customer ${customer.name} berhasil dihapus.` };
  }

  // ==========================================
  // INVOICE OPERATIONS (UC-02..04, SRS-F-04..19)
  // ==========================================

  createInvoice(payload: {
    customerId: string;
    issueDate: string;
    dueDate: string;
    invoiceType?: string;
    lineItems: { description: string; itemType?: LineItem['itemType']; quantity: number; unitPrice: number }[];
    taxRate: number;      // PPN %
    pphRate?: number;     // PPh %
    dpDeduction?: number; // Potongan DP
    notes?: string;
    sourceType?: 'generic' | 'city_ledger' | 'direct';
    saveAs: 'Draft' | 'Sent' | 'Issued';
  }): Invoice {
    const customer = this.customers().find(c => c.id === payload.customerId);
    const customerName = customer ? customer.name : 'Unknown Customer';

    const calculatedItems: LineItem[] = (payload.lineItems || []).map((item, idx) => ({
      id: `li-${Date.now()}-${idx}`,
      description: item.description,
      itemType: item.itemType || 'Service',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      lineTotal: Math.round((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0))
    }));

    const subtotal = calculatedItems.reduce((acc, curr) => acc + curr.lineTotal, 0);
    const taxAmount = Math.round((subtotal * (Number(payload.taxRate) || 0)) / 100);
    const pphAmount = Math.round((subtotal * (Number(payload.pphRate) || 0)) / 100);
    const dpDeduction = Number(payload.dpDeduction) || 0;

    // Total tagihan = Subtotal + PPN - PPh - Potongan DP (SRS-F-12)
    const total = Math.max(0, subtotal + taxAmount - pphAmount - dpDeduction);

    const initialStatus: InvoiceStatus = payload.saveAs === 'Draft' ? 'Draft' : 'Issued';

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: this.getNextInvoiceNumber(),
      customerId: payload.customerId,
      customerName,
      customerNik: customer?.nik,
      customerNpwp: customer?.npwp,
      issueDate: payload.issueDate,
      dueDate: payload.dueDate,
      status: initialStatus,
      invoiceType: payload.invoiceType || 'Standard Hospitality Invoice',
      lineItems: calculatedItems,
      subtotal,
      taxRate: Number(payload.taxRate) || 0,
      taxAmount,
      pphRate: Number(payload.pphRate) || 0,
      pphAmount,
      dpDeduction,
      total,
      amountPaid: 0,
      balanceDue: total,
      notes: payload.notes || '',
      sourceType: payload.sourceType || 'generic',
      createdById: this.currentUser().id,
      createdByName: this.currentUser().fullName,
      createdAt: this.today
    };

    if (newInvoice.status === 'Issued') {
      newInvoice.status = this.deriveInvoiceStatus(newInvoice);
    }

    this.invoices.update(list => [newInvoice, ...list]);

    this.addActivityLog({
      type: newInvoice.status === 'Draft' ? 'invoice_created' : 'invoice_issued',
      description: `Invoice ${newInvoice.invoiceNumber} (${newInvoice.status}) dibuat untuk ${customerName} (Total Rp ${newInvoice.total.toLocaleString('id-ID')})`,
      amount: newInvoice.total,
      referenceId: newInvoice.invoiceNumber,
      badgeType: newInvoice.status === 'Draft' ? 'secondary' : 'info'
    });

    return newInvoice;
  }

  // SRS-F-15: "mengizinkan perubahan isi invoice hanya pada invoice berstatus Draft"
  updateDraftInvoice(
    invoiceId: string,
    payload: {
      customerId: string;
      issueDate: string;
      dueDate: string;
      invoiceType?: string;
      lineItems: { description: string; itemType?: LineItem['itemType']; quantity: number; unitPrice: number }[];
      taxRate: number;
      pphRate: number;
      dpDeduction: number;
      notes?: string;
      sourceType?: 'generic' | 'city_ledger' | 'direct';
    }
  ): { success: boolean; message: string; invoice?: Invoice } {
    const inv = this.invoices().find(i => i.id === invoiceId);
    if (!inv) return { success: false, message: 'Invoice tidak ditemukan.' };

    if (inv.status !== 'Draft') {
      return { success: false, message: 'Sesuai SRS-F-15, perubahan isi invoice hanya diperkenankan pada invoice berstatus Draft.' };
    }

    if (payload.dueDate < payload.issueDate) {
      return { success: false, message: 'Tanggal jatuh tempo tidak boleh lebih awal dari tanggal invoice (SRS-F-14).' };
    }

    const customer = this.customers().find(c => c.id === payload.customerId);
    const calculatedItems: LineItem[] = payload.lineItems.map((item, idx) => ({
      id: `li-${Date.now()}-${idx}`,
      description: item.description,
      itemType: item.itemType || 'Service',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      lineTotal: Math.round((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0))
    }));

    const subtotal = calculatedItems.reduce((acc, curr) => acc + curr.lineTotal, 0);
    const taxAmount = Math.round((subtotal * (Number(payload.taxRate) || 0)) / 100);
    const pphAmount = Math.round((subtotal * (Number(payload.pphRate) || 0)) / 100);
    const dpDeduction = Number(payload.dpDeduction) || 0;
    const total = Math.max(0, subtotal + taxAmount - pphAmount - dpDeduction);

    let updatedInvoice: Invoice | undefined;

    this.invoices.update(list =>
      list.map(i => {
        if (i.id === invoiceId) {
          updatedInvoice = {
            ...i,
            customerId: payload.customerId,
            customerName: customer ? customer.name : i.customerName,
            customerNik: customer?.nik,
            customerNpwp: customer?.npwp,
            issueDate: payload.issueDate,
            dueDate: payload.dueDate,
            invoiceType: payload.invoiceType || i.invoiceType,
            lineItems: calculatedItems,
            subtotal,
            taxRate: Number(payload.taxRate) || 0,
            taxAmount,
            pphRate: Number(payload.pphRate) || 0,
            pphAmount,
            dpDeduction,
            total,
            balanceDue: total,
            notes: payload.notes || '',
            sourceType: payload.sourceType || i.sourceType
          };
          return updatedInvoice;
        }
        return i;
      })
    );

    this.addActivityLog({
      type: 'invoice_updated',
      description: `Rincian invoice Draft ${inv.invoiceNumber} diperbarui (Total baru Rp ${total.toLocaleString('id-ID')})`,
      amount: total,
      referenceId: inv.invoiceNumber,
      badgeType: 'secondary'
    });

    return { success: true, message: `Invoice Draft ${inv.invoiceNumber} berhasil diperbarui!`, invoice: updatedInvoice };
  }

  // Delete Draft Invoice
  deleteDraftInvoice(invoiceId: string): { success: boolean; message: string } {
    const inv = this.invoices().find(i => i.id === invoiceId);
    if (!inv) return { success: false, message: 'Invoice tidak ditemukan.' };

    if (inv.status !== 'Draft') {
      return { success: false, message: 'Hanya invoice berstatus Draft yang dapat dihapus secara permanen (SRS-NF-08 & SRS-NF-16).' };
    }

    this.invoices.update(list => list.filter(i => i.id !== invoiceId));

    this.addActivityLog({
      type: 'invoice_deleted',
      description: `Invoice Draft ${inv.invoiceNumber} dihapus oleh ${this.currentUser().fullName}`,
      referenceId: inv.invoiceNumber,
      badgeType: 'danger'
    });

    return { success: true, message: `Invoice Draft ${inv.invoiceNumber} berhasil dihapus.` };
  }

  // SRS-F-16: Terbitkan invoice (Draft -> Issued)
  issueInvoice(invoiceId: string): { success: boolean; message: string } {
    const inv = this.invoices().find(i => i.id === invoiceId);
    if (!inv) return { success: false, message: 'Invoice tidak ditemukan.' };

    if (inv.status !== 'Draft') {
      return { success: false, message: `Invoice sudah berstatus ${inv.status} dan tidak dalam status Draft.` };
    }

    if (inv.subtotal <= 0) {
      return { success: false, message: 'Validasi gagal: Subtotal invoice tidak boleh bernilai nol untuk diterbitkan (UC-03).' };
    }

    this.invoices.update(list =>
      list.map(i => {
        if (i.id === invoiceId) {
          const updated: Invoice = { ...i, status: 'Issued' };
          updated.status = this.deriveInvoiceStatus(updated);
          return updated;
        }
        return i;
      })
    );

    this.addActivityLog({
      type: 'invoice_issued',
      description: `Invoice ${inv.invoiceNumber} resmi diterbitkan kepada ${inv.customerName} oleh ${this.currentUser().fullName}`,
      amount: inv.total,
      referenceId: inv.invoiceNumber,
      badgeType: 'info'
    });

    return { success: true, message: `Invoice ${inv.invoiceNumber} berhasil diterbitkan dan siap ditagihkan.` };
  }

  // SRS-F-18, UC-04: Batalkan Invoice (Status: Cancelled)
  cancelInvoice(invoiceId: string, reason: string): { success: boolean; message: string } {
    const inv = this.invoices().find(i => i.id === invoiceId);
    if (!inv) return { success: false, message: 'Invoice tidak ditemukan.' };

    if (inv.status === 'Cancelled') {
      return { success: false, message: 'Invoice ini telah dibatalkan sebelumnya.' };
    }

    // SRS-F-18: Batalkan invoice hanya apabila belum terdapat pembayaran teralokasi
    if (inv.amountPaid > 0) {
      return {
        success: false,
        message: 'Invoice Memiliki Pembayaran: Invoice yang telah memiliki pembayaran teralokasi tidak dapat dibatalkan (SRS-F-18).'
      };
    }

    if (!reason || !reason.trim()) {
      return { success: false, message: 'Pengisian alasan pembatalan bersifat wajib (SRS-F-18).' };
    }

    this.invoices.update(list =>
      list.map(i => {
        if (i.id === invoiceId) {
          return {
            ...i,
            status: 'Cancelled',
            balanceDue: 0,
            cancellationReason: reason.trim(),
            cancelledAt: this.today,
            cancelledBy: this.currentUser().fullName
          };
        }
        return i;
      })
    );

    this.addActivityLog({
      type: 'invoice_cancelled',
      description: `Invoice ${inv.invoiceNumber} dibatalkan oleh ${this.currentUser().fullName}. Alasan: "${reason.trim()}"`,
      referenceId: inv.invoiceNumber,
      badgeType: 'danger'
    });

    return { success: true, message: `Invoice ${inv.invoiceNumber} berhasil dibatalkan.` };
  }

  // ==========================================
  // PAYMENT & ALLOCATION (UC-05..06, SRS-F-20..31)
  // ==========================================

  recordPayment(payload: {
    customerId: string;
    paymentDate: string;
    amount: number;
    method: PaymentMethod;
    paymentChannel?: string;
    referenceNumber: string;
    bankAccountId?: string;
    adminFee?: number;
    notes?: string;
    isDownPayment?: boolean;
    allocations: { invoiceId: string; allocatedAmount: number }[];
  }): Payment {
    const customer = this.customers().find(c => c.id === payload.customerId);
    const customerName = customer ? customer.name : 'Unknown Customer';

    const cleanAllocations = (payload.allocations || []).filter(a => Number(a.allocatedAmount) > 0);
    const finalAllocations: { invoiceId: string; invoiceNumber: string; allocatedAmount: number; timesPaid: number }[] = [];

    // Apply allocations atomically to invoices
    this.invoices.update(currentList => {
      return currentList.map(inv => {
        const alloc = cleanAllocations.find(a => a.invoiceId === inv.id);
        if (alloc) {
          const applied = Math.min(Number(alloc.allocatedAmount), inv.balanceDue);
          const newAmountPaid = inv.amountPaid + applied;
          const newBalanceDue = Math.max(0, inv.total - newAmountPaid);

          // Calculate installment timesPaid sequence (SRS-F-25)
          const pastPaymentsCount = this.payments().filter(p =>
            p.allocations.some(pa => pa.invoiceId === inv.id)
          ).length;

          finalAllocations.push({
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            allocatedAmount: applied,
            timesPaid: pastPaymentsCount + 1
          });

          const updatedInv: Invoice = {
            ...inv,
            amountPaid: newAmountPaid,
            balanceDue: newBalanceDue
          };
          updatedInv.status = this.deriveInvoiceStatus(updatedInv);
          return updatedInv;
        }
        return inv;
      });
    });

    const payment: Payment = {
      id: `pay-${Date.now()}`,
      paymentNumber: this.getNextPaymentNumber(),
      customerId: payload.customerId,
      customerName,
      paymentDate: payload.paymentDate,
      amount: payload.amount,
      method: payload.method,
      paymentChannel: payload.paymentChannel || 'Bank Transfer',
      referenceNumber: payload.referenceNumber,
      bankAccountId: payload.bankAccountId,
      adminFee: payload.adminFee || 0,
      notes: payload.notes,
      allocations: finalAllocations,
      isDownPayment: payload.isDownPayment || false,
      createdAt: this.today
    };

    this.payments.update(list => [payment, ...list]);

    this.addActivityLog({
      type: 'payment_recorded',
      description: `Pembayaran ${payment.paymentNumber} sebesar Rp ${payment.amount.toLocaleString('id-ID')} dicatat via ${payment.paymentChannel} (${customerName})`,
      amount: payment.amount,
      referenceId: payment.paymentNumber,
      badgeType: 'success'
    });

    return payment;
  }

  // Alias for backward compatibility with V4/Minimal
  voidInvoice(invoiceId: string, reason: string): boolean {
    return this.cancelInvoice(invoiceId, reason).success;
  }

  // Rollback / Delete Payment (Restores invoice balance and recalculates status)
  deletePayment(paymentId: string): { success: boolean; message: string } {
    const payment = this.payments().find(p => p.id === paymentId);
    if (!payment) return { success: false, message: 'Pembayaran tidak ditemukan.' };

    // Revert allocations from invoices
    this.invoices.update(invoicesList => {
      return invoicesList.map(inv => {
        const alloc = payment.allocations.find(a => a.invoiceId === inv.id);
        if (alloc) {
          const restoredPaid = Math.max(0, inv.amountPaid - alloc.allocatedAmount);
          const restoredBalance = Math.min(inv.total, inv.balanceDue + alloc.allocatedAmount);
          const reverted: Invoice = {
            ...inv,
            amountPaid: restoredPaid,
            balanceDue: restoredBalance
          };
          reverted.status = this.deriveInvoiceStatus(reverted);
          return reverted;
        }
        return inv;
      });
    });

    this.payments.update(list => list.filter(p => p.id !== paymentId));

    this.addActivityLog({
      type: 'payment_deleted',
      description: `Pembayaran ${payment.paymentNumber} (Rp ${payment.amount.toLocaleString('id-ID')}) dibatalkan / di-rollback`,
      amount: payment.amount,
      referenceId: payment.paymentNumber,
      badgeType: 'danger'
    });

    return { success: true, message: `Pembayaran ${payment.paymentNumber} berhasil di-rollback dan saldo tagihan invoice dipulihkan.` };
  }

  // ==========================================
  // BANK ACCOUNTS MASTER DATA (UC-07, SRS-F-32)
  // ==========================================

  createBankAccount(payload: Omit<BankAccount, 'id'>): { success: boolean; message: string; bankAccount?: BankAccount } {
    // Check duplicate account number
    if (this.bankAccounts().some(b => b.accountNumber.trim() === payload.accountNumber.trim() && b.bankName.trim() === payload.bankName.trim())) {
      return { success: false, message: 'Nomor rekening pada bank yang sama telah terdaftar (UC-07).' };
    }

    const newAcc: BankAccount = {
      ...payload,
      id: `bank-${Date.now()}`
    };

    this.bankAccounts.update(list => [...list, newAcc]);

    this.addActivityLog({
      type: 'bank_account_created',
      description: `Rekening bank baru ${newAcc.bankName} (${newAcc.accountNumber}) ditambahkan`,
      referenceId: newAcc.accountNumber,
      badgeType: 'info'
    });

    return { success: true, message: `Rekening ${newAcc.bankName} berhasil ditambahkan!`, bankAccount: newAcc };
  }

  updateBankAccount(id: string, payload: Partial<Omit<BankAccount, 'id'>>): { success: boolean; message: string } {
    const exists = this.bankAccounts().find(b => b.id === id);
    if (!exists) return { success: false, message: 'Rekening bank tidak ditemukan.' };

    this.bankAccounts.update(list =>
      list.map(b => (b.id === id ? { ...b, ...payload } : b))
    );

    return { success: true, message: `Rekening ${exists.bankName} berhasil diperbarui.` };
  }

  deleteBankAccount(id: string): { success: boolean; message: string } {
    const exists = this.bankAccounts().find(b => b.id === id);
    if (!exists) return { success: false, message: 'Rekening bank tidak ditemukan.' };

    // SRS-F-32 rule: "Rekening bank yang telah digunakan pada pembayaran tidak dapat dihapus; data hanya dapat diperbarui"
    const usedInPayment = this.payments().some(p => p.bankAccountId === id);
    if (usedInPayment) {
      return { success: false, message: `Rekening ${exists.bankName} telah digunakan pada pencatatan pembayaran dan tidak dapat dihapus (SRS-F-32).` };
    }

    this.bankAccounts.update(list => list.filter(b => b.id !== id));

    this.addActivityLog({
      type: 'bank_account_deleted',
      description: `Rekening bank ${exists.bankName} (${exists.accountNumber}) dihapus`,
      referenceId: exists.accountNumber,
      badgeType: 'danger'
    });

    return { success: true, message: `Rekening ${exists.bankName} berhasil dihapus.` };
  }

  // ==========================================
  // AGING REPORT MATRIX (UC-09, SRS-F-33..34)
  // ==========================================

  getAgingReport(asOfDate: string = this.today): { buckets: AgingBucket[]; grandTotal: AgingBucket } {
    const asOfTime = new Date(asOfDate).getTime();
    const customerMap = new Map<string, AgingBucket>();

    for (const c of this.customers()) {
      customerMap.set(c.id, {
        customerId: c.id,
        customerCode: c.code,
        customerName: c.name,
        current: 0,
        days1_30: 0,
        days31_60: 0,
        days61_90: 0,
        days90Plus: 0,
        totalOutstanding: 0,
        invoices: []
      });
    }

    for (const inv of this.invoices()) {
      if (inv.status === 'Cancelled' || inv.status === 'Draft' || inv.balanceDue <= 0) {
        continue;
      }

      let bucket = customerMap.get(inv.customerId);
      if (!bucket) {
        bucket = {
          customerId: inv.customerId,
          customerCode: 'CUST-?',
          customerName: inv.customerName,
          current: 0,
          days1_30: 0,
          days31_60: 0,
          days61_90: 0,
          days90Plus: 0,
          totalOutstanding: 0,
          invoices: []
        };
        customerMap.set(inv.customerId, bucket);
      }

      bucket.invoices = bucket.invoices || [];
      bucket.invoices.push(inv);

      const dueTime = new Date(inv.dueDate).getTime();
      const diffDays = Math.floor((asOfTime - dueTime) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        bucket.current += inv.balanceDue;
      } else if (diffDays <= 30) {
        bucket.days1_30 += inv.balanceDue;
      } else if (diffDays <= 60) {
        bucket.days31_60 += inv.balanceDue;
      } else if (diffDays <= 90) {
        bucket.days61_90 += inv.balanceDue;
      } else {
        bucket.days90Plus += inv.balanceDue;
      }

      bucket.totalOutstanding += inv.balanceDue;
    }

    const buckets = Array.from(customerMap.values()).filter(b => b.totalOutstanding > 0);

    const grandTotal: AgingBucket = {
      customerId: 'total',
      customerCode: 'TOTAL',
      customerName: 'Grand Total',
      current: buckets.reduce((sum, b) => sum + b.current, 0),
      days1_30: buckets.reduce((sum, b) => sum + b.days1_30, 0),
      days31_60: buckets.reduce((sum, b) => sum + b.days31_60, 0),
      days61_90: buckets.reduce((sum, b) => sum + b.days61_90, 0),
      days90Plus: buckets.reduce((sum, b) => sum + b.days90Plus, 0),
      totalOutstanding: buckets.reduce((sum, b) => sum + b.totalOutstanding, 0)
    };

    return { buckets, grandTotal };
  }

  // ==========================================
  // SYSTEM AUTOMATION (UC-15, SRS-F-30)
  // ==========================================

  detectOverdueInvoices(): number {
    let overdueFound = 0;
    this.invoices.update(list =>
      list.map(inv => {
        if ((inv.status === 'Issued' || inv.status === 'Partially Paid') && inv.balanceDue > 0) {
          if (inv.dueDate < this.today) {
            overdueFound++;
            return { ...inv, status: 'Overdue' as InvoiceStatus };
          }
        }
        return inv;
      })
    );

    if (overdueFound > 0) {
      this.addActivityLog({
        type: 'status_changed',
        description: `Scheduled Overdue Detection: ${overdueFound} invoice diperbarui statusnya menjadi Overdue`,
        badgeType: 'warning'
      });
    }

    return overdueFound;
  }

  private addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const newLog: ActivityLog = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user: this.currentUser().fullName,
      role: this.currentUser().role,
      timestamp: `${this.today} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
    };
    this.activityLogs.update(logs => [newLog, ...logs.slice(0, 49)]);
  }
}
