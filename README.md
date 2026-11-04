# Bralo Event

Angular + Firebase app om event tickets aan te maken, te beheren en op de dag van het
event te scannen via een QR-code (PWA).

## Functionaliteit

- **Events beheren** — events aanmaken met naam, datum en locatie.
- **Tickets aanmaken** — per event tickets aanmaken met naam, e-mail en aantal
  (aantal = aantal personen; elke persoon krijgt een eigen scanbare QR-code).
- **Scanner (PWA)** — `/scan` opent de camera en scant QR-codes. Een ticket kan maar
  **één keer** ingescand worden (1 scan per persoon); een tweede scan toont duidelijk
  dat het ticket al gebruikt is, inclusief tijdstip.
- **Geschiedenis & correcties** — `/admin/history` toont per event alle tickets met hun
  status en logboek (aangemaakt / gescand / correctie), en laat toe een ticket handmatig
  te corrigeren (terugzetten naar geldig, markeren als binnen, of annuleren) met reden.
- **Login** — enkel vooraf toegevoegde admins (via de `admins` collectie in Firestore)
  kunnen inloggen en de app gebruiken.

## Projectstructuur

```
src/app/
  core/               Firebase-init, AuthService, auth guard
  models/             TypeScript modellen (Event, Ticket, ScanResult, History)
  services/           EventService, TicketService (incl. scan-transactie)
  features/
    login/            Inlogpagina
    admin/             Admin-shell + events, tickets, geschiedenis/correcties
    scanner/           QR-scanner PWA-pagina (/scan)
```

## Firebase project opzetten (eenmalig)

1. Ga naar https://console.firebase.google.com en maak een nieuw project aan
   (bv. `bralo-event`).
2. Activeer in de console:
   - **Authentication** → Sign-in method → **E-mail/wachtwoord** inschakelen.
   - **Firestore Database** → maak een database aan (productiemodus, dichtstbijzijnde regio).
3. Voeg een **Web app** toe aan het project (Project settings → Add app → Web) en kopieer
   de `firebaseConfig` waarden naar `src/environments/environment.ts` en
   `environment.prod.ts`. Dit is publieke client-config, geen geheime sleutel — de
   echte beveiliging gebeurt via Firestore security rules (`firestore.rules`).
4. Maak jezelf admin:
   - Maak in **Authentication** een gebruiker aan (jouw e-mail + wachtwoord).
   - Maak in **Firestore** handmatig een document aan in een collectie `admins` met als
     document-ID de **UID** van die gebruiker (te vinden bij Authentication → Users).
     Inhoud van het document mag leeg zijn of bv. `{ "email": "jij@example.com" }`.
5. Installeer de Firebase CLI en koppel het project lokaal:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   ```
   Kies je project; dit maakt een lokale `.firebaserc` aan (niet gecommit, zie
   `.firebaserc.example`).
6. Deploy de Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Lokaal draaien

```bash
npm install
npm start
```

De app draait dan op `http://localhost:4200`. Log in met het admin-account dat je
hierboven hebt aangemaakt.

> De QR-scanner (`/scan`) vraagt camera-toegang. Dat werkt het makkelijkst via `https`
> of op `localhost`.

## Deployen naar Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

## Ontwikkelworkflow

- `master` is beschermd: er kan **niet** rechtstreeks naar gepusht worden.
- Alle wijzigingen gaan via een feature branch + pull request naar `master`.
