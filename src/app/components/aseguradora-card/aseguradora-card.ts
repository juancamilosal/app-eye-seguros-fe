import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-aseguradora-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aseguradora-card.html'
})
export class AseguradoraCard implements OnChanges {
  @Input() aseguradora: any = {};

  displayedEntries: Array<{ key: string; value: any }> = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aseguradora']) {
      const obj = this.aseguradora ?? {};
      const keys = Object.keys(obj);
      this.displayedEntries = keys
        .filter((k) => k !== 'id' && obj[k] !== null && obj[k] !== undefined && obj[k] !== '')
        .map((k) => ({ key: k, value: obj[k] }));
    }
  }

  toValue(val: any): string {
    if (Array.isArray(val)) {
      return val.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
    }
    if (val && typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val ?? '');
  }
}