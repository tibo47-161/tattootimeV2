# TattooTime – Dokumentation

## 1. Installationsanleitung

### Voraussetzungen
- Node.js & npm installiert
- Firebase-Projekt angelegt

### Projekt klonen & installieren
```bash
git clone https://github.com/tibo47-161/tattootimeV2.git
cd tattootimeV2/tattootime
npm install
```

### Firebase einrichten
- Projekt in der Firebase Console anlegen
- Web-App registrieren, Konfiguration in `src/services/firebase.ts` eintragen
- Firestore, Authentication und ggf. Functions aktivieren

### Lokale Entwicklung
```bash
npm start
```
Die App läuft unter [http://localhost:3000](http://localhost:3000).

### Deployment
Siehe README oder führe aus:
```bash
npm run build
firebase deploy --only hosting
```

---

## 2. Bedienanleitung

### Für Kunden
- Registrierung und Login
- Im Dashboard freie Termine im Kalender auswählen
- Name und E-Mail eingeben, Termin buchen
- Bestätigung per E-Mail erhalten

### Für Admins
- Login mit Admin-Account
- Im Dashboard: Kalenderansicht aller Termine
- Termine anlegen, bearbeiten, löschen
- Terminarten und Farben verwalten
- E-Mail-Benachrichtigungen werden automatisch versendet

---

## 3. API-Dokumentation

### Cloud Functions

#### addAdminRole
- **Pfad:** Callable Function (`addAdminRole`)
- **Methode:** POST (über Firebase Functions)
- **Body:** `{ email: string }`
- **Antwort:** `{ message: string }`
- **Berechtigung:** Nur Admins

#### bookSlot
- **Pfad:** Callable Function (`bookSlot`)
- **Methode:** POST (über Firebase Functions)
- **Body:**
  ```json
  {
    "slotId": "string",
    "serviceType": "string",
    "clientName": "string",
    "clientEmail": "string"
  }
  ```
- **Antwort:** `{ success: true, message: "Termin erfolgreich gebucht!" }`
- **Berechtigung:** Authentifizierte User

### Firestore Collections

- **users:**
  Felder: `id`, `email`, `role`, `name`, …

- **slots:**
  Felder: `id`, `date`, `startTime`, `endTime`, `isBooked`, `serviceType`, …

- **appointments:**
  Felder: `id`, `date`, `time`, `clientName`, `service`, `userId`, `serviceType`, `clientEmail`, …

---

**Hinweis:** Für eine vollständige API-Doku mit Beispielen und Fehlercodes kann ich gerne noch detaillierter werden. Einfach melden! 