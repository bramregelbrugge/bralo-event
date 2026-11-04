import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { environment } from '../../environments/environment';

export const firebaseApp = initializeApp(environment.firebase);
export const auth = getAuth(firebaseApp);

// Lokale (IndexedDB) cache: een paginarefresh leest eerst uit de cache en
// haalt daarna enkel de wijzigingen sinds de laatste sync op, in plaats van
// alle documenten opnieuw — belangrijk omdat elke listener-herstart anders
// de volledige ticketlijst als nieuwe reads telt.
export const firestore = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
