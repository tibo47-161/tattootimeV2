import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { PricingRule } from '../types';

export class PricingService {
  private static COLLECTION = 'pricing_rules';

  // Alle aktiven Preisregeln abrufen
  static async getActivePricingRules(): Promise<PricingRule[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PricingRule[];
    } catch (error) {
      console.error('Fehler beim Abrufen der Preisregeln:', error);
      throw error;
    }
  }

  // Preisregel nach ID abrufen
  static async getPricingRuleById(id: string): Promise<PricingRule | null> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as PricingRule;
      }
      return null;
    } catch (error) {
      console.error('Fehler beim Abrufen der Preisregel:', error);
      throw error;
    }
  }

  // Neue Preisregel erstellen
  static async createPricingRule(rule: Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...rule,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Erstellen der Preisregel:', error);
      throw error;
    }
  }

  // Preisregel aktualisieren
  static async updatePricingRule(id: string, updates: Partial<PricingRule>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Preisregel:', error);
      throw error;
    }
  }

  // Preisregel löschen
  static async deletePricingRule(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Fehler beim Löschen der Preisregel:', error);
      throw error;
    }
  }

  // Preis für einen Termin berechnen
  static calculatePrice(
    rule: PricingRule,
    bodyPart: string,
    size: { width: number; height: number },
    style: string,
    complexity: 'simple' | 'medium' | 'complex' | 'very_complex',
    estimatedDuration: number
  ): {
    basePrice: number;
    bodyPartMultiplier: number;
    sizeMultiplier: number;
    styleMultiplier: number;
    complexityMultiplier: number;
    totalPrice: number;
    depositAmount: number;
  } {
    // Körperstellen-Multiplikator
    const bodyPartMultiplier = rule.bodyPartMultipliers[bodyPart] || 1.0;

    // Größen-Multiplikator berechnen
    const area = size.width * size.height;
    let sizeMultiplier = 1.0;
    if (area <= 25) sizeMultiplier = rule.sizeMultipliers['small'] || 0.8;
    else if (area <= 100) sizeMultiplier = rule.sizeMultipliers['medium'] || 1.0;
    else if (area <= 400) sizeMultiplier = rule.sizeMultipliers['large'] || 1.3;
    else sizeMultiplier = rule.sizeMultipliers['extra_large'] || 1.6;

    // Stil-Multiplikator
    const styleMultiplier = rule.styleMultipliers[style] || 1.0;

    // Komplexitäts-Multiplikator
    const complexityMultiplier = rule.complexityMultipliers[complexity] || 1.0;

    // Stundenpreis berechnen
    const hourlyRate = rule.basePrice;
    const hours = estimatedDuration / 60;
    const basePrice = hourlyRate * hours;

    // Gesamtpreis berechnen
    const totalPrice = basePrice * bodyPartMultiplier * sizeMultiplier * styleMultiplier * complexityMultiplier;

    // Anzahlung berechnen
    const depositAmount = totalPrice * (rule.depositPercentage / 100);

    return {
      basePrice,
      bodyPartMultiplier,
      sizeMultiplier,
      styleMultiplier,
      complexityMultiplier,
      totalPrice: Math.round(totalPrice * 100) / 100, // Auf 2 Dezimalstellen runden
      depositAmount: Math.round(depositAmount * 100) / 100
    };
  }

  // Standard-Preisregeln erstellen
  static async createDefaultPricingRules(): Promise<void> {
    const defaultRules = [
      {
        name: 'Standard Tattoo Preisregel',
        description: 'Standard-Preisregel für Tattoos',
        basePrice: 120, // 120€ pro Stunde
        bodyPartMultipliers: {
          'arm': 1.0,
          'leg': 1.0,
          'back': 1.2,
          'chest': 1.3,
          'ribs': 1.4,
          'neck': 1.5,
          'face': 2.0,
          'hand': 1.8,
          'foot': 1.6
        },
        sizeMultipliers: {
          'small': 0.8,    // bis 25cm²
          'medium': 1.0,   // 25-100cm²
          'large': 1.3,    // 100-400cm²
          'extra_large': 1.6 // über 400cm²
        },
        styleMultipliers: {
          'traditional': 1.0,
          'realistic': 1.4,
          'watercolor': 1.3,
          'geometric': 1.1,
          'minimalist': 0.9,
          'japanese': 1.2,
          'tribal': 1.0,
          'lettering': 0.8
        },
        complexityMultipliers: {
          simple: 0.9,
          medium: 1.0,
          complex: 1.3,
          very_complex: 1.6
        },
        depositPercentage: 30, // 30% Anzahlung
        isActive: true
      }
    ];

    for (const rule of defaultRules) {
      await this.createPricingRule(rule);
    }
  }
} 