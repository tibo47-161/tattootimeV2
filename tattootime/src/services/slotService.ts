import { collection, query, where, getDocs, orderBy, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Slot } from '../types';
import { getFunctions, httpsCallable } from 'firebase/functions';

export const getAvailableSlotsByDate = async (date: string): Promise<Slot[]> => {
  try {
    const slotsRef = collection(db, 'slots');
    const q = query(
      slotsRef,
      where('date', '==', date),
      where('isBooked', '==', false),
      orderBy('startTime', 'asc')
    );
    const querySnapshot = await getDocs(q);
    const slots: Slot[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Slot
    }));
    return slots;
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw new Error('Fehler beim Laden der freien Termine');
  }
};

export const createSlot = async (slotData: Omit<Slot, 'id' | 'isBooked'>): Promise<void> => {
  try {
    const slotsRef = collection(db, 'slots');
    await addDoc(slotsRef, { ...slotData, isBooked: false });
  } catch (error) {
    console.error('Error creating slot:', error);
    throw new Error('Fehler beim Erstellen des Terminslots');
  }
};

export const bookSlot = async (
  slotId: string,
  serviceType: string,
  clientName: string,
  clientEmail: string
): Promise<void> => {
  try {
    const functions = getFunctions();
    const bookSlotFunction = httpsCallable(functions, 'bookSlot');
    
    await bookSlotFunction({
      slotId,
      serviceType,
      clientName,
      clientEmail,
    });
  } catch (error) {
    console.error('Error booking slot:', error);
    throw new Error('Fehler bei der Terminbuchung');
  }
}; 