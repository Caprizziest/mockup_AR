import { Injectable, signal, computed } from '@angular/core';
import { Customer, Invoice, Payment, AgingBucket, DashboardMetrics, ActivityLog, InvoiceStatus, PaymentMethod } from '../models/ar.models';

@Injectable({
  providedIn: 'root'
})
export class ArDataService {
  // Today reference (YYYY-MM-DD)
  readonly today = '2026-09-16';

  // Reactive State Signals
  readonly customers = signal<Customer[]>([
    {
      id: 'cust-1',
      code: 'CUST-001',
      name: 'PT Telekomunikasi Nusantara Tbk',
      contactPerson: 'Bambang Sudiro',
      email: 'finance@telkom-nusantara.co.id',
      phone: '+62 21 5299 1000',
      address: 'Jl. Jend. Gatot Subroto Kav. 52, Jakarta Selatan',
      creditLimit: 250000000,
      dueDays: 30,
      status: 'active',
      notes: 'Key Enterprise Account - Net 30 terms negotiated',
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
      creditLimit: 80000000,
      dueDays: 14,
      status: 'credit_hold',
      notes: 'Overdue > 60 days on past order. Credit hold active until settled.',
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
      creditLimit: 300000000,
      dueDays: 45,
      status: 'active',
      notes: 'City Ledger Corporate client - seasonal volume orders',
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
      creditLimit: 100000000,
      dueDays: 30,
      status: 'active',
      notes: 'Monthly maintenance and software retainer agreement',
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
      creditLimit: 60000000,
      dueDays: 15,
      status: 'active',
      notes: 'Creative digital agency, Net 15 terms',
      createdAt: '2026-05-12'
    }
  ]);

