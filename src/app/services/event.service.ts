import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { Observable, map } from 'rxjs';
import { firestore } from '../core/firebase';
import { collectionChanges } from '../core/firestore-observable';
import { EventDoc, NewEvent } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly eventsCol = collection(firestore, 'events');

  readonly events$: Observable<EventDoc[]> = collectionChanges(
    query(this.eventsCol, orderBy('date', 'desc')),
  ).pipe(
    map((snapshot) =>
      snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EventDoc, 'id'>) })),
    ),
  );

  async getEvent(eventId: string): Promise<EventDoc | null> {
    const snap = await getDoc(doc(this.eventsCol, eventId));
    if (!snap.exists()) {
      return null;
    }
    return { id: snap.id, ...(snap.data() as Omit<EventDoc, 'id'>) };
  }

  async createEvent(data: NewEvent, createdBy: string): Promise<string> {
    const ref = await addDoc(this.eventsCol, {
      ...data,
      createdAt: Date.now(),
      createdBy,
    });
    return ref.id;
  }

  updateEvent(eventId: string, data: Partial<NewEvent>): Promise<void> {
    return updateDoc(doc(this.eventsCol, eventId), { ...data });
  }

  deleteEvent(eventId: string): Promise<void> {
    return deleteDoc(doc(this.eventsCol, eventId));
  }
}
