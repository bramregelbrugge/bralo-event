export type TicketStatus = 'valid' | 'used' | 'void';

export interface TicketDoc {
  id: string;
  eventId: string;
  orderId: string;
  holderName: string;
  holderEmail: string;
  seatIndex: number;
  seatTotal: number;
  code: string;
  status: TicketStatus;
  createdAt: number;
  createdBy: string;
  scannedAt: number | null;
  scannedBy: string | null;
}

export interface NewTicketOrder {
  holderName: string;
  holderEmail: string;
  quantity: number;
}

export type TicketHistoryType = 'created' | 'scanned' | 'correction';

export interface TicketHistoryEntry {
  id: string;
  type: TicketHistoryType;
  at: number;
  by: string;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus | null;
  note: string;
}
