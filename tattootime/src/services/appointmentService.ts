import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Appointment } from '../types';

const appointmentsCollectionRef = collection(db, 'appointments');

export const getAppointments = async (): Promise<Appointment[]> => {
  const q = query(appointmentsCollectionRef, orderBy('createdAt', 'desc'));
  const data = await getDocs(q);
  return data.docs.map((doc) => ({
    ...(doc.data() as Appointment),
    id: doc.id,
    createdAt: doc.data().createdAt.toDate(), // Firestore Timestamp zu Date konvertieren
  }));
};

export const addAppointment = async (appointment: Omit<Appointment, 'id' | 'createdAt'>): Promise<void> => {
  await addDoc(appointmentsCollectionRef, {
    ...appointment,
    createdAt: new Date(),
  });
};

export const updateAppointment = async (id: string, appointment: Partial<Appointment>): Promise<void> => {
  const appointmentDoc = doc(db, 'appointments', id);
  await updateDoc(appointmentDoc, appointment);
};

export const deleteAppointment = async (id: string): Promise<void> => {
  const appointmentDoc = doc(db, 'appointments', id);
  await deleteDoc(appointmentDoc);
}; 