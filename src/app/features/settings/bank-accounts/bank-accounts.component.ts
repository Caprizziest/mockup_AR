import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArDataService } from '../../../core/services/ar-data.service';
import { BankAccount } from '../../../core/models/ar.models';
import { ConfirmDialogComponent, DeleteModalState } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-bank-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="d-flex flex-column gap-3">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h3 class="fw-bold mb-1" style="font-size: 1.15rem;">Rekening Bank</h3>
          <p class="text-muted small mb-0">Daftar rekening bank penerima pembayaran pelanggan.</p>
        </div>
        <button type="button" class="v3-btn-primary" [disabled]="!isAdmin" (click)="openNewBankAccountModal()">
          + Tambah Rekening
        </button>
      </div>

      <div class="v3-card">
        <div class="v3-table-container">
          <table class="v3-table">
            <thead>
              <tr>
                <th>Bank</th>
                <th>No. Rekening</th>
                <th>Atas Nama</th>
                <th>Status</th>
                <th class="text-end">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let bank of arService.bankAccounts()">
                <td class="fw-semibold text-dark">{{ bank.bankName }}</td>
                <td class="v3-mono fw-bold fs-6">{{ bank.accountNumber }}</td>
                <td>{{ bank.accountHolder }}</td>
                <td>
                  <span *ngIf="bank.isDefault"
                    class="badge bg-success-subtle text-success border border-success-subtle">Utama (Default)</span>
                  <span *ngIf="!bank.isDefault" class="badge bg-light text-muted border">Operasional</span>
                </td>
                <td class="text-end">
                  <div class="d-inline-flex gap-1">
                    <button type="button" class="btn btn-sm btn-outline-primary py-1 px-2" style="font-size: 0.75rem;"
                      [disabled]="!isAdmin" (click)="openEditBankAccountModal(bank)">
                      Ubah
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger py-1 px-2" style="font-size: 0.75rem;"
                      [disabled]="!isAdmin" (click)="requestDeleteBankAccount(bank)">
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Bank Account -->
    <div class="v3-modal-backdrop" *ngIf="showBankAccountModal()">
      <div class="v3-modal">
        <div class="v3-modal-header">
          <h4 class="fw-bold mb-0 fs-5">
            {{ editingBankId() ? 'Ubah Data Rekening Bank' : 'Tambah Rekening Bank Hotel' }}
          </h4>
          <button type="button" class="btn-close" (click)="showBankAccountModal.set(false)"></button>
        </div>
        <div class="v3-modal-body">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label small fw-semibold">Nama Bank Penerima *</label>
              <input type="text" class="form-control form-control-sm" placeholder="Contoh: Bank Central Asia (BCA)"
                [ngModel]="formBankName()" (ngModelChange)="formBankName.set($event)">
            </div>
            <div class="col-12">
              <label class="form-label small fw-semibold">Nomor Rekening Bank *</label>
              <input type="text" class="form-control form-control-sm v3-mono" placeholder="Contoh: 802-099-1234"
                [ngModel]="formAccountNumber()" (ngModelChange)="formAccountNumber.set($event)">
            </div>
            <div class="col-12">
              <label class="form-label small fw-semibold">Nama Pemilik Rekening *</label>
              <input type="text" class="form-control form-control-sm" placeholder="Contoh: PT Galesong Pratama"
                [ngModel]="formAccountHolder()" (ngModelChange)="formAccountHolder.set($event)">
            </div>
            <div class="col-12">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="defaultBankCheck"
                  [ngModel]="formIsDefault()" (ngModelChange)="formIsDefault.set($event)">
                <label class="form-check-label small" for="defaultBankCheck">
                  Jadikan sebagai rekening utama (default) penagihan
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="v3-modal-footer">
          <button type="button" class="v3-btn-secondary" (click)="showBankAccountModal.set(false)">Batal</button>
          <button type="button" class="v3-btn-primary" [disabled]="!formBankName().trim() || !formAccountNumber().trim()"
            (click)="submitBankAccountForm()">
            Simpan Rekening Bank
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <app-confirm-dialog
      [isOpen]="showDeleteModal()"
      [state]="deleteState()"
      (close)="showDeleteModal.set(false)"
      (confirm)="executeDelete($event)">
    </app-confirm-dialog>
  `
})
export class BankAccountsComponent {
  readonly arService = inject(ArDataService);

  showBankAccountModal = signal<boolean>(false);
  editingBankId = signal<string | null>(null);
  formBankName = signal<string>('');
  formAccountNumber = signal<string>('');
  formAccountHolder = signal<string>('');
  formIsDefault = signal<boolean>(false);

  showDeleteModal = signal<boolean>(false);
  deleteState = signal<DeleteModalState | null>(null);

  get isAdmin(): boolean {
    return this.arService.currentUser().role === 'Admin';
  }

  openNewBankAccountModal() {
    this.editingBankId.set(null);
    this.formBankName.set('');
    this.formAccountNumber.set('');
    this.formAccountHolder.set('PT Galesong Pratama');
    this.formIsDefault.set(false);
    this.showBankAccountModal.set(true);
  }

  openEditBankAccountModal(bank: BankAccount) {
    this.editingBankId.set(bank.id);
    this.formBankName.set(bank.bankName);
    this.formAccountNumber.set(bank.accountNumber);
    this.formAccountHolder.set(bank.accountHolder);
    this.formIsDefault.set(!!bank.isDefault);
    this.showBankAccountModal.set(true);
  }

  submitBankAccountForm() {
    if (!this.formBankName().trim() || !this.formAccountNumber().trim()) return;

    const payload = {
      bankName: this.formBankName().trim(),
      accountNumber: this.formAccountNumber().trim(),
      accountHolder: this.formAccountHolder().trim(),
      isDefault: this.formIsDefault()
    };

    const id = this.editingBankId();
    if (id) {
      this.arService.bankAccounts.update(list =>
        list.map(b => b.id === id ? { ...b, ...payload } : (payload.isDefault ? { ...b, isDefault: false } : b))
      );
    } else {
      const newBank: BankAccount = {
        id: 'bank-' + Date.now(),
        ...payload
      };
      if (payload.isDefault) {
        this.arService.bankAccounts.update(list => list.map(b => ({ ...b, isDefault: false })));
      }
      this.arService.bankAccounts.update(list => [...list, newBank]);
    }

    this.showBankAccountModal.set(false);
  }

  requestDeleteBankAccount(bank: BankAccount) {
    this.deleteState.set({
      type: 'bank_account',
      id: bank.id,
      title: 'Hapus Rekening Bank',
      name: `${bank.bankName} - ${bank.accountNumber}`,
      message: 'Apakah Anda yakin ingin menghapus rekening bank ini dari master data?',
      canDelete: !bank.isDefault,
      blockedReason: bank.isDefault ? 'Rekening utama (default) tidak dapat dihapus.' : undefined
    });
    this.showDeleteModal.set(true);
  }

  executeDelete(state: DeleteModalState) {
    this.arService.bankAccounts.update(list => list.filter(b => b.id !== state.id));
    this.showDeleteModal.set(false);
  }
}
