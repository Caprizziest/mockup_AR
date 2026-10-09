import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceStatus } from '../../../core/models/ar.models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="v3-badge" [ngClass]="badgeClass">
      <i *ngIf="status === 'Overdue'" class="bi bi-exclamation-circle-fill me-1"></i>
      <i *ngIf="status === 'Paid'" class="bi bi-check-circle-fill me-1"></i>
      {{ status }}
    </span>
  `,
  styles: [`
    .v3-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      white-space: nowrap;
    }
    .v3-badge-draft { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .v3-badge-issued { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .v3-badge-partial { background: #fefce8; color: #a16207; border: 1px solid #fef08a; }
    .v3-badge-paid { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
    .v3-badge-overdue { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .v3-badge-cancelled { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
  `]
})
export class StatusBadgeComponent {
  @Input() status: InvoiceStatus | string = 'Draft';

  get badgeClass(): string {
    switch (this.status) {
      case 'Draft': return 'v3-badge-draft';
      case 'Issued': return 'v3-badge-issued';
      case 'Partially Paid': return 'v3-badge-partial';
      case 'Paid': return 'v3-badge-paid';
      case 'Overdue': return 'v3-badge-overdue';
      case 'Cancelled': return 'v3-badge-cancelled';
      default: return 'v3-badge-draft';
    }
  }
}
