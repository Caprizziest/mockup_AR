import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'indoDate',
  standalone: true
})
export class IndonesianDatePipe implements PipeTransform {
  private static readonly MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  transform(value: string | Date | null | undefined): string {
    if (!value) return '-';
    try {
      const date = typeof value === 'string' ? new Date(value) : value;
      if (isNaN(date.getTime())) return String(value);
      const d = date.getDate();
      const m = IndonesianDatePipe.MONTHS[date.getMonth()];
      const y = date.getFullYear();
      return `${d} ${m} ${y}`;
    } catch {
      return String(value);
    }
  }
}
