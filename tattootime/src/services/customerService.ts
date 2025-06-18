import { db } from './firebase';
import { User, CustomerHistory, Appointment, Payment, Review } from '../types';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';

export class CustomerService {
  private static USERS_COLLECTION = 'users';
  private static HISTORY_COLLECTION = 'customer_history';

  // Benutzer nach ID abrufen
  static async getUserById(id: string): Promise<User | null> {
    try {
      const docRef = doc(db, this.USERS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Fehler beim Abrufen des Benutzers:', error);
      throw error;
    }
  }

  // Benutzer nach E-Mail abrufen
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(
        collection(db, this.USERS_COLLECTION),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Fehler beim Abrufen des Benutzers nach E-Mail:', error);
      throw error;
    }
  }

  // Benutzer aktualisieren
  static async updateUser(id: string, updates: Partial<User>): Promise<void> {
    try {
      const docRef = doc(db, this.USERS_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benutzers:', error);
      throw error;
    }
  }

  // Alle Kunden abrufen (nur für Admins)
  static async getAllCustomers(): Promise<User[]> {
    try {
      const q = query(
        collection(db, this.USERS_COLLECTION),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as User));
    } catch (error) {
      console.error('Fehler beim Abrufen aller Kunden:', error);
      throw error;
    }
  }

  // Kundenhistorie für einen Benutzer abrufen
  static async getCustomerHistory(userId: string): Promise<CustomerHistory[]> {
    try {
      const q = query(
        collection(db, this.HISTORY_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as CustomerHistory));
    } catch (error) {
      console.error('Fehler beim Abrufen der Kundenhistorie:', error);
      throw error;
    }
  }

