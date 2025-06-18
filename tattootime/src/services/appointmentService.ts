import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Appointment } from '../types';
import { getAuth } from 'firebase/auth';

const appointmentsCollectionRef = collection(db, 'appointments');

export const getAppointments = async (): Promise<Appointment[]> => {
  try {
    const q = query(
      appointmentsCollectionRef,
      orderBy('date', 'asc'),
      orderBy('time', 'asc')
    );
    const data = await getDocs(q);
    return data.docs.map((doc) => {
      const appointmentData = doc.data();
      return {
        ...(appointmentData as Appointment),
        id: doc.id,
        date: appointmentData.date,
        time: appointmentData.time,
        createdAt: appointmentData.createdAt instanceof Timestamp 
          ? appointmentData.createdAt.toDate() 
          : new Date(appointmentData.createdAt),
      };
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw new Error('Failed to fetch appointments');
  }
};

export const addAppointment = async (appointment: Omit<Appointment, 'id' | 'createdAt'>): Promise<void> => {
  try {
    // Validate date format
    const appointmentDate = new Date(appointment.date);
    if (isNaN(appointmentDate.getTime())) {
      throw new Error('Invalid date format');
    }

    await addDoc(appointmentsCollectionRef, {
      ...appointment,
      date: appointment.date,
      time: appointment.time,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding appointment:', error);
    throw new Error('Failed to add appointment');
  }
};

export const updateAppointment = async (id: string, appointment: Partial<Appointment>): Promise<void> => {
  try {
    const appointmentDoc = doc(db, 'appointments', id);
    
    // If date is being updated, validate it
    if (appointment.date) {
      const appointmentDate = new Date(appointment.date);
      if (isNaN(appointmentDate.getTime())) {
        throw new Error('Invalid date format');
      }
    }

    await updateDoc(appointmentDoc, {
      ...appointment,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw new Error('Failed to update appointment');
  }
};

export const deleteAppointment = async (id: string): Promise<void> => {
  try {
    const appointmentDoc = doc(db, 'appointments', id);
    await deleteDoc(appointmentDoc);
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw new Error('Failed to delete appointment');
  }
};

export const getAppointmentsByDate = async (date: string): Promise<Appointment[]> => {
  try {
    const q = query(
      appointmentsCollectionRef,
      where('date', '==', date),
      orderBy('time', 'asc')
    );
    const data = await getDocs(q);
    return data.docs.map((doc) => ({
      ...(doc.data() as Appointment),
      id: doc.id,
      createdAt: doc.data().createdAt instanceof Timestamp 
        ? doc.data().createdAt.toDate() 
        : new Date(doc.data().createdAt),
    }));
  } catch (error) {
    console.error('Error fetching appointments by date:', error);
    throw new Error('Failed to fetch appointments for the selected date');
  }
};

export async function createAppointment({ date, clientName, clientEmail, serviceType = '', time = '' }: { date: string, clientName: string, clientEmail: string, serviceType?: string, time?: string }) {
  const auth = getAuth();
  const user = auth.currentUser;
  const appointmentData = {
    date,
    clientName,
    clientEmail,
    serviceType,
    time,
    status: 'angefragt',
    userId: user ? user.uid : null,
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
  return { id: docRef.id, ...appointmentData };
}

export const getAppointmentsByUser = async (userId: string): Promise<Appointment[]> => {
  try {
    const q = query(
      appointmentsCollectionRef,
      where('userId', '==', userId),
      orderBy('date', 'asc'),
      orderBy('time', 'asc')
    );
    const data = await getDocs(q);
    return data.docs.map((doc) => {
      const appointmentData = doc.data();
      return {
        ...(appointmentData as Appointment),
        id: doc.id,
        date: appointmentData.date,
        time: appointmentData.time,
        createdAt: appointmentData.createdAt instanceof Timestamp 
          ? appointmentData.createdAt.toDate() 
          : new Date(appointmentData.createdAt),
      };
    });
  } catch (error) {
    console.error('Error fetching appointments by user:', error);
    throw new Error('Failed to fetch appointments for the user');
  }
};

export const cancelAppointment = async (id: string): Promise<void> => {
  return deleteAppointment(id);
}; 