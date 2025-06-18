/**
 * Import function triggers from their respective submodules:
 *
 * import { onCall } from "firebase-functions/v2/https";
 * import { onDocumentWritten } from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

export const addAdminRole = functions.https.onCall(
  async (
    data: { email?: string },
    context: functions.https.CallableContext
  ): Promise<{ message: string }> => {
    if (
      !context.auth ||
      !context.auth.token ||
      !context.auth.token.admin
    ) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Nur Admins dürfen Adminrechte vergeben."
      );
    }

    const email = data.email;

    if (!email) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Email is required."
      );
    }

    try {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(user.uid, {admin: true});
      functions.logger.info(`Adminrechte gesetzt für ${email}`);
      return {message: `Adminrechte gesetzt für ${email}`};
    } catch (error: unknown) {
      functions.logger.error("Fehler beim Setzen der Adminrechte:", error);
      throw new functions.https.HttpsError(
        "internal",
        error instanceof Error ? error.message : "Unbekannter Fehler",
        error
      );
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
      bodyPart?: string;
      tattooStyle?: string;
      size?: { width: number; height: number };
      complexity?: "simple" | "medium" | "complex" | "very_complex";
      estimatedDuration?: number;
      colors?: string[];
      notes?: string;
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

    const {
      slotId,
      serviceType,
      clientName,
      clientEmail,
      bodyPart,
      tattooStyle,
      size,
      complexity,
      estimatedDuration,
      colors,
      notes,
    } = data;
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

        // 3. Preisberechnung (falls Tattoo-Service)
        let pricing: Pricing | null = null;
        if (
          serviceType === "Tattoo" &&
          bodyPart &&
          size &&
          tattooStyle &&
          complexity &&
          estimatedDuration
        ) {
          try {
            // Aktive Preisregel abrufen
            const pricingRulesQuery = await db
              .collection("pricing_rules")
              .where("isActive", "==", true)
              .limit(1)
              .get();

            if (!pricingRulesQuery.empty) {
              const rule = pricingRulesQuery.docs[0].data();

              // Preis berechnen
              const bodyPartMultiplier =
                rule.bodyPartMultipliers[bodyPart] || 1.0;
              const area = size.width * size.height;
              let sizeMultiplier = 1.0;
              if (area <= 25) {
                sizeMultiplier = rule.sizeMultipliers["small"] || 0.8;
              } else if (area <= 100) {
                sizeMultiplier = rule.sizeMultipliers["medium"] || 1.0;
              } else if (area <= 400) {
                sizeMultiplier = rule.sizeMultipliers["large"] || 1.3;
              } else {
                sizeMultiplier = rule.sizeMultipliers["extra_large"] || 1.6;
              }

              const styleMultiplier =
                rule.styleMultipliers[tattooStyle] || 1.0;
              const complexityMultiplier =
                rule.complexityMultipliers[complexity] || 1.0;

              const hourlyRate = rule.basePrice;
              const hours = estimatedDuration / 60;
              const basePrice = hourlyRate * hours;
              const totalPrice =
                basePrice *
                bodyPartMultiplier *
                sizeMultiplier *
                styleMultiplier *
                complexityMultiplier;
              const depositAmount =
                totalPrice * (rule.depositPercentage / 100);

              pricing = {
                basePrice: Math.round(basePrice * 100) / 100,
                bodyPartMultiplier,
                sizeMultiplier,
                styleMultiplier,
                complexityMultiplier,
                totalPrice: Math.round(totalPrice * 100) / 100,
                depositAmount: Math.round(depositAmount * 100) / 100,
                depositPaid: false,
              };
            }
          } catch (error) {
            functions.logger.warn("Preisberechnung fehlgeschlagen:", error);
          }
        }

        // 4. Slot als gebucht markieren
        transaction.update(slotRef, {
          isBooked: true,
          bookedByUserId: userId,
          bookedByUserName: clientName,
          bookedByEmail: userEmail,
        });

        // 5. Erweiterten Termin erstellen
        const newAppointment: Record<string, unknown> = {
          date: slotData.date,
          time: slotData.startTime,
          clientName: clientName,
          service: serviceType,
          userId: userId,
          clientEmail: userEmail,
          serviceType: serviceType,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Neue Felder hinzufügen
        if (bodyPart) newAppointment.bodyPart = bodyPart;
        if (tattooStyle) newAppointment.tattooStyle = tattooStyle;
        if (notes) newAppointment.notes = notes;
        if (pricing) newAppointment.pricing = pricing;

        if (size && estimatedDuration && complexity) {
          newAppointment.tattooDetails = {
            size,
            estimatedDuration,
            complexity,
            colors: colors || [],
          };
        }

        const appointmentRef = appointmentsRef.doc();
        transaction.set(appointmentRef, newAppointment);

        // 6. Kundenhistorie erstellen
        try {
          await db.collection("customer_history").add({
            userId: userId,
            type: "appointment",
            referenceId: appointmentRef.id,
            description:
              `Termin am ${slotData.date} um ${slotData.startTime} für ${serviceType}`,
            metadata: {
              serviceType,
              bodyPart,
              tattooStyle,
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (error) {
          functions.logger.warn(
            "Kundenhistorie konnte nicht erstellt werden:",
            error,
          );
        }

        // 7. Terminerinnerung planen
        try {
          const reminderDate = new Date(
            `${slotData.date} ${slotData.startTime}`,
          );
          reminderDate.setHours(reminderDate.getHours() - 24); // 24h vorher

          const reminderMessage =
            `Hallo ${clientName}, bitte denken Sie an Ihren Termin am ${slotData.date} um ${slotData.startTime}. ` +
            "Bitte kommen Sie ausgeschlafen und nicht nüchtern.";

          await db.collection("notifications").add({
            userId: userId,
            type: "appointment_reminder",
            title: "Terminerinnerung",
            message: reminderMessage,
            channel: "email",
            status: "pending",
            scheduledFor: reminderDate,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (error) {
          functions.logger.warn(
            "Terminerinnerung konnte nicht erstellt werden:",
            error,
          );
        }

        // 8. Nachsorge-Benachrichtigung planen
        try {
          const aftercareDate = new Date(
            `${slotData.date} ${slotData.startTime}`,
          );
          aftercareDate.setHours(aftercareDate.getHours() + 24); // 24h nachher

          const aftercareMessage =
            `Ihr Tattoo vom ${slotData.date} benötigt jetzt besondere Pflege. ` +
            "Bitte folgen Sie den Nachsorge-Anweisungen für optimale Heilung.";

          await db.collection("notifications").add({
            userId: userId,
            type: "aftercare",
            title: "Nachsorge-Hinweise",
            message: aftercareMessage,
            channel: "email",
            status: "pending",
            scheduledFor: aftercareDate,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (error) {
          functions.logger.warn(
            "Nachsorge-Benachrichtigung konnte nicht erstellt werden:",
            error,
          );
        }

        // 9. E-Mail an den Kunden senden (erweitert)
        const emailHtml = `
          <p>Hallo ${clientName},</p>
          <p>Vielen Dank für Ihre Buchung bei TattooTime!</p>
          <p>Ihr Termin für <strong>${slotData.date}</strong> um
          <strong>${slotData.startTime} - ${slotData.endTime}</strong>.</p>
          ${pricing ? `
          <h3>Preisübersicht:</h3>
          <ul>
            <li><strong>Gesamtpreis:</strong> ${pricing.totalPrice}€</li>
            <li><strong>Anzahlung:</strong> ${pricing.depositAmount}€</li>
            <li><strong>Restbetrag:</strong> ${
  pricing.totalPrice - pricing.depositAmount
}€</li>
          </ul>
          <p>Bitte zahlen Sie die Anzahlung zur Sicherung Ihres Termins.</p>
          ` : ""}
          ${notes ? `<p><strong>Notizen:</strong> ${notes}</p>` : ""}
          <p>Wir freuen uns auf Sie!</p>
          <p>Mit freundlichen Grüßen,</p>
          <p>Ihr TattooTime Team</p>
        `;

        await db.collection("mail").add({
          to: userEmail,
          message: {
            subject: "Ihre Terminbestätigung - TattooTime App",
            html: emailHtml,
          },
        });

        // 10. E-Mail an den Admin senden (erweitert)
        const adminEmailHtml = `
          <p>Hallo Admin,</p>
          <p>Es wurde ein neuer Termin gebucht:</p>
          <ul>
            <li><strong>Kunde:</strong> ${clientName}</li>
            <li><strong>E-Mail:</strong> ${userEmail}</li>
            <li><strong>Dienstleistung:</strong> ${serviceType}</li>
            <li><strong>Datum:</strong> ${slotData.date}</li>
            <li><strong>Uhrzeit:</strong> ${slotData.startTime} - ${slotData.endTime}</li>
            ${bodyPart ? `<li><strong>Körperstelle:</strong> ${bodyPart}</li>` : ""}
            ${tattooStyle ? `<li><strong>Stil:</strong> ${tattooStyle}</li>` : ""}
            ${pricing ? `<li><strong>Preis:</strong> ${pricing.totalPrice}€</li>` : ""}
            ${notes ? `<li><strong>Notizen:</strong> ${notes}</li>` : ""}
          </ul>
        `;

        await db.collection("mail").add({
          to: "tobi196183@gmail.com",
          message: {
            subject: "Neue Terminbuchung bei TattooTime",
            html: adminEmailHtml,
          },
        });
      });

      functions.logger.info(
        `Slot ${slotId} erfolgreich für Benutzer ${userId} gebucht.`,
      );
      return {
        success: true,
        message: "Termin erfolgreich gebucht!",
        appointmentId: slotId,
      };
    } catch (error: unknown) {
      functions.logger.error("Fehler beim Buchen des Slots:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Ein unerwarteter Fehler ist aufgetreten.",
        error,
      );
    }
  }
);

// Neue Cloud Functions für erweiterte Features

// Zahlungsabwicklung
export const processPayment = functions.https.onCall(
  async (
    data: {
      appointmentId: string;
      amount: number;
      paymentMethod: "stripe" | "paypal" | "cash" | "bank_transfer";
      paymentType: "deposit" | "remaining" | "full";
    },
    context: functions.https.CallableContext
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Sie müssen angemeldet sein.",
      );
    }

    const {appointmentId, amount, paymentMethod, paymentType} = data;
    const userId = context.auth.uid;

    if (!appointmentId || !amount || amount <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Ungültige Zahlungsdaten.",
      );
    }

    const db = admin.firestore();

    try {
      // Termin abrufen
      const appointmentDoc = await db
        .collection("appointments")
        .doc(appointmentId)
        .get();

      if (!appointmentDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Termin nicht gefunden.",
        );
      }

      const appointment = appointmentDoc.data();
      if (!appointment) {
        throw new functions.https.HttpsError(
          "not-found",
          "Termindaten nicht verfügbar.",
        );
      }

      // Zahlung verarbeiten (hier würde die Integration mit Stripe/PayPal erfolgen)
      const paymentData = {
        appointmentId,
        userId,
        amount,
        paymentMethod,
        paymentType,
        status: "completed",
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Atomische Transaktion für Zahlung und Termin-Update
      const paymentRef = db.collection("payments").doc();
      await db.runTransaction(async (transaction) => {
        transaction.set(paymentRef, paymentData);

        // Termin-Status aktualisieren
        const updateData: { [key: string]: admin.firestore.FieldValue | boolean | string } = {};
        if (paymentType === "deposit") {
          updateData["pricing.depositPaid"] = true;
          updateData["pricing.depositPaidAt"] =
            admin.firestore.FieldValue.serverTimestamp();
        }
        if (paymentType === "full" || paymentType === "remaining") {
          updateData["payment.status"] = "fully_paid";
          updateData["payment.paidAt"] = admin.firestore.FieldValue.serverTimestamp();
        }

        transaction.update(db.collection("appointments").doc(appointmentId), updateData);

        // Kundenhistorie erstellen
        const historyRef = db.collection("customer_history").doc();
        transaction.set(historyRef, {
          userId,
          type: "payment",
          referenceId: paymentRef.id,
          description: `Zahlung von ${amount}€ (${paymentMethod})`,
          metadata: {
            amount,
            currency: "EUR",
            paymentMethod,
            status: "completed",
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      functions.logger.info(`Zahlung erfolgreich verarbeitet.`);
      return {
        success: true,
        paymentId: paymentRef.id,
        message: "Zahlung erfolgreich verarbeitet!",
      };
    } catch (error: unknown) {
      functions.logger.error("Fehler bei der Zahlungsverarbeitung:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Zahlungsfehler aufgetreten.",
      );
    }
  }
);

// Benachrichtigungen verarbeiten (Scheduled Function)
export const processScheduledNotifications = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async () => {
    const db = admin.firestore();
    const now = new Date();

    try {
      // Fällige Benachrichtigungen abrufen
      const notificationsQuery = await db.collection("notifications")
        .where("status", "==", "pending")
        .where("scheduledFor", "<=", now)
        .limit(50) // Batch-Größe begrenzen
        .get();

      const batch = db.batch();
      let processedCount = 0;

      for (const doc of notificationsQuery.docs) {
        const notification = doc.data();

        try {
          // Benachrichtigung senden (hier würde die echte Integration stehen)
          let sent = false;

          switch (notification.channel) {
          case "email":
            // E-Mail über bestehendes Mail-System
            await db.collection("mail").add({
              to: notification.userId, // Hier sollte die E-Mail-Adresse stehen
              message: {
                subject: notification.title,
                html: notification.message,
              },
            });
            sent = true;
            break;

          case "whatsapp":
            // WhatsApp-Integration (Platzhalter)
            functions.logger.info(
              `WhatsApp-Nachricht an ${notification.userId}: ${notification.message}`,
            );
            sent = true;
            break;

          case "telegram":
            // Telegram-Integration (Platzhalter)
            functions.logger.info(
              `Telegram-Nachricht an ${notification.userId}: ${notification.message}`,
            );
            sent = true;
            break;

          default:
            functions.logger.warn(`Unbekannter Kanal: ${notification.channel}`);
          }

          // Status aktualisieren
          batch.update(doc.ref, {
            status: sent ? "sent" : "failed",
            sentAt: sent ? admin.firestore.FieldValue.serverTimestamp() : null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          processedCount++;
        } catch (error) {
          functions.logger.error(
            `Fehler beim Senden der Benachrichtigung ${doc.id}:`,
            error,
          );
          batch.update(doc.ref, {
            status: "failed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      // Batch ausführen
      if (processedCount > 0) {
        await batch.commit();
        functions.logger.info(`${processedCount} Benachrichtigungen verarbeitet.`);
      }

      return {success: true, processedCount};
    } catch (error) {
      functions.logger.error("Fehler bei der Benachrichtigungsverarbeitung:", error);
      throw error;
    }
  });

// Materialverbrauch erfassen
export const recordMaterialUsage = functions.https.onCall(
  async (
    data: {
      appointmentId: string;
      materials: Array<{
        materialId: string;
        quantityUsed: number;
      }>;
    },
    context: functions.https.CallableContext
  ) => {
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Nur Admins können Materialverbrauch erfassen.",
      );
    }

    const {appointmentId, materials} = data;

    if (!appointmentId || !materials || materials.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Ungültige Materialdaten.",
      );
    }

    const db = admin.firestore();

    try {
      // Termin abrufen
      const appointmentDoc = await db
        .collection("appointments")
        .doc(appointmentId)
        .get();
      if (!appointmentDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Termin nicht gefunden.",
        );
      }

      const appointment = appointmentDoc.data();
      if (!appointment) {
        throw new functions.https.HttpsError(
          "not-found",
          "Termin nicht gefunden.",
        );
      }
      const usageItems = [];
      let totalCost = 0;

      // Materialverbrauch für jedes Material erfassen
      for (const materialUsage of materials) {
        const materialDoc = await db
          .collection("materials")
          .doc(materialUsage.materialId)
          .get();
        if (!materialDoc.exists) {
          throw new functions.https.HttpsError(
            "not-found",
            `Material ${materialUsage.materialId} nicht gefunden.`,
          );
        }

        const material = materialDoc.data();
        if (!material) {
          throw new functions.https.HttpsError(
            "not-found",
            `Material ${materialUsage.materialId} nicht gefunden.`,
          );
        }
        const itemCost = materialUsage.quantityUsed * material.costPerUnit;

        const usageItem = {
          materialId: materialUsage.materialId,
          materialName: material.name,
          quantityUsed: materialUsage.quantityUsed,
          unit: material.unit,
          costPerUnit: material.costPerUnit,
          totalCost: itemCost,
          appointmentId,
          usedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        usageItems.push(usageItem);
        totalCost += itemCost;

        // Lagerstand reduzieren
        await db
          .collection("materials")
          .doc(materialUsage.materialId)
          .update({
            currentStock: admin.firestore.FieldValue.increment(
              -materialUsage.quantityUsed,
            ),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      }

      // Materialverbrauch in appointments aktualisieren
      await db.collection("appointments").doc(appointmentId).update({
        materials: {
          items: usageItems,
          totalCost,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Kundenhistorie erstellen
      await db.collection("customer_history").add({
        userId: appointment.userId,
        type: "material_usage",
        referenceId: appointmentId,
        description: `Materialverbrauch für Termin: ${totalCost.toFixed(2)}€`,
        metadata: {
          totalCost,
          itemCount: materials.length,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(`Materialverbrauch für Termin ${appointmentId} erfasst.`);
      return {
        success: true,
        totalCost,
        message: "Materialverbrauch erfolgreich erfasst!",
      };
    } catch (error: unknown) {
      functions.logger.error("Fehler beim Erfassen des Materialverbrauchs:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Fehler beim Erfassen des Materialverbrauchs."
      );
    }
  }
);

// Bewertung erstellen
export const createReview = functions.https.onCall(
  async (
    data: {
      appointmentId: string;
      rating: number;
      comment?: string;
      isAnonymous: boolean;
    },
    context: functions.https.CallableContext
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Sie müssen angemeldet sein."
      );
    }

    const {appointmentId, rating, comment, isAnonymous} = data;
    const userId = context.auth.uid;

    if (!appointmentId || !rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Ungültige Bewertungsdaten."
      );
    }

    const db = admin.firestore();

    try {
      // Termin abrufen und validieren
      const appointmentDoc = await db
        .collection("appointments")
        .doc(appointmentId)
        .get();
      if (!appointmentDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Termin nicht gefunden."
        );
      }

      const appointment = appointmentDoc.data();
      if (!appointment) {
        throw new functions.https.HttpsError(
          "not-found",
          "Termin nicht gefunden.",
        );
      }
      if (appointment.userId !== userId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Sie können nur Ihre eigenen Termine bewerten.",
        );
      }

      // Prüfen, ob Termin bereits stattgefunden hat
      const appointmentDate = new Date(
        `${appointment.date} ${appointment.time}`,
      );
      const now = new Date();
      if (now.getTime() - appointmentDate.getTime() < 24 * 60 * 60 * 1000) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Bewertung nur nach abgeschlossenem Termin möglich (mindestens 24h).",
        );
      }

      // Prüfen, ob bereits eine Bewertung existiert
      const existingReviews = await db
        .collection("reviews")
        .where("appointmentId", "==", appointmentId)
        .get();

      if (!existingReviews.empty) {
        throw new functions.https.HttpsError(
          "already-exists",
          "Für diesen Termin existiert bereits eine Bewertung.",
        );
      }

      // Bewertung erstellen
      const reviewData = {
        appointmentId,
        userId,
        rating,
        comment,
        isAnonymous,
        isVerified: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const reviewRef = await db.collection("reviews").add(reviewData);

      // Kundenhistorie erstellen
      await db.collection("customer_history").add({
        userId,
        type: "review",
        referenceId: reviewRef.id,
        description: `Bewertung mit ${rating} Sternen${
          comment ? `: "${comment}"` : ""
        }`,
        metadata: {
          rating,
          isAnonymous,
          isVerified: true,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(`Bewertung ${reviewRef.id} erfolgreich erstellt.`);
      return {
        success: true,
        reviewId: reviewRef.id,
        message: "Bewertung erfolgreich erstellt!",
      };
    } catch (error: unknown) {
      functions.logger.error("Fehler beim Erstellen der Bewertung:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Fehler beim Erstellen der Bewertung.",
      );
    }
  }
);

// Standarddaten initialisieren
export const initializeDefaultData = functions.https.onCall(
  async (
    data: Record<string, never>,
    context: functions.https.CallableContext
  ) => {
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Nur Admins können Standarddaten initialisieren.",
      );
    }

    const db = admin.firestore();

    try {
      // Standard-Preisregeln erstellen
      const defaultPricingRule = {
        name: "Standard Tattoo Preisregel",
        description: "Standard-Preisregel für Tattoos",
        basePrice: 120,
        bodyPartMultipliers: {
          "arm": 1.0,
          "leg": 1.0,
          "back": 1.2,
          "chest": 1.3,
          "ribs": 1.4,
          "neck": 1.5,
          "face": 2.0,
          "hand": 1.8,
          "foot": 1.6,
        },
        sizeMultipliers: {
          "small": 0.8,
          "medium": 1.0,
          "large": 1.3,
          "extra_large": 1.6,
        },
        styleMultipliers: {
          "traditional": 1.0,
          "realistic": 1.4,
          "watercolor": 1.3,
          "geometric": 1.1,
          "minimalist": 0.9,
          "japanese": 1.2,
          "tribal": 1.0,
          "lettering": 0.8,
        },
        complexityMultipliers: {
          simple: 0.9,
          medium: 1.0,
          complex: 1.3,
          very_complex: 1.6,
        },
        depositPercentage: 30,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("pricing_rules").add(defaultPricingRule);

      // Standard-Materialien erstellen
      const defaultMaterials = [
        {
          name: "Schwarze Tattoo-Farbe",
          category: "ink",
          unit: "ml",
          currentStock: 100,
          minimumStock: 20,
          costPerUnit: 0.5,
          supplier: "Tattoo Supply Co.",
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          name: "Rote Tattoo-Farbe",
          category: "ink",
          unit: "ml",
          currentStock: 80,
          minimumStock: 15,
          costPerUnit: 0.6,
          supplier: "Tattoo Supply Co.",
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          name: "Tattoo-Nadeln (3RL)",
          category: "needle",
          unit: "piece",
          currentStock: 200,
          minimumStock: 50,
          costPerUnit: 0.3,
          supplier: "Tattoo Supply Co.",
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      ];

      for (const material of defaultMaterials) {
        await db.collection("materials").add(material);
      }

      // Standard-Nachsorge-Templates erstellen
      const defaultTemplates = [
        {
          name: "Standard Tattoo Nachsorge",
          title: "Wichtige Nachsorge-Hinweise für Ihr neues Tattoo",
          content: `
            <h2>Ihr Tattoo benötigt jetzt besondere Pflege</h2>
            <p>Bitte befolgen Sie diese wichtigen Schritte für eine optimale Heilung:</p>
            <ul>
              <li>Entfernen Sie die Folie nach 2-4 Stunden</li>
              <li>Waschen Sie das Tattoo vorsichtig mit lauwarmem Wasser und milder Seife</li>
              <li>Trocknen Sie es sanft ab (nicht reiben!)</li>
              <li>Tragen Sie eine dünne Schicht Nachsorge-Creme auf</li>
              <li>Vermeiden Sie Sonne, Schwimmbad und Sauna für 2-3 Wochen</li>
              <li>Kratzen Sie nicht an Schorf oder Krusten</li>
            </ul>
            <p>Bei Fragen oder Problemen kontaktieren Sie uns gerne!</p>
          `,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      ];

      for (const template of defaultTemplates) {
        await db.collection("aftercare_templates").add(template);
      }

      functions.logger.info("Standarddaten erfolgreich initialisiert.");
      return {
        success: true,
        message: "Standarddaten erfolgreich initialisiert!",
      };
    } catch (error: unknown) {
      functions.logger.error("Fehler bei der Initialisierung:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Fehler bei der Initialisierung der Standarddaten."
      );
    }
  }
);

// Typdefinitionen ergänzen
interface Pricing {
  basePrice: number;
  bodyPartMultiplier: number;
  sizeMultiplier: number;
  styleMultiplier: number;
  complexityMultiplier: number;
  totalPrice: number;
  depositAmount: number;
  depositPaid: boolean;
}
