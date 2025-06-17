/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

export const addAdminRole = functions.https.onCall(
  async (data: { email?: string }, context: functions.https.CallableContext) => {
    if (!context.auth || !context.auth.token || !context.auth.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Nur Admins dürfen Adminrechte vergeben."
      );
    }

    const email = data.email;

    if (!email) {
      throw new functions.https.HttpsError("invalid-argument", "Email is required.");
    }

    try {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(user.uid, { admin: true });
      functions.logger.info(`Adminrechte gesetzt für ${email}`);
      return { message: `Adminrechte gesetzt für ${email}` };
    } catch (error: any) {
      functions.logger.error("Fehler beim Setzen der Adminrechte:", error);
      throw new functions.https.HttpsError("internal", error.message, error);
    }
  }
);

export const bookSlot = functions.https.onCall(
  async (
    data: {
      slotId: string;
      serviceType: string;
      clientName: string;
      clientEmail: string;
    },
    context: functions.https.CallableContext
  ) => {
    // 1. Authentifizierung prüfen
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Sie müssen angemeldet sein, um einen Termin zu buchen."
      );
    }

    const {slotId, serviceType, clientName, clientEmail} = data;
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email || clientEmail;

    if (!slotId || !serviceType || !clientName) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Erforderliche Daten fehlen: slotId, serviceType, clientName."
      );
    }

    const db = admin.firestore();
    const slotRef = db.collection("slots").doc(slotId);
    const appointmentsRef = db.collection("appointments");

    try {
      await db.runTransaction(async (transaction) => {
        const slotDoc = await transaction.get(slotRef);

        // 2. Slot-Verfügbarkeit prüfen
        if (!slotDoc.exists) {
          throw new functions.https.HttpsError(
            "not-found",
            "Der angegebene Terminslot existiert nicht."
          );
        }

        const slotData = slotDoc.data() as {
          isBooked: boolean;
          date: string;
          startTime: string;
          endTime: string;
        };

        if (slotData.isBooked) {
          throw new functions.https.HttpsError(
            "already-exists",
            "Dieser Terminslot ist bereits gebucht."
          );
        }

        // 3. Slot als gebucht markieren
        transaction.update(slotRef, {
          isBooked: true,
          bookedByUserId: userId,
          bookedByUserName: clientName,
          bookedByEmail: userEmail,
        });

        // 4. Termin in der appointments-Sammlung erstellen
        const newAppointment = {
          date: slotData.date,
          time: slotData.startTime,
          clientName: clientName,
          service: serviceType,
          userId: userId,
          clientEmail: userEmail,
          serviceType: serviceType,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        transaction.set(appointmentsRef.doc(), newAppointment);

        // E-Mail an den Kunden senden
        await db.collection("mail").add({
          to: userEmail,
          message: {
            subject: "Ihre Terminbestätigung - TattooTime App",
            html: `
              <p>Hallo ${clientName},</p>
              <p>Vielen Dank für Ihre Buchung bei TattooTime!</p>
              <p>Ihr Termin für <strong>${slotData.date}</strong> um
              <strong>${slotData.startTime} - ${slotData.endTime}</strong>.</p>
              <p>Wir freuen uns auf Sie!</p>
              <p>Mit freundlichen Grüßen,</p>
              <p>Ihr TattooTime Team</p>
            `,
          },
        });

        // E-Mail an den Admin senden
        await db.collection("mail").add({
          to: "tobi196183@gmail.com",
          message: {
            subject: "Neue Terminbuchung bei TattooTime",
            html: `
              <p>Hallo Admin,</p>
              <p>Es wurde ein neuer Termin gebucht:</p>
              <ul>
                <li><strong>Kunde:</strong> ${clientName}</li>
                <li><strong>E-Mail:</strong> ${userEmail}</li>
                <li><strong>Dienstleistung:</strong> ${serviceType}</li>
                <li><strong>Datum:</strong> ${slotData.date}</li>
                <li><strong>Uhrzeit:</strong> ${slotData.startTime} -
                ${slotData.endTime}</li>
              </ul>
            `,
          },
        });
      });

      functions.logger.info(`Slot ${slotId} erfolgreich für Benutzer ${userId} gebucht.`);
      return {success: true, message: "Termin erfolgreich gebucht!"};
    } catch (error: any) {
      functions.logger.error("Fehler beim Buchen des Slots:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Ein unerwarteter Fehler ist aufgetreten.",
        error
      );
    }
  }
);
