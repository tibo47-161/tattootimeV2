import { db } from './firebase';
import { Notification, AftercareTemplate } from '../types';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';

export class NotificationService {
  private static NOTIFICATIONS_COLLECTION = 'notifications';
  private static AFTERCARE_TEMPLATES_COLLECTION = 'aftercare_templates';

  // Benachrichtigung nach ID abrufen
  static async getNotificationById(id: string): Promise<Notification | null> {
    try {
      const docRef = doc(db, this.NOTIFICATIONS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Notification;
      }
      return null;
    } catch (error) {
      console.error('Fehler beim Abrufen der Benachrichtigung:', error);
      throw error;
    }
  }

  // Benachrichtigungen für einen Benutzer abrufen
  static async getNotificationsByUser(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, this.NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as Notification));
    } catch (error) {
      console.error('Fehler beim Abrufen der Benachrichtigungen:', error);
      throw error;
    }
  }

  // Neue Benachrichtigung erstellen
  static async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, this.NOTIFICATIONS_COLLECTION), {
        ...notification,
        createdAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Erstellen der Benachrichtigung:', error);
      throw error;
    }
  }

  // Benachrichtigungsstatus aktualisieren
  static async updateNotificationStatus(id: string, status: Notification['status'], sentAt?: Date): Promise<void> {
    try {
      const docRef = doc(db, this.NOTIFICATIONS_COLLECTION, id);
      const updates: any = {
        status,
        updatedAt: new Date()
      };

      if (sentAt) {
        updates.sentAt = sentAt;
      }

      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benachrichtigungsstatus:', error);
      throw error;
    }
  }

  // Terminerinnerung erstellen
  static async createAppointmentReminder(
    userId: string,
    appointmentDate: string,
    appointmentTime: string,
    clientName: string,
    channel: Notification['channel'] = 'email'
  ): Promise<string> {
    try {
      const notification: Omit<Notification, 'id' | 'createdAt'> = {
        userId,
        type: 'appointment_reminder',
        title: 'Terminerinnerung',
        message: `Hallo ${clientName}, bitte denken Sie an Ihren Termin am ${appointmentDate} um ${appointmentTime}. Bitte kommen Sie ausgeschlafen und nicht nüchtern.`,
        channel,
        status: 'pending',
        scheduledFor: new Date(new Date(`${appointmentDate} ${appointmentTime}`).getTime() - 24 * 60 * 60 * 1000) // 24h vorher
      };

      return await this.createNotification(notification);
    } catch (error) {
      console.error('Fehler beim Erstellen der Terminerinnerung:', error);
      throw error;
    }
  }

  // Nachsorge-Benachrichtigung erstellen
  static async createAftercareNotification(
    userId: string,
    appointmentDate: string,
    channel: Notification['channel'] = 'email'
  ): Promise<string> {
    try {
      const notification: Omit<Notification, 'id' | 'createdAt'> = {
        userId,
        type: 'aftercare',
        title: 'Nachsorge-Hinweise',
        message: `Ihr Tattoo vom ${appointmentDate} benötigt jetzt besondere Pflege. Bitte folgen Sie den Nachsorge-Anweisungen für optimale Heilung.`,
        channel,
        status: 'pending',
        scheduledFor: new Date(new Date(appointmentDate).getTime() + 24 * 60 * 60 * 1000) // 24h nachher
      };

      return await this.createNotification(notification);
    } catch (error) {
      console.error('Fehler beim Erstellen der Nachsorge-Benachrichtigung:', error);
      throw error;
    }
  }

  // Zahlungserinnerung erstellen
  static async createPaymentReminder(
    userId: string,
    amount: number,
    dueDate: string,
    channel: Notification['channel'] = 'email'
  ): Promise<string> {
    try {
      const notification: Omit<Notification, 'id' | 'createdAt'> = {
        userId,
        type: 'payment_reminder',
        title: 'Zahlungserinnerung',
        message: `Bitte denken Sie an die ausstehende Zahlung von ${amount}€, fällig am ${dueDate}.`,
        channel,
        status: 'pending',
        scheduledFor: new Date(new Date(dueDate).getTime() - 3 * 24 * 60 * 60 * 1000) // 3 Tage vorher
      };

      return await this.createNotification(notification);
    } catch (error) {
      console.error('Fehler beim Erstellen der Zahlungserinnerung:', error);
      throw error;
    }
  }

  // WhatsApp-Nachricht senden (Platzhalter)
  static async sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // Hier würde die echte WhatsApp Business API Integration stehen
      console.log(`WhatsApp-Nachricht an ${phoneNumber}: ${message}`);
      
      // Simuliere erfolgreichen Versand
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Fehler beim Senden der WhatsApp-Nachricht:', error);
      return false;
    }
  }

  // Telegram-Nachricht senden (Platzhalter)
  static async sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
    try {
      // Hier würde die echte Telegram Bot API Integration stehen
      console.log(`Telegram-Nachricht an ${chatId}: ${message}`);
      
      // Simuliere erfolgreichen Versand
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Fehler beim Senden der Telegram-Nachricht:', error);
      return false;
    }
  }

  // SMS senden (Platzhalter)
  static async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // Hier würde die echte SMS-API Integration stehen (z.B. Twilio)
      console.log(`SMS an ${phoneNumber}: ${message}`);
      
      // Simuliere erfolgreichen Versand
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Fehler beim Senden der SMS:', error);
      return false;
    }
  }

  // Nachsorge-Template abrufen
  static async getAftercareTemplate(id: string): Promise<AftercareTemplate | null> {
    try {
      const docRef = doc(db, this.AFTERCARE_TEMPLATES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AftercareTemplate;
      }
      return null;
    } catch (error) {
      console.error('Fehler beim Abrufen des Nachsorge-Templates:', error);
      throw error;
    }
  }

  // Alle aktiven Nachsorge-Templates abrufen
  static async getActiveAftercareTemplates(): Promise<AftercareTemplate[]> {
    try {
      const q = query(
        collection(db, this.AFTERCARE_TEMPLATES_COLLECTION),
        where('isActive', '==', true),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as AftercareTemplate));
    } catch (error) {
      console.error('Fehler beim Abrufen der Nachsorge-Templates:', error);
      throw error;
    }
  }

  // Standard-Nachsorge-Templates erstellen
  static async createDefaultAftercareTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        name: 'Standard Tattoo Nachsorge',
        title: 'Wichtige Nachsorge-Hinweise für Ihr neues Tattoo',
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
        isActive: true
      },
      {
        name: 'Piercing Nachsorge',
        title: 'Nachsorge für Ihr neues Piercing',
        content: `
          <h2>Pflegehinweise für Ihr Piercing</h2>
          <p>Für eine problemlose Heilung beachten Sie bitte:</p>
          <ul>
            <li>Reinigen Sie das Piercing 2x täglich mit Kochsalzlösung</li>
            <li>Vermeiden Sie Berührungen mit schmutzigen Händen</li>
            <li>Drehen Sie das Piercing nicht während der Heilung</li>
            <li>Vermeiden Sie Schwimmbad und Sauna</li>
            <li>Tragen Sie keine enge Kleidung über dem Piercing</li>
          </ul>
        `,
        isActive: true
      }
    ];

    for (const template of defaultTemplates) {
      await addDoc(collection(db, this.AFTERCARE_TEMPLATES_COLLECTION), {
        ...template,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
} 