import { Injectable } from '@angular/core';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Observable, map, shareReplay, switchMap, of } from 'rxjs';
import { auth, firestore } from './firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user$: Observable<User | null> = new Observable<User | null>((subscriber) => {
    return onAuthStateChanged(auth, (user) => subscriber.next(user));
  }).pipe(shareReplay({ bufferSize: 1, refCount: false }));

  readonly isAdmin$: Observable<boolean> = this.user$.pipe(
    switchMap((user) => {
      if (!user) {
        return of(false);
      }
      return new Observable<boolean>((subscriber) => {
        getDoc(doc(firestore, 'admins', user.uid))
          .then((snap) => {
            subscriber.next(snap.exists());
            subscriber.complete();
          })
          .catch((err) => subscriber.error(err));
      });
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  login(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(auth, email, password).then(() => undefined);
  }

  logout(): Promise<void> {
    return signOut(auth);
  }

  get currentUser(): User | null {
    return auth.currentUser;
  }
}
