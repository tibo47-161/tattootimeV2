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
  serviceType?: 'Tattoo' | 'Jugendhilfe' | 'Arzt' | 'Privat' | 'Blocked';
  tattooStyle?: string;
  bodyPart?: string;
  clientEmail?: string;
  colorCode?: string; // Hex color code or a predefined string like 'red', 'blue'
  notes?: string;
} 