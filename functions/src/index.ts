/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

export const addAdminRole = onRequest(async (request, response) => {
  const email = request.query.email as string;

  if (!email) {
    response.status(400).send("Email parameter is required.");
    return;
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, {admin: true});

    logger.info(`Admin role assigned to ${email}`);
    response.status(200).send(`Success! ${email} has been made an admin.`);
    return;
  } catch (error) {
    logger.error("Error adding admin role:", error);
    response.status(500).send("Failed to add admin role.");
    return;
  }
});
