import { Observable } from 'rxjs';
import {
  DocumentReference,
  DocumentSnapshot,
  Query,
  QuerySnapshot,
  onSnapshot,
} from 'firebase/firestore';

export function collectionChanges<T>(query: Query): Observable<QuerySnapshot<T>> {
  return new Observable((subscriber) => {
    const unsubscribe = onSnapshot(
      query as Query<T>,
      (snapshot) => subscriber.next(snapshot),
      (error) => subscriber.error(error),
    );
    return unsubscribe;
  });
}

export function docChanges<T>(ref: DocumentReference): Observable<DocumentSnapshot<T>> {
  return new Observable((subscriber) => {
    const unsubscribe = onSnapshot(
      ref as DocumentReference<T>,
      (snapshot) => subscriber.next(snapshot),
      (error) => subscriber.error(error),
    );
    return unsubscribe;
  });
}
