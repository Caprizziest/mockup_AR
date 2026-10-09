import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Invoice } from '../../../../core/models/ar.models';

@Component({
  selector: 'app-cancel-invoice-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="v3-modal-backdrop" *ngIf="isOpen && invoice">
      <div class="v3-modal">
        <div class="v3-modal-header">
          <h4 class="fw-bold mb-0 fs-5 text-danger">Batalkan Invoice {{ invoice.invoiceNumber }}</h4>
          <button type="button" class="btn-close" (click)="close.emit()"></button>
        </div>
        <div class="v3-modal-body">
          <div class="alert alert-warning small mb-3">
            <strong>Perhatian:</strong> Invoice yang dibatalkan bersifat final. Pastikan invoice belum memiliki pembayaran teralokasi.
          </div>
          <label class="form-label small fw-semibold">Alasan Pembatalan *</label>
          <textarea class="form-control" rows="3"
            placeholder="Tuliskan alasan pembatalan..."
            [ngModel]="reason()" (ngModelChange)="reason.set($event)">
          </textarea>
        </div>
        <div class="v3-modal-footer">
          <button type="button" class="v3-btn-secondary" (click)="close.emit()">Batal</button>
          <button type="button" class="btn btn-danger btn-sm fw-semibold" [disabled]="!reason().trim()"
            (click)="onConfirm()">
            Batalkan Invoice
          </button>
        </div>
      </div>
    </div>
  `
})
export class CancelInvoiceModalComponent {
  @Input() isOpen = false;
  @Input() invoice: Invoice | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{ invoiceId: string; reason: string }>();

  reason = signal<string>('');

  onConfirm() {
    if (this.invoice && this.reason().trim()) {
      this.confirm.emit({ invoiceId: this.invoice.id, reason: this.reason().trim() });
      this.reason.set('');
    }
  }
}
