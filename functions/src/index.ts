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
