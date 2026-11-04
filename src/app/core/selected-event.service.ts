import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'bralo-event:selectedEventId';

@Injectable({ providedIn: 'root' })
export class SelectedEventService {
  readonly selectedEventId = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null,
  );

  select(eventId: string | null): void {
    this.selectedEventId.set(eventId);
    if (typeof localStorage === 'undefined') {
      return;
    }
    if (eventId) {
      localStorage.setItem(STORAGE_KEY, eventId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
