import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'invoices',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/invoices/pages/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent)
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./features/invoices/pages/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent)
      },
      {
        path: 'edit',
        loadComponent: () =>
          import('./features/invoices/pages/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent)
      },
      {
        path: 'detail',
        loadComponent: () =>
          import('./features/invoices/pages/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent)
      }
    ]
  },
  {
    path: 'payments',
    loadComponent: () =>
      import('./features/payments/pages/payment-list/payment-list.component').then(m => m.PaymentListComponent)
  },
  {
    path: 'income-audit',
    loadComponent: () =>
      import('./features/income-audit/pages/income-audit-list/income-audit-list.component').then(m => m.IncomeAuditListComponent)
  },
  {
    path: 'customers',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/customers/pages/customer-list/customer-list.component').then(m => m.CustomerListComponent)
      },
      {
        path: 'detail',
        loadComponent: () =>
          import('./features/customers/pages/customer-detail/customer-detail.component').then(m => m.CustomerDetailComponent)
      }
    ]
  },
  {
    path: 'dp-management',
    loadComponent: () =>
      import('./features/dp-management/pages/dp-list/dp-list.component').then(m => m.DpListComponent)
  },
  {
    path: 'reports',
    children: [
      {
        path: 'aging',
        loadComponent: () =>
          import('./features/reports/aging-report/aging-report.component').then(m => m.AgingReportComponent)
      },
      {
        path: 'mutasi',
        loadComponent: () =>
          import('./features/reports/mutasi-piutang/mutasi-piutang.component').then(m => m.MutasiPiutangComponent)
      },
      {
        path: 'kartu-piutang',
        loadComponent: () =>
          import('./features/reports/kartu-piutang/kartu-piutang.component').then(m => m.KartuPiutangComponent)
      }
    ]
  },
  {
    path: 'settings',
    children: [
      {
        path: 'bank-accounts',
        loadComponent: () =>
          import('./features/settings/bank-accounts/bank-accounts.component').then(m => m.BankAccountsComponent)
      },
      {
        path: 'activity-logs',
        loadComponent: () =>
          import('./features/settings/activity-logs/activity-logs.component').then(m => m.ActivityLogsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
