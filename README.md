# TattooTime – Tattoo Termin App

**TattooTime** ist eine moderne Webanwendung zur Verwaltung von Tattoo-Terminen. Sie bietet eine intuitive Oberfläche für Kunden und einen leistungsstarken Admin-Bereich für Studio-Betreiber.

---

## Funktionen

- **Benutzerauthentifizierung:** Registrierung, Login und Logout via Firebase Authentication.
- **Dashboard:** Übersicht über eigene Termine, Kalenderansicht.
- **Terminbuchung:** Kunden können freie Slots auswählen und buchen.
- **Admin-Bereich:** Verwaltung aller Termine, Slots anlegen, bearbeiten, löschen, Terminarten (Tattoo, Jugendhilfe, Arzt, Privat, Blockiert).
- **E-Mail-Benachrichtigung:** Automatische Bestätigungsmails an Kunden und Admins.
- **Rollenverwaltung:** Admin-Rolle über Firestore oder Cloud Function steuerbar.

---

## Technologien

- **Frontend:** React (TypeScript), Material-UI
- **Backend:** Firebase (Authentication, Firestore, Functions, Hosting)
- **Weitere:** React Router, E-Mail-Versand über Firestore-Trigger

---

## Installation & Entwicklung

1. **Repository klonen**
   ```bash
   git clone https://github.com/tibo47-161/tattootimeV2.git
   cd tattootimeV2
   ```

2. **Abhängigkeiten installieren**
   ```bash
   cd tattootime
   npm install
   ```

3. **Firebase-Konfiguration**
   - Trage deine Firebase-Projekt-Daten in `tattootime/src/services/firebase.ts` ein.

4. **Lokalen Server starten**
   ```bash
   npm start
   ```
   Die App läuft unter [http://localhost:3000](http://localhost:3000).

---

## Deployment (Firebase Hosting)

1. **Firebase CLI installieren**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login & Initialisierung**
   ```bash
   firebase login
   firebase init
   ```
   Wähle „Hosting“ und verbinde das Projekt. Das `public`-Verzeichnis muss auf `tattootime/build` zeigen.

3. **Build & Deploy**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## Admin-Rolle vergeben

- In der Firebase Console unter „Authentication“ den User suchen.
- In Firestore (Collection `users`) das Feld `role` auf `admin` setzen.
- Alternativ: Cloud Function `addAdminRole` nutzen.

---

## API-Dokumentation (Kurzfassung)

### Cloud Functions

- **addAdminRole**
  - Typ: Callable Function
  - Input: `{ email: string }`
  - Nur für Admins! Setzt für einen User die Admin-Rolle.

- **bookSlot**
  - Typ: Callable Function
  - Input: `{ slotId, serviceType, clientName, clientEmail }`
  - Bucht einen Slot, erstellt einen Termin, versendet Bestätigungsmails.

### Firestore Collections

- **users:** User-Daten inkl. Rolle
- **slots:** Termin-Slots (Datum, Zeit, Service, isBooked, …)
- **appointments:** Gebuchte Termine
- **mail:** E-Mail-Queue für Bestätigungen 