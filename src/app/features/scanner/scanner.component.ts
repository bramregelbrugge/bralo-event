import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Html5Qrcode } from 'html5-qrcode';
import { AuthService } from '../../core/auth.service';
import { TicketService } from '../../services/ticket.service';
import { ScanResult } from '../../models/scan-result.model';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './scanner.component.html',
  styleUrl: './scanner.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ScannerComponent implements OnDestroy {
  @ViewChild('readerEl') readerEl!: ElementRef<HTMLDivElement>;

  private readonly ticketService = inject(TicketService);
  private readonly auth = inject(AuthService);

  private scanner: Html5Qrcode | null = null;
  private busy = false;
  private cameraStarted = false;

  readonly result = signal<ScanResult | null>(null);
  readonly cameraError = signal<string | null>(null);
  readonly scanCount = signal(0);

  async ngAfterViewInit(): Promise<void> {
    this.scanner = new Html5Qrcode(this.readerEl.nativeElement.id);
    try {
      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => this.onDecoded(decodedText),
        () => {
          /* ignore per-frame decode errors */
        },
      );
      this.cameraStarted = true;
    } catch {
      this.cameraError.set('Kan camera niet starten. Geef toegang tot de camera en herlaad de pagina.');
    }
  }

  async ngOnDestroy(): Promise<void> {
    if (this.scanner && this.cameraStarted) {
      try {
        await this.scanner.stop();
      } catch {
        /* already stopped */
      }
    }
  }

  private async onDecoded(payload: string): Promise<void> {
    if (this.busy) {
      return;
    }
    this.busy = true;
    const scannedBy = this.auth.currentUser?.uid ?? 'unknown';
    try {
      const result = await this.ticketService.scanByPayload(payload, scannedBy);
      this.result.set(result);
      this.scanCount.set(this.scanCount() + 1);
    } finally {
      setTimeout(() => {
        this.busy = false;
      }, 1500);
    }
  }

  dismissResult(): void {
    this.result.set(null);
  }
}
