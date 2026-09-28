import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { V3ArComponent } from './v3-design/v3-ar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, V3ArComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Retained for test compatibility
  designMode = signal<'v3'>('v3');
}
