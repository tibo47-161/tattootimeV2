import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Payment } from '../types';

export class PaymentService {
  private static COLLECTION = 'payments';

  // Zahlung anhand ID abrufen
  static async getPaymentById(id: string): Promise<Payment | null> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Payment;
      }
      return null;
    } catch (error) {
      console.error('Fehler beim Abrufen der Zahlung:', error);
      throw error;
    }
  }

  // Zahlungen für einen Termin abrufen
  static async getPaymentsByAppointment(appointmentId: string): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('appointmentId', '==', appointmentId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as Payment));
    } catch (error) {
      console.error('Fehler beim Abrufen der Zahlungen:', error);
      throw error;
    }
  }

  // Zahlungen für einen Benutzer abrufen
  static async getPaymentsByUser(userId: string): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as Payment));
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzerzahlungen:', error);
      throw error;
    }
  }

  // Neue Zahlung erstellen
  static async createPayment(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...payment,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Erstellen der Zahlung:', error);
      throw error;
    }
  }

  // Zahlungsstatus aktualisieren
  static async updatePaymentStatus(id: string, status: Payment['status'], metadata?: Record<string, unknown>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      const updates = {
        status,
        updatedAt: new Date()
      };

      if (status === 'completed') {
        (updates as any).paidAt = new Date();
      }

      if (metadata) {
        (updates as any).metadata = metadata;
      }

      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Zahlungsstatus:', error);
      throw error;
    }
  }

  // Anzahlung für einen Termin erstellen
  static async createDepositPayment(
    appointmentId: string,
    userId: string,
    amount: number,
    paymentMethod: Payment['paymentMethod'] = 'stripe'
  ): Promise<string> {
    try {
      const payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
        appointmentId,
        userId,
        amount,
        currency: 'EUR',
        status: 'pending',
        paymentMethod,
        description: `Anzahlung für Termin ${appointmentId}`
      };

      return await this.createPayment(payment);
    } catch (error) {
      console.error('Fehler beim Erstellen der Anzahlung:', error);
      throw error;
    }
  }

  // Restzahlung für einen Termin erstellen
  static async createRemainingPayment(
    appointmentId: string,
    userId: string,
    amount: number,
    paymentMethod: Payment['paymentMethod'] = 'stripe'
  ): Promise<string> {
    try {
      const payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
        appointmentId,
        userId,
        amount,
        currency: 'EUR',
        status: 'pending',
        paymentMethod,
        description: `Restzahlung für Termin ${appointmentId}`
      };

      return await this.createPayment(payment);
    } catch (error) {
      console.error('Fehler beim Erstellen der Restzahlung:', error);
      throw error;
    }
  }

  // Zahlungsstatistiken abrufen
  static async getPaymentStatistics(startDate: Date, endDate: Date): Promise<{
    totalRevenue: number;
    totalPayments: number;
    paymentsByMethod: Record<string, number>;
    paymentsByStatus: Record<string, number>;
  }> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
      const querySnapshot = await getDocs(q);
      const payments = querySnapshot.docs.map(doc => doc.data() as Payment);

      let totalRevenue = 0;
      let totalPayments = 0;
      const paymentsByMethod: Record<string, number> = {};
      const paymentsByStatus: Record<string, number> = {};

      for (const payment of payments) {
        if (payment.status === 'completed') {
          totalRevenue += payment.amount;
        }
        totalPayments++;

        paymentsByMethod[payment.paymentMethod] = (paymentsByMethod[payment.paymentMethod] || 0) + 1;
        paymentsByStatus[payment.status] = (paymentsByStatus[payment.status] || 0) + 1;
      }

      return {
        totalRevenue,
        totalPayments,
        paymentsByMethod,
        paymentsByStatus
      };
    } catch (error) {
      console.error('Fehler beim Abrufen der Zahlungsstatistiken:', error);
      throw error;
    }
  }

  // Stripe Payment Intent erstellen (Platzhalter für echte Stripe-Integration)
  static async createStripePaymentIntent(amount: number, currency = 'EUR'): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    // Hier würde die echte Stripe-Integration stehen
    // Für jetzt erstellen wir einen Platzhalter
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `pi_${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`;

    return {
      clientSecret,
      paymentIntentId
    };
  }

  // PayPal Order erstellen (Platzhalter für echte PayPal-Integration)
  static async createPayPalOrder(amount: number, currency = 'EUR'): Promise<{
    orderId: string;
    approvalUrl: string;
  }> {
    // Hier würde die echte PayPal-Integration stehen
    // Für jetzt erstellen wir einen Platzhalter
    const orderId = `PAYPAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`;

    return {
      orderId,
      approvalUrl
    };
  }
} 