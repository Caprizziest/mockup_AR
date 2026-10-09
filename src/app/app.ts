import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './layout/layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Retained for test compatibility with app.spec.ts
  designMode = signal<'v3'>('v3');
}
