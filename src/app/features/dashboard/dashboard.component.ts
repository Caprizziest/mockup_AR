import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArDataService } from '../../core/services/ar-data.service';
import { NavigationService } from '../../core/services/navigation.service';
import { RupiahPipe } from '../../shared/pipes/rupiah.pipe';
import { Customer, Invoice } from '../../core/models/ar.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RupiahPipe],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  readonly arService = inject(ArDataService);
  readonly navService = inject(NavigationService);

  dashboardDebtorTab = signal<'overdue' | 'debtors'>('overdue');

  computedDSO = computed(() => {
    const metrics = this.arService.dashboardMetrics();
    const totalCreditSales = this.arService.invoices()
      .filter(i => i.status !== 'Draft' && i.status !== 'Cancelled')
      .reduce((sum, i) => sum + i.total, 0);

    const days = totalCreditSales > 0 ? Math.max(1, Math.round((metrics.totalOutstanding / totalCreditSales) * 30)) : 0;
    let statusText = 'Optimal (< 30 hari)';
    let badgeClass = 'text-success bg-success-subtle border-success-subtle';
    let statusDesc = 'Perputaran kas lancar dan penagihan efektif sesuai tempo standar Net 30.';

    if (days > 45) {
      statusText = 'Kritis (> 45 hari)';
      badgeClass = 'text-danger bg-danger-subtle border-danger-subtle';
      statusDesc = 'Tertahan cukup lama, perlu tindakan penagihan intensif.';
    } else if (days > 30) {
      statusText = 'Perhatian (30-45 hari)';
      badgeClass = 'text-warning bg-warning-subtle border-warning-subtle';
      statusDesc = 'Siklus penagihan sedikit melambat di atas batas standar Net 30.';
    }

    return { days, statusText, badgeClass, statusDesc };
  });

  agingData = computed(() => {
    return this.arService.getAgingReport(this.arService.today);
  });

  agingDistribution = computed(() => {
    const grand = this.agingData().grandTotal;
    const total = grand.totalOutstanding;
    const calcPct = (val: number) => (total > 0 ? Math.round((val / total) * 100) : 0);

    return {
      current: grand.current,
      currentPct: calcPct(grand.current),
      days1_30: grand.days1_30,
      days1_30Pct: calcPct(grand.days1_30),
      days31_60: grand.days31_60,
      days31_60Pct: calcPct(grand.days31_60),
      days61_90: grand.days61_90,
      days61_90Pct: calcPct(grand.days61_90),
      days90Plus: grand.days90Plus,
      days90PlusPct: calcPct(grand.days90Plus),
      total
    };
  });

  agingChartData = computed(() => {
    const dist = this.agingDistribution();
    const buckets = [
      {
        id: 'current',
        label: 'Belum Tempo',
        sublabel: 'Lancar / On-Schedule',
        amount: dist.current,
        pct: dist.currentPct,
        barClass: 'v3-bar-current',
        dotClass: 'dot-green',
        badgeClass: 'bg-success-subtle text-success border border-success-subtle'
      },
      {
        id: '1-30',
        label: '1 - 30 Hari',
        sublabel: 'Keterlambatan Awal',
        amount: dist.days1_30,
        pct: dist.days1_30Pct,
        barClass: 'v3-bar-130',
        dotClass: 'dot-blue',
        badgeClass: 'bg-primary-subtle text-primary border border-primary-subtle'
      },
      {
        id: '31-60',
        label: '31 - 60 Hari',
        sublabel: 'Perhatian Khusus',
        amount: dist.days31_60,
        pct: dist.days31_60Pct,
        barClass: 'v3-bar-3160',
        dotClass: 'dot-yellow',
        badgeClass: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
      },
      {
        id: '61-90',
        label: '61 - 90 Hari',
        sublabel: 'Waspada Tinggi',
        amount: dist.days61_90,
        pct: dist.days61_90Pct,
        barClass: 'v3-bar-6190',
        dotClass: 'dot-orange',
        badgeClass: 'bg-warning-subtle text-dark border border-warning-subtle'
      },
      {
        id: '90plus',
        label: '> 90 Hari',
        sublabel: 'Kritis / Bad Debt Risk',
        amount: dist.days90Plus,
        pct: dist.days90PlusPct,
        barClass: 'v3-bar-90plus',
        dotClass: 'dot-red',
        badgeClass: 'bg-danger-subtle text-danger border border-danger-subtle'
      }
    ];

    const maxAmount = Math.max(...buckets.map(b => b.amount), 1);
    return {
      buckets: buckets.map(b => ({
        ...b,
        heightPct: Math.max(12, Math.round((b.amount / maxAmount) * 100))
      })),
      totalOutstanding: dist.total
    };
  });

  priorityOverdueInvoices = computed(() => {
    return this.arService.invoices()
      .filter(i => i.status === 'Overdue')
      .sort((a, b) => b.balanceDue - a.balanceDue);
  });

  topDebtorCustomers = computed(() => {
    const invoices = this.arService.invoices();
    return this.arService.customers()
      .map(c => {
        const balance = this.arService.getCustomerBalance(c.id);
        const overdueInvs = invoices.filter(i => i.customerId === c.id && i.status === 'Overdue');
        const overdueTotal = overdueInvs.reduce((sum, i) => sum + i.balanceDue, 0);
        const limitUsage = c.creditLimit > 0 ? Math.round((balance / c.creditLimit) * 100) : 0;
        return {
          customer: c,
          balance,
          invoiceCount: this.arService.getCustomerInvoiceCount(c.id),
          utilization: limitUsage,
          limitUsage,
          overdueCount: overdueInvs.length,
          overdueTotal
        };
      })
      .filter(item => item.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  });

  recentPayments = computed(() => {
    return [...this.arService.payments()]
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .slice(0, 6);
  });

  getCustomer(customerId: string) {
    return this.arService.getCustomer(customerId);
  }

  getDaysPastDue(dueDateStr: string): number {
    const dueTime = new Date(dueDateStr).getTime();
    const todayTime = new Date(this.arService.today).getTime();
    const diff = Math.floor((todayTime - dueTime) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  navigateTo(view: any) {
    this.navService.navigateTo(view);
  }

  viewInvoice(inv: Invoice) {
    this.navService.navigateTo('invoice-detail', { invoice: inv });
  }

  viewCustomer(cust: Customer) {
    this.navService.navigateTo('customer-detail', { customer: cust });
  }
}