  readonly invoices = signal<Invoice[]>([
    {
      id: 'inv-101',
      invoiceNumber: 'INV-2026-0001',
      customerId: 'cust-1',
      customerName: 'PT Telekomunikasi Nusantara Tbk',
      issueDate: '2026-08-01',
      dueDate: '2026-08-31',
      status: 'Paid',
      lineItems: [
        { id: 'li-1', description: 'Enterprise Cloud Infrastructure Services (Aug)', quantity: 1, unitPrice: 45000000, lineTotal: 45000000 },
        { id: 'li-2', description: '24/7 SLA Technical Support Retainer', quantity: 1, unitPrice: 15000000, lineTotal: 15000000 }
      ],
      subtotal: 60000000,
      taxRate: 11,
      taxAmount: 6600000,
      total: 66600000,
      amountPaid: 66600000,
      balanceDue: 0,
      notes: 'Payment received in full on 2026-08-25',
      sourceType: 'generic',
      createdAt: '2026-08-01'
    },
    {
      id: 'inv-102',
      invoiceNumber: 'INV-2026-0002',
      customerId: 'cust-1',
      customerName: 'PT Telekomunikasi Nusantara Tbk',
      issueDate: '2026-09-01',
      dueDate: '2026-10-01',
      status: 'Partial',
      lineItems: [
        { id: 'li-3', description: 'Enterprise Cloud Infrastructure Services (Sep)', quantity: 1, unitPrice: 45000000, lineTotal: 45000000 },
        { id: 'li-4', description: 'On-premise Migration Consulting (40 hrs)', quantity: 40, unitPrice: 750000, lineTotal: 30000000 }
      ],
      subtotal: 75000000,
      taxRate: 11,
      taxAmount: 8250000,
      total: 83250000,
      amountPaid: 35000000,
      balanceDue: 48250000,
      notes: 'Partial payment received on Sep 10. Balance due Oct 1.',
      sourceType: 'generic',
      createdAt: '2026-09-01'
    },
    {
      id: 'inv-103',
      invoiceNumber: 'INV-2026-0003',
      customerId: 'cust-2',
      customerName: 'PT Sinarmas Mitra Sejati',
      issueDate: '2026-09-05',
      dueDate: '2026-10-05',
      status: 'Sent',
      lineItems: [
        { id: 'li-5', description: 'ERP Accounting Integration Phase 2', quantity: 1, unitPrice: 50000000, lineTotal: 50000000 },
        { id: 'li-6', description: 'Staff Training Workshop (2 days)', quantity: 2, unitPrice: 5000000, lineTotal: 10000000 }
      ],
      subtotal: 60000000,
      taxRate: 11,
      taxAmount: 6600000,
      total: 66600000,
      amountPaid: 0,
      balanceDue: 66600000,
      notes: 'Sent to Dewi Lestari via finance email',
      sourceType: 'generic',
      createdAt: '2026-09-05'
    },
    {
      id: 'inv-104',
      invoiceNumber: 'INV-2026-0004',
      customerId: 'cust-3',
      customerName: 'CV Surya Perkasa Mandiri',
      issueDate: '2026-06-15',
      dueDate: '2026-06-29',
      status: 'Overdue',
      lineItems: [
        { id: 'li-7', description: 'Warehouse Management Hardware Terminal Pack', quantity: 2, unitPrice: 16000000, lineTotal: 32000000 },
        { id: 'li-8', description: 'Barcode Scanner Fleet (10 units)', quantity: 10, unitPrice: 1200000, lineTotal: 12000000 }
      ],
      subtotal: 44000000,
      taxRate: 11,
      taxAmount: 4840000,
      total: 48840000,
      amountPaid: 10000000,
      balanceDue: 38840000,
      notes: '78 days overdue! 2nd reminder letter sent. Contact Hendrik.',
      sourceType: 'generic',
      createdAt: '2026-06-15'
    },
    {
      id: 'inv-105',
      invoiceNumber: 'INV-2026-0005',
      customerId: 'cust-3',
      customerName: 'CV Surya Perkasa Mandiri',
      issueDate: '2026-07-20',
      dueDate: '2026-08-03',
      status: 'Overdue',
      lineItems: [
        { id: 'li-9', description: 'Annual Software License Renewal', quantity: 1, unitPrice: 18000000, lineTotal: 18000000 }
      ],
      subtotal: 18000000,
      taxRate: 11,
      taxAmount: 1980000,
      total: 19980000,
      amountPaid: 0,
      balanceDue: 19980000,
      notes: '44 days overdue. Account placed on credit hold.',
      sourceType: 'generic',
      createdAt: '2026-07-20'
    },
    {
      id: 'inv-106',
      invoiceNumber: 'INV-2026-0006',
      customerId: 'cust-4',
      customerName: 'Grand Horizon Resort & Hospitality',
      issueDate: '2026-08-10',
      dueDate: '2026-09-24',
      status: 'Sent',
      lineItems: [
        { id: 'li-10', description: 'Custom PMS Guest Folio Interface Module', quantity: 1, unitPrice: 85000000, lineTotal: 85000000 },
        { id: 'li-11', description: 'POS Kitchen Printer Network Setup', quantity: 4, unitPrice: 2500000, lineTotal: 10000000 }
      ],
      subtotal: 95000000,
      taxRate: 11,
      taxAmount: 10450000,
      total: 105450000,
      amountPaid: 0,
      balanceDue: 105450000,
      notes: 'Net 45 terms, due Sep 24, 2026',
      sourceType: 'city_ledger',
      createdAt: '2026-08-10'
    },
    {
      id: 'inv-107',
      invoiceNumber: 'INV-2026-0007',
      customerId: 'cust-5',
      customerName: 'PT Karya Bakti Integra',
      issueDate: '2026-08-15',
      dueDate: '2026-09-14',
      status: 'Overdue',
      lineItems: [
        { id: 'li-12', description: 'Dedicated DevOps & SysAdmin Retainer (Aug)', quantity: 1, unitPrice: 28000000, lineTotal: 28000000 }
      ],
      subtotal: 28000000,
      taxRate: 11,
      taxAmount: 3080000,
      total: 31080000,
      amountPaid: 0,
      balanceDue: 31080000,
      notes: '2 days overdue. Friendly reminder sent.',
      sourceType: 'generic',
      createdAt: '2026-08-15'
    },
    {
      id: 'inv-108',
      invoiceNumber: 'INV-2026-0008',
      customerId: 'cust-6',
      customerName: 'PT Digital Kreasi Media',
      issueDate: '2026-09-12',
      dueDate: '2026-09-27',
      status: 'Draft',
      lineItems: [
        { id: 'li-13', description: 'Brand Identity Vector Assets & Motion Kit', quantity: 1, unitPrice: 22000000, lineTotal: 22000000 },
        { id: 'li-14', description: 'Social Media Templates Production', quantity: 15, unitPrice: 600000, lineTotal: 9000000 }
      ],
      subtotal: 31000000,
      taxRate: 11,
      taxAmount: 3410000,
      total: 34410000,
      amountPaid: 0,
      balanceDue: 34410000,
      notes: 'Draft awaiting final review before dispatch',
      sourceType: 'generic',
      createdAt: '2026-09-12'
    },
    {
      id: 'inv-109',
      invoiceNumber: 'INV-2026-0009',
      customerId: 'cust-2',
      customerName: 'PT Sinarmas Mitra Sejati',
      issueDate: '2026-07-01',
      dueDate: '2026-07-31',
      status: 'Void',
      lineItems: [
        { id: 'li-15', description: 'Erroneous duplicate billing', quantity: 1, unitPrice: 15000000, lineTotal: 15000000 }
      ],
      subtotal: 15000000,
      taxRate: 11,
      taxAmount: 1650000,
      total: 16650000,
      amountPaid: 0,
      balanceDue: 0,
      notes: 'Voided due to customer billing address mismatch and duplicate PO',
      sourceType: 'generic',
      createdAt: '2026-07-01',
      voidReason: 'Replaced by INV-2026-0003 - incorrect PO details on original',
      voidDate: '2026-07-05'
    }
  ]);

