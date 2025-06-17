# Tattoo Termin App

Dies ist eine Webanwendung zur Verwaltung von Tattoo-Terminen, entwickelt mit React und Firebase. Die Anwendung bietet einen Benutzer-Login, ein Dashboard und einen Admin-Bereich zur Terminverwaltung.

## Funktionen

*   **Benutzerauthentifizierung:** Anmelden und Abmelden von Benutzern über Firebase Authentication.
*   **Dashboard:** Persönlicher Bereich für angemeldete Benutzer.
*   **Admin-Bereich:** Spezieller Bereich für Administratoren zur Verwaltung aller Termine (Hinzufügen, Bearbeiten, Löschen).

## Technologien

*   **Frontend:** React (mit TypeScript)
*   **Styling:** Material-UI
*   **Backend & Hosting:** Firebase (Authentication, Firestore, Hosting)
*   **Routing:** React Router DOM

## Lokale Entwicklung

Um die Anwendung lokal auszuführen, folgen Sie diesen Schritten:

1.  **Repository klonen:**
    ```bash
    git clone https://github.com/tibo47-161/tattootimeV2.git
    cd tattootimeV2
    ```

2.  **Abhängigkeiten installieren:**
    Wechseln Sie in das `tattootime`-Verzeichnis und installieren Sie die Node.js-Abhängigkeiten:
    ```bash
    cd tattootime
    npm install
    ```

3.  **Firebase-Konfiguration:**
    Stellen Sie sicher, dass Ihre Firebase-Projektkonfiguration in `tattootime/src/services/firebase.ts` korrekt ist.

4.  **Anwendung starten:**
    Im `tattootime`-Verzeichnis:
    ```bash
    npm start
    ```
    Die Anwendung sollte in Ihrem Browser unter [http://localhost:3000](http://localhost:3000) geöffnet werden.

## Deployment auf Firebase Hosting

Die Anwendung ist für das Deployment auf Firebase Hosting konfiguriert.

1.  **Firebase CLI installieren (falls nicht bereits geschehen):**
    ```bash
    npm install -g firebase-tools
    ```

2.  **Anmelden bei Firebase:**
    ```bash
    firebase login
    ```

3.  **Projekt initialisieren (falls nicht bereits geschehen):**
    ```bash
    firebase init
    ```
    Wählen Sie `Hosting` und verbinden Sie es mit Ihrem Firebase-Projekt `tattootimev2`. Stellen Sie sicher, dass das `public` Verzeichnis in `firebase.json` auf `tattootime/build` zeigt.

4.  **Anwendung bauen:**
    Im `tattootime`-Verzeichnis:
    ```bash
    npm run build
    ```

5.  **Anwendung deployen:**
    Im Hauptverzeichnis (`tattootimeV2`):
    ```bash
    firebase deploy --only hosting
    ```
    Ihre Anwendung wird dann unter der Hosting-URL Ihres Firebase-Projekts verfügbar sein (z.B. `https://tattootimev2.web.app`).

## Admin-Bereich Verwaltung

Der Admin-Bereich ist nur für Benutzer mit der Rolle `admin` zugänglich.

Um einen Benutzer zum Administrator zu machen:

1.  Gehen Sie zur [Firebase Console](https://console.firebase.google.com/).
2.  Wählen Sie Ihr Projekt `tattootimev2`.
3.  Navigieren Sie zu `Build` > `Authentication`.
4.  Finden Sie den Benutzer, den Sie zum Admin machen möchten.
5.  Ändern Sie die `role`-Eigenschaft des Benutzers in Firestore (Sammlung `users`) auf `admin`.
    Alternativ können Sie eine Firebase Cloud Function verwenden, um eine benutzerdefinierte Anspruch (Custom Claim) hinzuzufügen, z.B. `admin: true`.

    *Hinweis:* Das Setzen der Rolle direkt in Firestore ist für Entwicklungszwecke in Ordnung, für eine Produktionsumgebung sollten Sie aus Sicherheitsgründen Cloud Functions verwenden, um Admin-Rollen zu verwalten. 