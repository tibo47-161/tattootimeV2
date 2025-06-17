export interface User {
  id: string;
  email: string;
  role: string;
  name: string;
}

export interface Appointment {
  id?: string;
  date: string;
  time: string;
  clientName: string;
  service: string;
  userId: string;
} 