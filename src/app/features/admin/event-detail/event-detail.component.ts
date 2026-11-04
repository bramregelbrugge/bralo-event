import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, of } from 'rxjs';
import { AuthService } from '../../../core/auth.service';
import { SelectedEventService } from '../../../core/selected-event.service';
import { EventService } from '../../../services/event.service';
import { TicketService } from '../../../services/ticket.service';
import { NewTicketOrder, TicketDoc } from '../../../models/ticket.model';
import { TicketQrComponent } from '../ticket-qr/ticket-qr.component';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, TicketQrComponent],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss',
})
export class EventDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);
  private readonly ticketService = inject(TicketService);
  private readonly auth = inject(AuthService);
  private readonly selectedEvent = inject(SelectedEventService);

  readonly eventId = this.route.snapshot.paramMap.get('id')!;

  readonly event = toSignal(
    of(this.eventId).pipe(switchMap((id) => this.eventService.getEvent(id))),
  );
  readonly tickets = toSignal(this.ticketService.listTickets$(this.eventId), {
    initialValue: [] as TicketDoc[],
  });

  readonly showForm = signal(false);
  readonly saving = signal(false);

  readonly editingTicketId = signal<string | null>(null);
  readonly editSaving = signal(false);
  editDraft = { holderName: '', holderEmail: '' };

  draft: NewTicketOrder = { holderName: '', holderEmail: '', quantity: 1 };

  constructor() {
    this.selectedEvent.select(this.eventId);
  }

  toggleForm(): void {
    this.showForm.set(!this.showForm());
  }

  async createOrder(): Promise<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid || !this.draft.holderName || this.draft.quantity < 1) {
      return;
    }
    this.saving.set(true);
    try {
      await this.ticketService.createOrder(this.eventId, this.draft, uid);
      this.draft = { holderName: '', holderEmail: '', quantity: 1 };
      this.showForm.set(false);
    } finally {
      this.saving.set(false);
    }
  }

  startEdit(ticket: TicketDoc): void {
    this.editingTicketId.set(ticket.id);
    this.editDraft = { holderName: ticket.holderName, holderEmail: ticket.holderEmail };
  }

  cancelEdit(): void {
    this.editingTicketId.set(null);
  }

  async saveEdit(ticket: TicketDoc): Promise<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid || !this.editDraft.holderName) {
      return;
    }
    this.editSaving.set(true);
    try {
      await this.ticketService.updateTicketDetails(this.eventId, ticket.id, this.editDraft, uid);
      this.editingTicketId.set(null);
    } finally {
      this.editSaving.set(false);
    }
  }

  qrPayload(ticket: TicketDoc): string {
    return this.ticketService.encodeQrPayload(ticket);
  }

  statusLabel(status: TicketDoc['status']): string {
    return { valid: 'Geldig', used: 'Binnen', void: 'Geannuleerd' }[status];
  }
}
