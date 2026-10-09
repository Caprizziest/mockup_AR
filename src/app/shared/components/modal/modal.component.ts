import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop-custom" (click)="onBackdropClick($event)">
      <div class="modal-dialog-custom" [style.max-width]="maxWidth" (click)="$event.stopPropagation()">
        <div class="modal-header-custom" *ngIf="title">
          <div class="d-flex align-items-center gap-2">
            <i *ngIf="icon" [class]="icon"></i>
            <h5 class="modal-title m-0">{{ title }}</h5>
          </div>
          <button type="button" class="btn-close-custom" (click)="close.emit()" aria-label="Close">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body-custom">
          <ng-content select="[body], [modal-body], :not([modal-footer])"></ng-content>
        </div>
        <div class="modal-footer-custom" *ngIf="hasFooter">
          <ng-content select="[footer], [modal-footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop-custom {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 1060;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-dialog-custom {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      animation: modalFadeIn 0.15s ease-out;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-header-custom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      background: #ffffff;
    }
    .modal-title {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }
    .btn-close-custom {
      background: none;
      border: none;
      color: #64748b;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
      border-radius: 6px;
      transition: background 0.15s;
    }
    .btn-close-custom:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .modal-body-custom {
      padding: 1.25rem;
      overflow-y: auto;
      flex: 1 1 auto;
    }
    .modal-footer-custom {
      padding: 0.85rem 1.25rem;
      border-top: 1px solid #f1f5f9;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() icon = '';
  @Input() maxWidth = '650px';
  @Input() hasFooter = true;
  @Input() closeOnBackdrop = true;

  @Output() close = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent) {
    if (this.closeOnBackdrop) {
      this.close.emit();
    }
  }
}
