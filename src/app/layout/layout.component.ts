import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { ActionInboxDrawerComponent } from './components/action-inbox-drawer/action-inbox-drawer.component';
import { PaymentFormModalComponent } from '../features/payments/components/payment-form-modal/payment-form-modal.component';
import { NavigationService } from '../core/services/navigation.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    TopbarComponent,
    ActionInboxDrawerComponent,
    PaymentFormModalComponent
  ],
  template: `
    <div class="v3-shell">
      <!-- Sidebar Navigation -->
      <app-sidebar></app-sidebar>

      <!-- Main Shell Area -->
      <div class="v3-main">
        <!-- Top Navigation Bar -->
        <app-topbar></app-topbar>

        <!-- Dynamic Feature Content Area via Router -->
        <main class="v3-content">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Action Inbox Drawer -->
      <app-action-inbox-drawer></app-action-inbox-drawer>

      <!-- Global Payment Intake Form Modal -->
      <app-payment-form-modal></app-payment-form-modal>

      <!-- Global Toast Notifications -->
      <div class="v3-toast" *ngIf="navService.toastMessage()" [ngClass]="'toast-' + navService.toastType()">
        <span>{{ navService.toastMessage() }}</span>
      </div>
    </div>
  `
})
export class LayoutComponent {
  readonly navService = inject(NavigationService);
}
