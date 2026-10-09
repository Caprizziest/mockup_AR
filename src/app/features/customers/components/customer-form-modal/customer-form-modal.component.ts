import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../../../core/models/ar.models';

@Component({
  selector: 'app-customer-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="v3-modal-backdrop" *ngIf="isOpen">
      <div class="v3-modal v3-modal-lg">
        <div class="v3-modal-header">
          <h4 class="fw-bold mb-0 fs-5">
            {{ customer ? 'Ubah Data Pelanggan' : 'Tambah Pelanggan Baru' }}
          </h4>
          <button type="button" class="btn-close" (click)="close.emit()"></button>
        </div>
        <div class="v3-modal-body">
          <div class="row g-3">
            <div class="col-12 col-md-8">
              <label class="form-label small fw-semibold">Nama Pelanggan / Perusahaan *</label>
              <input type="text" class="form-control form-control-sm"
                placeholder="Contoh: PT Telekomunikasi Nusantara Tbk" [ngModel]="formName()"
                (ngModelChange)="formName.set($event)">
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label small fw-semibold">Status</label>
              <select class="form-select form-select-sm" [ngModel]="formStatus()"
                (ngModelChange)="formStatus.set($event)">
                <option value="active">Aktif</option>
                <option value="credit_hold">Credit Hold</option>
              </select>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-semibold">NIK (16 Digit) *</label>
              <input type="text" class="form-control form-control-sm v3-mono" placeholder="16 digit angka KTP"
                maxlength="16" [ngModel]="formNik()" (ngModelChange)="formNik.set($event)">
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-semibold">NPWP *</label>
              <input type="text" class="form-control form-control-sm v3-mono" placeholder="Contoh: 01.345.678.9-012.000"
                [ngModel]="formNpwp()" (ngModelChange)="formNpwp.set($event)">
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-semibold">Contact Person</label>
              <input type="text" class="form-control form-control-sm" [ngModel]="formContact()"
                (ngModelChange)="formContact.set($event)">
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-semibold">No. Telepon / WhatsApp</label>
              <input type="text" class="form-control form-control-sm" [ngModel]="formPhone()"
                (ngModelChange)="formPhone.set($event)">
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-semibold">Email Penagihan</label>
              <input type="email" class="form-control form-control-sm" [ngModel]="formEmail()"
                (ngModelChange)="formEmail.set($event)">
            </div>

            <div class="col-6 col-md-3">
              <label class="form-label small fw-semibold">Termin (Hari)</label>
              <input type="number" min="0" class="form-control form-control-sm v3-mono" [ngModel]="formDueDays()"
                (ngModelChange)="formDueDays.set($event)">
            </div>

            <div class="col-6 col-md-3">
              <label class="form-label small fw-semibold">Plafon Kredit (Rp)</label>
              <input type="number" step="10000000" class="form-control form-control-sm v3-mono"
                [ngModel]="formCreditLimit()" (ngModelChange)="formCreditLimit.set($event)">
            </div>

            <div class="col-12">
              <label class="form-label small fw-semibold">Alamat</label>
              <textarea class="form-control form-control-sm" rows="2" [ngModel]="formAddress()"
                (ngModelChange)="formAddress.set($event)"></textarea>
            </div>

            <div class="col-12">
              <label class="form-label small fw-semibold">Catatan</label>
              <input type="text" class="form-control form-control-sm"
                placeholder="Catatan opsional..." [ngModel]="formNotes()"
                (ngModelChange)="formNotes.set($event)">
            </div>
          </div>
        </div>
        <div class="v3-modal-footer">
          <button type="button" class="v3-btn-secondary" (click)="close.emit()">Batal</button>
          <button type="button" class="v3-btn-primary" [disabled]="!formName().trim()"
            (click)="onSave()">
            {{ customer ? 'Simpan Perubahan' : 'Simpan Pelanggan' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class CustomerFormModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() customer: Customer | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  formName = signal<string>('');
  formStatus = signal<'active' | 'credit_hold'>('active');
  formNik = signal<string>('');
  formNpwp = signal<string>('');
  formContact = signal<string>('');
  formPhone = signal<string>('');
  formEmail = signal<string>('');
  formDueDays = signal<number>(30);
  formCreditLimit = signal<number>(100000000);
  formAddress = signal<string>('');
  formNotes = signal<string>('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customer'] && this.customer) {
      this.formName.set(this.customer.name);
      this.formStatus.set(this.customer.status);
      this.formNik.set(this.customer.nik || '');
      this.formNpwp.set(this.customer.npwp || '');
      this.formContact.set(this.customer.contactPerson || '');
      this.formPhone.set(this.customer.phone || '');
      this.formEmail.set(this.customer.email || '');
      this.formDueDays.set(this.customer.dueDays || 30);
      this.formCreditLimit.set(this.customer.creditLimit || 100000000);
      this.formAddress.set(this.customer.address || '');
      this.formNotes.set(this.customer.notes || '');
    } else if (changes['isOpen'] && this.isOpen && !this.customer) {
      this.formName.set('');
      this.formStatus.set('active');
      this.formNik.set('');
      this.formNpwp.set('');
      this.formContact.set('');
      this.formPhone.set('');
      this.formEmail.set('');
      this.formDueDays.set(30);
      this.formCreditLimit.set(100000000);
      this.formAddress.set('');
      this.formNotes.set('');
    }
  }

  onSave() {
    this.save.emit({
      id: this.customer?.id,
      name: this.formName(),
      status: this.formStatus(),
      nik: this.formNik(),
      npwp: this.formNpwp(),
      contactPerson: this.formContact(),
      phone: this.formPhone(),
      email: this.formEmail(),
      dueDays: Number(this.formDueDays()),
      creditLimit: Number(this.formCreditLimit()),
      address: this.formAddress(),
      notes: this.formNotes()
    });
  }
}
