export interface Appointment {
  id: string;
  date: string;
  time: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name: string;
} 