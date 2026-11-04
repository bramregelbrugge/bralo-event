import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { Observable, map } from 'rxjs';
import { firestore } from '../core/firebase';
import { collectionChanges } from '../core/firestore-observable';
import { ScanResult } from '../models/scan-result.model';
import { NewTicketOrder, TicketDoc, TicketHistoryEntry, TicketStatus } from '../models/ticket.model';

function ticketsCol(eventId: string) {
  return collection(firestore, 'events', eventId, 'tickets');
}

function historyCol(eventId: string, ticketId: string) {
  return collection(firestore, 'events', eventId, 'tickets', ticketId, 'history');
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  listTickets$(eventId: string): Observable<TicketDoc[]> {
    return collectionChanges(query(ticketsCol(eventId), orderBy('createdAt', 'desc'))).pipe(
      map((snapshot) =>
        snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TicketDoc, 'id'>) })),
      ),
    );
  }

  listHistory$(eventId: string, ticketId: string): Observable<TicketHistoryEntry[]> {
    return collectionChanges(query(historyCol(eventId, ticketId), orderBy('at', 'desc'))).pipe(
      map((snapshot) =>
        snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TicketHistoryEntry, 'id'>) })),
      ),
    );
  }

  async getTicket(eventId: string, ticketId: string): Promise<TicketDoc | null> {
    const snap = await getDoc(doc(ticketsCol(eventId), ticketId));
    if (!snap.exists()) {
      return null;
    }
    return { id: snap.id, ...(snap.data() as Omit<TicketDoc, 'id'>) };
  }

  async createOrder(eventId: string, order: NewTicketOrder, createdBy: string): Promise<void> {
    const batch = writeBatch(firestore);
    const now = Date.now();
    const orderId = crypto.randomUUID();

    for (let seatIndex = 1; seatIndex <= order.quantity; seatIndex++) {
      const ticketRef = doc(ticketsCol(eventId));
      const ticket: Omit<TicketDoc, 'id'> = {
        eventId,
        orderId,
        holderName: order.holderName,
        holderEmail: order.holderEmail,
        seatIndex,
        seatTotal: order.quantity,
        code: crypto.randomUUID(),
        status: 'valid',
        createdAt: now,
        createdBy,
        scannedAt: null,
        scannedBy: null,
      };
      batch.set(ticketRef, ticket);

      const historyRef = doc(historyCol(eventId, ticketRef.id));
      const entry: Omit<TicketHistoryEntry, 'id'> = {
        type: 'created',
        at: now,
        by: createdBy,
        fromStatus: null,
        toStatus: 'valid',
        note: `Ticket aangemaakt (${seatIndex}/${order.quantity})`,
      };
      batch.set(historyRef, entry);
    }

    await batch.commit();
  }

  encodeQrPayload(ticket: Pick<TicketDoc, 'eventId' | 'id' | 'code'>): string {
    return JSON.stringify({ e: ticket.eventId, t: ticket.id, c: ticket.code });
  }

  parsePayload(payload: string): { eventId: string; ticketId: string; code: string } | null {
    try {
      const parsed = JSON.parse(payload);
      if (
        typeof parsed?.e === 'string' &&
        typeof parsed?.t === 'string' &&
        typeof parsed?.c === 'string'
      ) {
        return { eventId: parsed.e, ticketId: parsed.t, code: parsed.c };
      }
      return null;
    } catch {
      return null;
    }
  }

  async scanByPayload(payload: string, scannedBy: string): Promise<ScanResult> {
    const parsed = this.parsePayload(payload);
    if (!parsed) {
      return { outcome: 'invalid', ticket: null, message: 'Onherkenbare QR-code.' };
    }
    return this.scanTicket(parsed.eventId, parsed.ticketId, parsed.code, scannedBy);
  }

  async scanTicket(
    eventId: string,
    ticketId: string,
    code: string,
    scannedBy: string,
  ): Promise<ScanResult> {
    const ticketRef = doc(ticketsCol(eventId), ticketId);
    const historyRef = doc(historyCol(eventId, ticketId));
    const now = Date.now();

    return runTransaction(firestore, async (tx) => {
      const snap = await tx.get(ticketRef);
      if (!snap.exists()) {
        return { outcome: 'not_found', ticket: null, message: 'Ticket niet gevonden.' } as ScanResult;
      }
      const ticket: TicketDoc = { id: snap.id, ...(snap.data() as Omit<TicketDoc, 'id'>) };

      if (ticket.code !== code) {
        return { outcome: 'invalid', ticket, message: 'Ongeldige ticketcode.' } as ScanResult;
      }
      if (ticket.status === 'void') {
        return { outcome: 'void', ticket, message: 'Dit ticket is geannuleerd.' } as ScanResult;
      }
      if (ticket.status === 'used') {
        return {
          outcome: 'already_used',
          ticket,
          message: `Al gescand op ${new Date(ticket.scannedAt ?? 0).toLocaleString('nl-BE')}.`,
        } as ScanResult;
      }

      tx.update(ticketRef, { status: 'used', scannedAt: now, scannedBy });
      tx.set(historyRef, {
        type: 'scanned',
        at: now,
        by: scannedBy,
        fromStatus: 'valid',
        toStatus: 'used',
        note: 'Ingescand aan de ingang',
      } satisfies Omit<TicketHistoryEntry, 'id'>);

      return {
        outcome: 'admitted',
        ticket: { ...ticket, status: 'used', scannedAt: now, scannedBy },
        message: 'Toegang verleend.',
      } as ScanResult;
    });
  }

  async correctTicket(
    eventId: string,
    ticketId: string,
    toStatus: TicketStatus,
    note: string,
    correctedBy: string,
  ): Promise<void> {
    const ticketRef = doc(ticketsCol(eventId), ticketId);
    const historyRef = doc(historyCol(eventId, ticketId));
    const now = Date.now();

    await runTransaction(firestore, async (tx) => {
      const snap = await tx.get(ticketRef);
      if (!snap.exists()) {
        throw new Error('Ticket niet gevonden.');
      }
      const ticket = snap.data() as Omit<TicketDoc, 'id'>;

      tx.update(ticketRef, {
        status: toStatus,
        ...(toStatus === 'valid' ? { scannedAt: null, scannedBy: null } : {}),
      });
      tx.set(historyRef, {
        type: 'correction',
        at: now,
        by: correctedBy,
        fromStatus: ticket.status,
        toStatus,
        note,
      } satisfies Omit<TicketHistoryEntry, 'id'>);
    });
  }

  async listAllTicketsForEvent(eventId: string): Promise<TicketDoc[]> {
    const snap = await getDocs(query(ticketsCol(eventId), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TicketDoc, 'id'>) }));
  }
}
