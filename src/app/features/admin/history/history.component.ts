import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, DatePipe } from '@angular/common';
import { AuthService } from '../../../core/auth.service';
import { EventService } from '../../../services/event.service';
import { TicketService } from '../../../services/ticket.service';
import { TicketDoc, TicketHistoryEntry, TicketStatus } from '../../../models/ticket.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [FormsModule, AsyncPipe, DatePipe],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent {
  private readonly eventService = inject(EventService);
  private readonly ticketService = inject(TicketService);
  private readonly auth = inject(AuthService);

  readonly events$ = this.eventService.events$;

  readonly selectedEventId = signal<string | null>(null);
  readonly tickets = signal<TicketDoc[]>([]);
  readonly expandedTicketId = signal<string | null>(null);
  readonly expandedHistory = signal<TicketHistoryEntry[]>([]);
  readonly correctionNote = signal('');
  readonly correctionBusy = signal(false);

  onSelectEvent(eventId: string): void {
    this.selectedEventId.set(eventId || null);
    this.expandedTicketId.set(null);
    this.expandedHistory.set([]);
    if (!eventId) {
      this.tickets.set([]);
      return;
    }
    this.ticketService.listTickets$(eventId).subscribe((tickets) => this.tickets.set(tickets));
  }

  toggleTicket(ticket: TicketDoc): void {
    const eventId = this.selectedEventId();
    if (!eventId) {
      return;
    }
    if (this.expandedTicketId() === ticket.id) {
      this.expandedTicketId.set(null);
      this.expandedHistory.set([]);
      return;
    }
    this.expandedTicketId.set(ticket.id);
    this.correctionNote.set('');
    this.ticketService
      .listHistory$(eventId, ticket.id)
      .subscribe((entries) => this.expandedHistory.set(entries));
  }

  async correct(ticket: TicketDoc, toStatus: TicketStatus): Promise<void> {
    const eventId = this.selectedEventId();
    const uid = this.auth.currentUser?.uid;
    if (!eventId || !uid) {
      return;
    }
    const note = this.correctionNote().trim() || `Handmatige correctie naar '${toStatus}'`;
    this.correctionBusy.set(true);
    try {
      await this.ticketService.correctTicket(eventId, ticket.id, toStatus, note, uid);
      this.correctionNote.set('');
    } finally {
      this.correctionBusy.set(false);
    }
  }

  statusLabel(status: TicketStatus): string {
    return { valid: 'Geldig', used: 'Binnen', void: 'Geannuleerd' }[status];
  }

  historyTypeLabel(type: TicketHistoryEntry['type']): string {
    return { created: 'Aangemaakt', scanned: 'Gescand', correction: 'Correctie' }[type];
  }
}
