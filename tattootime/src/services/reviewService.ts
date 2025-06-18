import { db } from './firebase';
import { Review, Appointment } from '../types';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, deleteDoc } from 'firebase/firestore';

export class ReviewService {
  private static COLLECTION = 'reviews';

  // Bewertung nach ID abrufen
  static async getReviewById(id: string): Promise<Review | null> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Review;
      }
      return null;
    } catch (error) {
      console.error('Fehler beim Abrufen der Bewertung:', error);
      throw error;
    }
  }

  // Bewertungen für einen Termin abrufen
  static async getReviewsByAppointment(appointmentId: string): Promise<Review[]> {
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
      } as unknown as Review));
    } catch (error) {
      console.error('Fehler beim Abrufen der Bewertungen:', error);
      throw error;
    }
  }

  // Alle öffentlichen Bewertungen abrufen
  static async getPublicReviews(): Promise<Review[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('isVerified', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as Review));
    } catch (error) {
      console.error('Fehler beim Abrufen der öffentlichen Bewertungen:', error);
      throw error;
    }
  }

  // Neue Bewertung erstellen
  static async createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...review,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Erstellen der Bewertung:', error);
      throw error;
    }
  }

  // Bewertung aktualisieren
  static async updateReview(id: string, updates: Partial<Review>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Bewertung:', error);
      throw error;
    }
  }

  // Bewertung für einen Termin erstellen
  static async createReviewForAppointment(
    appointmentId: string,
    userId: string,
    rating: number,
    comment?: string,
    isAnonymous = false
  ): Promise<string> {
    try {
      // Rating validieren
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        throw new Error('Bewertung muss zwischen 1 und 5 Sternen liegen');
      }

      // Prüfen, ob der Termin existiert und abgeschlossen ist
      const appointmentRef = doc(db, 'appointments', appointmentId);
      const appointmentSnap = await getDoc(appointmentRef);
      
      if (!appointmentSnap.exists()) {
        throw new Error('Termin nicht gefunden');
      }

      const appointment = appointmentSnap.data() as Appointment;
      const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
      const now = new Date();

      // Prüfen, ob der Termin bereits stattgefunden hat (mindestens 1 Tag her)
      if (now.getTime() - appointmentDate.getTime() < 24 * 60 * 60 * 1000) {
        throw new Error('Bewertung nur nach abgeschlossenem Termin möglich (mindestens 24h)');
      }

      // Prüfen, ob bereits eine Bewertung für diesen Termin existiert
      const existingReviews = await this.getReviewsByAppointment(appointmentId);
      if (existingReviews.length > 0) {
        throw new Error('Für diesen Termin existiert bereits eine Bewertung');
      }

      // Prüfen, ob der Benutzer der Termin-Inhaber ist
      if (appointment.userId !== userId) {
        throw new Error('Nur der Termin-Inhaber kann eine Bewertung erstellen');
      }

      const review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'> = {
        appointmentId,
        userId,
        rating,
        comment,
        isAnonymous,
        isVerified: true // Automatisch verifiziert, da nur nach echtem Termin möglich
      };

      return await this.createReview(review);
    } catch (error) {
      console.error('Fehler beim Erstellen der Terminbewertung:', error);
      throw error;
    }
  }

  // Bewertungsstatistiken abrufen
  static async getReviewStatistics(): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
    recentReviews: Review[];
  }> {
    try {
      const reviews = await this.getPublicReviews();
      
      if (reviews.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {},
          recentReviews: []
        };
      }

      let totalRating = 0;
      const ratingDistribution: Record<number, number> = {};

      for (const review of reviews) {
        totalRating += review.rating;
        ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
      }

      const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
      const recentReviews = reviews.slice(0, 5); // Letzte 5 Bewertungen

      return {
        averageRating,
        totalReviews: reviews.length,
        ratingDistribution,
        recentReviews
      };
    } catch (error) {
      console.error('Fehler beim Abrufen der Bewertungsstatistiken:', error);
      throw error;
    }
  }

  // Bewertungen nach Zeitraum abrufen
  static async getReviewsByDateRange(startDate: Date, endDate: Date): Promise<Review[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as Review));
    } catch (error) {
      console.error('Fehler beim Abrufen der Bewertungen nach Zeitraum:', error);
      throw error;
    }
  }

  // Bewertung als verifiziert markieren (Admin-Funktion)
  static async verifyReview(id: string): Promise<void> {
    try {
      await this.updateReview(id, { isVerified: true });
    } catch (error) {
      console.error('Fehler beim Verifizieren der Bewertung:', error);
      throw error;
    }
  }

  // Bewertung löschen (Admin-Funktion)
  static async deleteReview(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Fehler beim Löschen der Bewertung:', error);
      throw error;
    }
  }
} 