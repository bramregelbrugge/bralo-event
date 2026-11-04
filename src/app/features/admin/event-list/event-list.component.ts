import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../../core/auth.service';
import { EventService } from '../../../services/event.service';
import { NewEvent } from '../../../models/event.model';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [FormsModule, RouterLink, AsyncPipe],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss',
})
export class EventListComponent {
  private readonly eventService = inject(EventService);
  private readonly auth = inject(AuthService);

  readonly events$ = this.eventService.events$;
  readonly showForm = signal(false);
  readonly saving = signal(false);

  draft: NewEvent = { name: '', date: '', location: '' };

  toggleForm(): void {
    this.showForm.set(!this.showForm());
  }

  async createEvent(): Promise<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid || !this.draft.name || !this.draft.date) {
      return;
    }
    this.saving.set(true);
    try {
      await this.eventService.createEvent(this.draft, uid);
      this.draft = { name: '', date: '', location: '' };
      this.showForm.set(false);
    } finally {
      this.saving.set(false);
    }
  }
}
