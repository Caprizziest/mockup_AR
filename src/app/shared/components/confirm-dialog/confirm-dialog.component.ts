import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="v3-modal-backdrop" *ngIf="isOpen && state">
      <div class="v3-modal">
        <div class="v3-modal-header">
          <h4 class="fw-bold mb-0 fs-5" [class.text-danger]="state.canDelete" [class.text-warning]="!state.canDelete">
            {{ state.title }}
          </h4>
          <button type="button" class="btn-close" (click)="close.emit()"></button>
        </div>
        <div class="v3-modal-body">
          <div *ngIf="!state.canDelete" class="alert alert-danger mb-3">
            <strong class="d-block mb-1">Penghapusan Ditolak</strong>
            <span class="small">{{ state.blockedReason }}</span>
          </div>

          <p class="small text-muted mb-3">{{ state.message }}</p>

          <div class="p-2 bg-light rounded border text-dark v3-mono small">
            <strong>Data:</strong> {{ state.name }}
          </div>
        </div>
        <div class="v3-modal-footer">
          <button type="button" class="v3-btn-secondary" (click)="close.emit()">
            {{ state.canDelete ? 'Batal' : 'Tutup' }}
          </button>
          <button type="button" class="btn btn-danger btn-sm fw-semibold" *ngIf="state.canDelete"
            (click)="confirm.emit(state)">
            Hapus
          </button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() state: DeleteModalState | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<DeleteModalState>();
}
