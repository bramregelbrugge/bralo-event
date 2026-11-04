import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { SelectedEventService } from '../../core/selected-event.service';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, AsyncPipe, FormsModule],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  readonly selectedEvent = inject(SelectedEventService);

  readonly events$ = this.eventService.events$;

  onPickEvent(eventId: string): void {
    if (!eventId) {
      return;
    }
    this.selectedEvent.select(eventId);
    this.router.navigate(['/admin/events', eventId]);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