  readonly payments = signal<Payment[]>([
    {
      id: 'pay-201',
      paymentNumber: 'PAY-2026-0001',
      customerId: 'cust-1',
      customerName: 'PT Telekomunikasi Nusantara Tbk',
      paymentDate: '2026-08-25',
      amount: 66600000,
      method: 'bank_transfer',
      referenceNumber: 'TRF-BCA-8839120',
      notes: 'Full settlement of INV-2026-0001',
      allocations: [
        { invoiceId: 'inv-101', invoiceNumber: 'INV-2026-0001', allocatedAmount: 66600000 }
      ],
      createdAt: '2026-08-25'
    },
    {
      id: 'pay-202',
      paymentNumber: 'PAY-2026-0002',
      customerId: 'cust-1',
      customerName: 'PT Telekomunikasi Nusantara Tbk',
      paymentDate: '2026-09-10',
      amount: 35000000,
      method: 'bank_transfer',
      referenceNumber: 'TRF-MDR-9921004',
      notes: 'Partial payment against INV-2026-0002',
      allocations: [
        { invoiceId: 'inv-102', invoiceNumber: 'INV-2026-0002', allocatedAmount: 35000000 }
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
      method: 'cheque',
      referenceNumber: 'CHQ-BNI-004812',
      notes: 'Partial installment for hardware terminal',
      allocations: [
        { invoiceId: 'inv-104', invoiceNumber: 'INV-2026-0004', allocatedAmount: 10000000 }
      ],
      createdAt: '2026-07-15'
    }
  ]);

  readonly activityLogs = signal<ActivityLog[]>([
    {
      id: 'log-1',
      timestamp: '2026-09-16 09:30',
      type: 'status_changed',
      description: 'System recalculated aging: INV-2026-0007 flagged as Overdue (2 days past due)',
      badgeType: 'warning'
    },
    {
      id: 'log-2',
      timestamp: '2026-09-12 14:15',
      type: 'invoice_created',
      description: 'Draft invoice INV-2026-0008 created for PT Digital Kreasi Media',
      amount: 34410000,
      referenceId: 'INV-2026-0008',
      badgeType: 'secondary'
    },
    {
      id: 'log-3',
      timestamp: '2026-09-10 11:20',
      type: 'payment_recorded',
      description: 'Payment PAY-2026-0002 received from PT Telekomunikasi Nusantara Tbk (Rp 35.000.000)',
      amount: 35000000,
      referenceId: 'PAY-2026-0002',
      badgeType: 'success'
    },
    {
      id: 'log-4',
      timestamp: '2026-09-05 16:45',
      type: 'invoice_created',
      description: 'Invoice INV-2026-0003 issued & sent to PT Sinarmas Mitra Sejati',
      amount: 66600000,
      referenceId: 'INV-2026-0003',
      badgeType: 'info'
    },
    {
      id: 'log-5',
      timestamp: '2026-07-05 10:00',
      type: 'invoice_voided',
      description: 'Invoice INV-2026-0009 voided (Audit trail maintained)',
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
      if (inv.status !== 'Void' && inv.status !== 'Paid' && inv.status !== 'Draft') {
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

  // Calculate Derived Status for an invoice
  deriveInvoiceStatus(inv: { status: InvoiceStatus; amountPaid: number; total: number; dueDate: string }): InvoiceStatus {
    if (inv.status === 'Void') return 'Void';
    if (inv.status === 'Draft') return 'Draft';
    if (inv.amountPaid >= inv.total) return 'Paid';

    const isPastDue = inv.dueDate < this.today;
    if (isPastDue) return 'Overdue';
    if (inv.amountPaid > 0) return 'Partial';
    return 'Sent';
  }

  // Get Customer by ID
  getCustomer(customerId: string): Customer | undefined {
    return this.customers().find(c => c.id === customerId);
  }

  // Get Customer's calculated running balance
  getCustomerBalance(customerId: string): number {
    return this.invoices()
      .filter(i => i.customerId === customerId && i.status !== 'Void' && i.status !== 'Draft')
      .reduce((sum, i) => sum + i.balanceDue, 0);
  }

  // Get Customer's total invoiced to date
  getCustomerTotalInvoiced(customerId: string): number {
    return this.invoices()
      .filter(i => i.customerId === customerId && i.status !== 'Void')
      .reduce((sum, i) => sum + i.total, 0);
  }

  // Get Customer's total paid
  getCustomerTotalPaid(customerId: string): number {
    return this.invoices()
      .filter(i => i.customerId === customerId && i.status !== 'Void')
      .reduce((sum, i) => sum + i.amountPaid, 0);
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

  // Action: Create Invoice
  createInvoice(payload: {
    customerId: string;
    issueDate: string;
    dueDate: string;
    lineItems: { description: string; quantity: number; unitPrice: number }[];
    taxRate: number;
    notes?: string;
    sourceType?: 'generic' | 'city_ledger' | 'direct';
    saveAs: 'Draft' | 'Sent';
  }): Invoice {
    const customer = this.customers().find(c => c.id === payload.customerId);
    const customerName = customer ? customer.name : 'Unknown Customer';

    const calculatedItems = payload.lineItems.map((item, idx) => ({
      id: `li-${Date.now()}-${idx}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: Math.round(item.quantity * item.unitPrice)
    }));

    const subtotal = calculatedItems.reduce((acc, curr) => acc + curr.lineTotal, 0);
    const taxAmount = Math.round((subtotal * payload.taxRate) / 100);
    const total = subtotal + taxAmount;
    const initialStatus = payload.saveAs;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: this.getNextInvoiceNumber(),
      customerId: payload.customerId,
      customerName,
      issueDate: payload.issueDate,
      dueDate: payload.dueDate,
      status: initialStatus,
      lineItems: calculatedItems,
      subtotal,
      taxRate: payload.taxRate,
      taxAmount,
      total,
      amountPaid: 0,
      balanceDue: total,
      notes: payload.notes || '',
      sourceType: payload.sourceType || 'generic',
      createdAt: this.today
    };

    // Recompute actual derived status
    newInvoice.status = this.deriveInvoiceStatus(newInvoice);

    this.invoices.update(list => [newInvoice, ...list]);

    this.addActivityLog({
      type: 'invoice_created',
      description: `Invoice ${newInvoice.invoiceNumber} (${newInvoice.status}) created for ${customerName}`,
      amount: newInvoice.total,
      referenceId: newInvoice.invoiceNumber,
      badgeType: newInvoice.status === 'Draft' ? 'secondary' : 'info'
    });

    return newInvoice;
  }

  // Action: Void Invoice (audit-driven soft cancellation)
  voidInvoice(invoiceId: string, reason: string): boolean {
    const inv = this.invoices().find(i => i.id === invoiceId);
    if (!inv) return false;

    if (inv.status === 'Void') return false;

    this.invoices.update(list =>
      list.map(i => {
        if (i.id === invoiceId) {
          return {
            ...i,
            status: 'Void',
            balanceDue: 0,
            voidReason: reason,
            voidDate: this.today
          };
        }
        return i;
      })
    );

    this.addActivityLog({
      type: 'invoice_voided',
      description: `Invoice ${inv.invoiceNumber} voided. Reason: "${reason}"`,
      referenceId: inv.invoiceNumber,
      badgeType: 'danger'
    });

    return true;
  }

  // Action: Issue Draft Invoice (Draft -> Sent)
  issueInvoice(invoiceId: string): boolean {
    const inv = this.invoices().find(i => i.id === invoiceId);
    if (!inv || inv.status !== 'Draft') return false;

    this.invoices.update(list =>
      list.map(i => {
        if (i.id === invoiceId) {
          const updated: Invoice = { ...i, status: 'Sent' };
          updated.status = this.deriveInvoiceStatus(updated);
          return updated;
        }
        return i;
      })
    );

    this.addActivityLog({
      type: 'status_changed',
      description: `Invoice ${inv.invoiceNumber} issued and sent to ${inv.customerName}`,
      amount: inv.total,
      referenceId: inv.invoiceNumber,
      badgeType: 'info'
    });

    return true;
  }

  // Action: Record Payment with Multi-Invoice Allocation
  recordPayment(payload: {
    customerId: string;
    paymentDate: string;
    amount: number;
    method: PaymentMethod;
    referenceNumber: string;
    notes?: string;
    allocations: { invoiceId: string; allocatedAmount: number }[];
  }): Payment {
    const customer = this.customers().find(c => c.id === payload.customerId);
    const customerName = customer ? customer.name : 'Unknown Customer';

    const validAllocations: { invoiceId: string; invoiceNumber: string; allocatedAmount: number }[] = [];

    // Apply allocations to invoices
    this.invoices.update(currentList => {
      return currentList.map(inv => {
        const alloc = payload.allocations.find(a => a.invoiceId === inv.id && a.allocatedAmount > 0);
        if (alloc) {
          const applied = Math.min(alloc.allocatedAmount, inv.balanceDue);
          const newAmountPaid = inv.amountPaid + applied;
          const newBalanceDue = Math.max(0, inv.total - newAmountPaid);
          validAllocations.push({
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            allocatedAmount: applied
          });

          const updatedInv = {
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
      referenceNumber: payload.referenceNumber,
      notes: payload.notes,
      allocations: validAllocations,
      createdAt: this.today
    };

    this.payments.update(list => [payment, ...list]);

    this.addActivityLog({
      type: 'payment_recorded',
      description: `Payment ${payment.paymentNumber} received from ${customerName} (Rp ${payment.amount.toLocaleString('id-ID')})`,
      amount: payment.amount,
      referenceId: payment.paymentNumber,
      badgeType: 'success'
    });

    return payment;
  }

  // Action: Create Customer
  createCustomer(payload: Omit<Customer, 'id' | 'code' | 'createdAt'>): Customer {
    const count = this.customers().length + 1;
    const newCustomer: Customer = {
      ...payload,
      id: `cust-${Date.now()}`,
      code: `CUST-${count.toString().padStart(3, '0')}`,
      createdAt: this.today
    };

    this.customers.update(list => [...list, newCustomer]);

    this.addActivityLog({
      type: 'customer_created',
      description: `New customer ${newCustomer.name} (${newCustomer.code}) registered`,
      referenceId: newCustomer.code,
      badgeType: 'info'
    });

    return newCustomer;
  }

  // Calculate Aging Report
  getAgingReport(asOfDate: string = this.today): { buckets: AgingBucket[]; grandTotal: AgingBucket } {
    const asOfTime = new Date(asOfDate).getTime();
    const customerMap = new Map<string, AgingBucket>();

    // Initialize map for each customer
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
        totalOutstanding: 0
      });
    }

    // Process all active invoices with remaining balance
    for (const inv of this.invoices()) {
      if (inv.status === 'Void' || inv.status === 'Draft' || inv.balanceDue <= 0) {
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
          totalOutstanding: 0
        };
        customerMap.set(inv.customerId, bucket);
      }

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

  private addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const newLog: ActivityLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: `${this.today} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    };
    this.activityLogs.update(logs => [newLog, ...logs.slice(0, 19)]);
  }
}