  // Neue Historie-Eintrag erstellen
  static async createHistoryEntry(entry: Omit<CustomerHistory, 'id' | 'createdAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, this.HISTORY_COLLECTION), {
        ...entry,
        createdAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Erstellen des Historie-Eintrags:', error);
      throw error;
    }
  }

  // Vollständige Kundenakte abrufen
  static async getCustomerProfile(userId: string): Promise<{
    user: User;
    appointments: Appointment[];
    payments: Payment[];
    reviews: Review[];
    history: CustomerHistory[];
    statistics: {
      totalAppointments: number;
      totalSpent: number;
      averageRating: number;
      lastVisit: Date | null;
    };
  }> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('Benutzer nicht gefunden');
      }

      // Alle Termine des Kunden abrufen
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointments = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as Appointment));

      // Alle Zahlungen des Kunden abrufen
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const payments = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as Payment));

      // Alle Bewertungen des Kunden abrufen
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviews = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as Review));

      // Kundenhistorie abrufen
      const history = await this.getCustomerHistory(userId);

      // Statistiken berechnen
      const totalAppointments = appointments.length;
      const totalSpent = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
      const lastVisit = appointments.length > 0 
        ? new Date(`${appointments[0].date} ${appointments[0].time}`)
        : null;

      return {
        user,
        appointments,
        payments,
        reviews,
        history,
        statistics: {
          totalAppointments,
          totalSpent,
          averageRating: Math.round(averageRating * 10) / 10,
          lastVisit
        }
      };
    } catch (error) {
      console.error('Fehler beim Abrufen der Kundenakte:', error);
      throw error;
    }
  }

  // Kundenhistorie automatisch erstellen
  static async createHistoryEntryForAppointment(appointment: Appointment): Promise<void> {
    try {
      const entry: Omit<CustomerHistory, 'id' | 'createdAt'> = {
        userId: appointment.userId,
        type: 'appointment',
        referenceId: appointment.id || '',
        description: `Termin am ${appointment.date} um ${appointment.time} für ${appointment.service}`,
        metadata: {
          serviceType: appointment.serviceType,
          bodyPart: appointment.bodyPart,
          tattooStyle: appointment.tattooStyle
        }
      };

      await this.createHistoryEntry(entry);
    } catch (error) {
      console.error('Fehler beim Erstellen des Historie-Eintrags für Termin:', error);
      throw error;
    }
  }

  // Kundenhistorie für Zahlung erstellen
  static async createHistoryEntryForPayment(payment: Payment): Promise<void> {
    try {
      const entry: Omit<CustomerHistory, 'id' | 'createdAt'> = {
        userId: payment.userId,
        type: 'payment',
        referenceId: payment.id || '',
        description: `Zahlung von ${payment.amount}€ (${payment.paymentMethod})`,
        metadata: {
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          status: payment.status
        }
      };

      await this.createHistoryEntry(entry);
    } catch (error) {
      console.error('Fehler beim Erstellen des Historie-Eintrags für Zahlung:', error);
      throw error;
    }
  }

  // Kundenhistorie für Bewertung erstellen
  static async createHistoryEntryForReview(review: Review): Promise<void> {
    try {
      const entry: Omit<CustomerHistory, 'id' | 'createdAt'> = {
        userId: review.userId,
        type: 'review',
        referenceId: review.id || '',
        description: `Bewertung mit ${review.rating} Sternen${review.comment ? `: "${review.comment}"` : ''}`,
        metadata: {
          rating: review.rating,
          isAnonymous: review.isAnonymous,
          isVerified: review.isVerified
        }
      };

      await this.createHistoryEntry(entry);
    } catch (error) {
      console.error('Fehler beim Erstellen des Historie-Eintrags für Bewertung:', error);
      throw error;
    }
  }

  // DSGVO-konformer Export der Kundendaten
  static async exportCustomerData(userId: string): Promise<{
    user: User;
    appointments: Appointment[];
    payments: Payment[];
    reviews: Review[];
    history: CustomerHistory[];
    exportDate: Date;
  }> {
    try {
      const profile = await this.getCustomerProfile(userId);
      
      return {
        user: profile.user,
        appointments: profile.appointments,
        payments: profile.payments,
        reviews: profile.reviews,
        history: profile.history,
        exportDate: new Date()
      };
    } catch (error) {
      console.error('Fehler beim Exportieren der Kundendaten:', error);
      throw error;
    }
  }

  // Kunden nach Suchkriterien suchen
  static async searchCustomers(searchTerm: string): Promise<User[]> {
    try {
      const allCustomers = await this.getAllCustomers();
      
      return allCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm))
      );
    } catch (error) {
      console.error('Fehler bei der Kundensuche:', error);
      throw error;
    }
  }

  // Kundenstatistiken abrufen
  static async getCustomerStatistics(): Promise<{
    totalCustomers: number;
    activeCustomers: number; // Kunden mit Terminen in den letzten 6 Monaten
    newCustomersThisMonth: number;
    averageAppointmentsPerCustomer: number;
    topCustomers: Array<{ userId: string; name: string; totalSpent: number; appointments: number }>;
  }> {
    try {
      const allCustomers = await this.getAllCustomers();
      const now = new Date();
      const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Neue Kunden diesen Monat
      const newCustomersThisMonth = allCustomers.filter(
        customer => customer.createdAt && customer.createdAt >= oneMonthAgo
      ).length;

      // Alle Termine abrufen (mit Limit für Performance)
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        orderBy('date', 'desc'),
        // Limit für Performance - in Produktion könnte man hier paginieren
        // where('date', '>=', sixMonthsAgo.toISOString().split('T')[0])
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const allAppointments = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as Appointment));

      // Alle Zahlungen abrufen (nur abgeschlossene)
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc')
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const allPayments = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as Payment));

      // Statistiken berechnen
      let totalAppointments = 0;
      const customerStats: Record<string, { name: string; spent: number; appointments: number; lastAppointment: Date }> = {};

      // Termine verarbeiten
      for (const appointment of allAppointments) {
        totalAppointments++;
        const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
        
        if (!customerStats[appointment.userId]) {
          customerStats[appointment.userId] = {
            name: appointment.clientName,
            spent: 0,
            appointments: 0,
            lastAppointment: appointmentDate
          };
        }
        
        customerStats[appointment.userId].appointments++;
        if (appointmentDate > customerStats[appointment.userId].lastAppointment) {
          customerStats[appointment.userId].lastAppointment = appointmentDate;
        }
      }

      // Zahlungen zuordnen
      for (const payment of allPayments) {
        if (customerStats[payment.userId]) {
          customerStats[payment.userId].spent += payment.amount;
        }
      }

      // Aktive Kunden zählen (mit Terminen in den letzten 6 Monaten)
      const activeCustomers = Object.values(customerStats).filter(
        stats => stats.lastAppointment >= sixMonthsAgo
      ).length;

      // Top-Kunden (nach Ausgaben sortiert)
      const topCustomers = Object.entries(customerStats)
        .map(([userId, stats]) => ({
          userId,
          name: stats.name,
          totalSpent: stats.spent,
          appointments: stats.appointments
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      return {
        totalCustomers: allCustomers.length,
        activeCustomers,
        newCustomersThisMonth,
        averageAppointmentsPerCustomer: allCustomers.length > 0 ? Math.round((totalAppointments / allCustomers.length) * 100) / 100 : 0,
        topCustomers
      };
    } catch (error) {
      console.error('Fehler beim Abrufen der Kundenstatistiken:', error);
      throw error;
    }
  }
}

export async function updateUserProfile(userId: string, data: Partial<User>) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, data);
} 