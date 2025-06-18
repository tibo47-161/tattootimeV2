export interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  phone?: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalInfo?: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
  preferences?: {
    communicationMethod: 'email' | 'sms' | 'whatsapp';
    language: 'de' | 'en';
  };
  createdAt?: Date;
  updatedAt?: Date;
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
  pricing?: {
    basePrice: number;
    bodyPartMultiplier: number;
    sizeMultiplier: number;
    styleMultiplier: number;
    totalPrice: number;
    depositAmount: number;
    depositPaid: boolean;
    depositPaidAt?: Date;
  };
  tattooDetails?: {
    size: {
      width: number; // cm
      height: number; // cm
    };
    estimatedDuration: number; // minutes
    complexity: 'simple' | 'medium' | 'complex' | 'very_complex';
    colors: string[];
    referenceImages?: string[]; // URLs zu Referenzbildern
  };
  payment?: {
    status: 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded';
    stripePaymentIntentId?: string;
    totalAmount: number;
    depositAmount: number;
    remainingAmount: number;
    paymentMethod?: string;
    paidAt?: Date;
  };
  calendarSync?: {
    googleCalendarEventId?: string;
    iCalEventId?: string;
    lastSynced?: Date;
  };
  aftercare?: {
    sentAt?: Date;
    followUpDate?: string;
    customerFeedback?: string;
    rating?: number; // 1-5 Sterne
    review?: string;
    reviewAnonymous?: boolean;
  };
  materials?: {
    items: MaterialUsage[];
    totalCost: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Slot {
  id?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  duration?: number; // in minutes
  isBooked: boolean;
  bookedByUserId?: string;
  bookedByUserName?: string;
  bookedByEmail?: string;
  serviceType: 'Tattoo' | 'Jugendhilfe' | 'Arzt' | 'Privat' | 'Blocked';
  artistId?: string;
  maxDuration?: number;
  specialRequirements?: string[];
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
}

export interface PricingRule {
  id?: string;
  name: string;
  description?: string;
  basePrice: number;
  bodyPartMultipliers: {
    [bodyPart: string]: number;
  };
  sizeMultipliers: {
    [sizeRange: string]: number;
  };
  styleMultipliers: {
    [style: string]: number;
  };
  complexityMultipliers: {
    simple: number;
    medium: number;
    complex: number;
    very_complex: number;
  };
  depositPercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Material {
  id?: string;
  name: string;
  category: 'ink' | 'needle' | 'disposable' | 'equipment' | 'other';
  unit: 'ml' | 'piece' | 'pack' | 'box' | 'bottle';
  currentStock: number;
  minimumStock: number;
  costPerUnit: number;
  supplier?: string;
  supplierContact?: string;
  lastRestocked?: Date;
  expiryDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialUsage {
  id?: string;
  materialId: string;
  materialName: string;
  quantityUsed: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  appointmentId: string;
  usedAt: Date;
}

export interface Payment {
  id?: string;
  appointmentId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'cash' | 'bank_transfer';
  stripePaymentIntentId?: string;
  paypalOrderId?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id?: string;
  appointmentId: string;
  userId: string;
  rating: number;
  comment?: string;
  isAnonymous: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id?: string;
  userId: string;
  type: 'appointment_reminder' | 'aftercare' | 'payment_reminder' | 'general';
  title: string;
  message: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'telegram' | 'push';
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  scheduledFor?: Date;
  sentAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AftercareTemplate {
  id?: string;
  name: string;
  title: string;
  content: string;
  pdfTemplate?: string;
  videoUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerHistory {
  id?: string;
  userId: string;
  type: 'appointment' | 'payment' | 'review' | 'material_usage';
  referenceId: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface CalendarSync {
  id?: string;
  userId: string;
  provider: 'google' | 'ical' | 'outlook';
  accessToken?: string;
  refreshToken?: string;
  calendarId?: string;
  isActive: boolean;
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
} 