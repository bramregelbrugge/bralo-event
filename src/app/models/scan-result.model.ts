import { TicketDoc } from './ticket.model';

export type ScanOutcome = 'admitted' | 'already_used' | 'void' | 'invalid' | 'not_found';

export interface ScanResult {
  outcome: ScanOutcome;
  ticket: TicketDoc | null;
  message: string;
}
