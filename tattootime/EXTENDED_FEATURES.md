# TattooTime - Erweiterte Features

Dieses Dokument beschreibt die neuen erweiterten Features, die zu TattooTime hinzugefügt wurden.

## 🎯 Übersicht

Die erweiterten Features wurden **sicher** implementiert, ohne das bestehende System zu beeinträchtigen. Alle neuen Funktionen sind optional und können schrittweise aktiviert werden.

## 📋 Neue Features

### 4. Dynamische Preisberechnung
- **Service:** `PricingService`
- **Funktionen:**
  - Automatische Preisberechnung basierend auf Körperstelle, Größe und Stil
  - Konfigurierbare Multiplikatoren für verschiedene Faktoren
  - Anzahlungsberechnung
  - Standard-Preisregeln für Tattoos

**Verwendung:**
```typescript
import { PricingService } from '../services';

// Preis berechnen
const price = PricingService.calculatePrice(
  pricingRule,
  'arm',
  { width: 10, height: 15 },
  'traditional',
  'medium',
  120 // Minuten
);
```

### 5. Online-Zahlung
- **Service:** `PaymentService`
- **Funktionen:**
  - Stripe-Integration (Platzhalter)
  - PayPal-Integration (Platzhalter)
  - Anzahlungs- und Restzahlungsverwaltung
  - Zahlungsstatistiken

**Verwendung:**
```typescript
import { PaymentService } from '../services';

// Anzahlung erstellen
const paymentId = await PaymentService.createDepositPayment(
  appointmentId,
  userId,
  50.00,
  'stripe'
);
```

### 6. Kalender-Synchronisation
- **Service:** `CalendarSync` (in Types definiert)
- **Funktionen:**
  - Google Calendar Integration
  - iCal Export
  - Automatische Synchronisation

### 7. WhatsApp/Telegram-Bot
- **Service:** `NotificationService`
- **Funktionen:**
  - Terminerinnerungen
  - Nachsorge-Hinweise
  - Zahlungserinnerungen
  - WhatsApp Business API (Platzhalter)
  - Telegram Bot API (Platzhalter)

**Verwendung:**
```typescript
import { NotificationService } from '../services';

// Terminerinnerung erstellen
await NotificationService.createAppointmentReminder(
  userId,
  '2024-02-15',
  '14:00',
  'Max Mustermann',
  'whatsapp'
);
```

### 8. Nachsorge-Hinweise
- **Service:** `NotificationService`
- **Funktionen:**
  - Automatische E-Mails 24h nach Termin
  - Konfigurierbare Templates
  - PDF- und Video-Links

### 9. Materialverbrauchs-Tracker
- **Service:** `MaterialService`
- **Funktionen:**
  - Lagerstand-Management
  - Automatische Verbrauchsaufzeichnung
  - Niedrige Lagerbestände-Warnungen
  - Verbrauchsstatistiken

**Verwendung:**
```typescript
import { MaterialService } from '../services';

// Materialverbrauch erfassen
await MaterialService.recordUsage({
  materialId: 'material123',
  materialName: 'Schwarze Tattoo-Farbe',
  quantityUsed: 5,
  unit: 'ml',
  costPerUnit: 0.5,
  totalCost: 2.5,
  appointmentId: 'appointment123'
});
```

### 10. Kundenverwaltung mit History
- **Service:** `CustomerService`
- **Funktionen:**
  - Vollständige Kundenakte
  - Automatische Historie-Erstellung
  - DSGVO-konformer Export
  - Kundenstatistiken

**Verwendung:**
```typescript
import { CustomerService } from '../services';

// Vollständige Kundenakte abrufen
const profile = await CustomerService.getCustomerProfile(userId);
console.log(`Kunde: ${profile.user.name}`);
console.log(`Termine: ${profile.statistics.totalAppointments}`);
console.log(`Ausgaben: ${profile.statistics.totalSpent}€`);
```

### 11. Bewertungssystem
- **Service:** `ReviewService`
- **Funktionen:**
  - Bewertungen nur nach echten Terminen
  - Anonyme Bewertungen möglich
  - Bewertungsstatistiken
  - Verifizierungssystem

**Verwendung:**
```typescript
import { ReviewService } from '../services';

// Bewertung erstellen
await ReviewService.createReviewForAppointment(
  appointmentId,
  userId,
  5,
  'Sehr zufrieden mit dem Ergebnis!',
  false // nicht anonym
);
```

## 🚀 Initialisierung

### Standarddaten erstellen
```typescript
import { InitializationService } from '../services';

// Alle Standarddaten initialisieren
await InitializationService.initializeAllDefaultData();
```

### System-Status prüfen
```typescript
const status = await InitializationService.getSystemStatus();
console.log('System initialisiert:', status.isInitialized);
console.log('Empfehlungen:', status.recommendations);
```

## 📊 Neue Firestore Collections

Die folgenden Collections werden automatisch erstellt:

- `pricing_rules` - Preisregeln für dynamische Berechnung
- `materials` - Materialverwaltung
- `material_usage` - Materialverbrauch
- `payments` - Zahlungsverwaltung
- `notifications` - Benachrichtigungen
- `aftercare_templates` - Nachsorge-Templates
- `reviews` - Bewertungen
- `customer_history` - Kundenhistorie
- `calendar_sync` - Kalender-Synchronisation

## 🔧 Konfiguration

### Preisregeln anpassen
```typescript
// Neue Preisregel erstellen
await PricingService.createPricingRule({
  name: 'Premium Tattoo',
  basePrice: 150,
  bodyPartMultipliers: {
    'arm': 1.0,
    'back': 1.3,
    'face': 2.0
  },
  // ... weitere Konfiguration
});
```

### Materialien verwalten
```typescript
// Neues Material hinzufügen
await MaterialService.createMaterial({
  name: 'Blaue Tattoo-Farbe',
  category: 'ink',
  unit: 'ml',
  currentStock: 100,
  minimumStock: 20,
  costPerUnit: 0.7
});
```

## 🛡️ Sicherheit

- Alle neuen Features sind **rückwärtskompatibel**
- Bestehende Daten bleiben unverändert
- Schrittweise Aktivierung möglich
- Umfassende Fehlerbehandlung
- DSGVO-konforme Datenverwaltung

## 📈 Nächste Schritte

1. **Phase 2:** Backend-Integration (Cloud Functions)
2. **Phase 3:** Frontend-UI-Komponenten
3. **Phase 4:** Echte API-Integrationen (Stripe, WhatsApp, etc.)

## 🆘 Support

Bei Fragen oder Problemen:
1. Prüfen Sie den System-Status mit `InitializationService.getSystemStatus()`
2. Initialisieren Sie Standarddaten mit `InitializationService.initializeAllDefaultData()`
3. Überprüfen Sie die Firestore-Regeln für die neuen Collections 