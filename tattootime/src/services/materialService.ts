import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Material, MaterialUsage } from '../types';

export class MaterialService {
  private static MATERIALS_COLLECTION = 'materials';
  private static USAGE_COLLECTION = 'material_usage';

  // Alle aktiven Materialien abrufen
  static async getActiveMaterials(): Promise<Material[]> {
    try {
      const q = query(
        collection(db, this.MATERIALS_COLLECTION),
        where('isActive', '==', true),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Material[];
    } catch (error) {
      console.error('Fehler beim Abrufen der Materialien:', error);
      throw error;
    }
  }

  // Materialien nach Kategorie abrufen
  static async getMaterialsByCategory(category: Material['category']): Promise<Material[]> {
    try {
      const q = query(
        collection(db, this.MATERIALS_COLLECTION),
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Material[];
    } catch (error) {
      console.error('Fehler beim Abrufen der Materialien nach Kategorie:', error);
      throw error;
    }
  }

  // Material nach ID abrufen
  static async getMaterialById(id: string): Promise<Material | null> {
    try {
      const docRef = doc(db, this.MATERIALS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Material;
      }
      return null;
    } catch (error) {
      console.error('Fehler beim Abrufen des Materials:', error);
      throw error;
    }
  }

  // Neues Material erstellen
  static async createMaterial(material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, this.MATERIALS_COLLECTION), {
        ...material,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Erstellen des Materials:', error);
      throw error;
    }
  }

  // Material aktualisieren
  static async updateMaterial(id: string, updates: Partial<Material>): Promise<void> {
    try {
      const docRef = doc(db, this.MATERIALS_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Materials:', error);
      throw error;
    }
  }

  // Material löschen (soft delete)
  static async deleteMaterial(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.MATERIALS_COLLECTION, id);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Fehler beim Löschen des Materials:', error);
      throw error;
    }
  }

  // Lagerstand aktualisieren
  static async updateStock(id: string, quantity: number, operation: 'add' | 'subtract'): Promise<void> {
    try {
      const material = await this.getMaterialById(id);
      if (!material) {
        throw new Error('Material nicht gefunden');
      }

      let newStock = material.currentStock;
      if (operation === 'add') {
        newStock += quantity;
      } else {
        newStock -= quantity;
        if (newStock < 0) {
          throw new Error('Lagerstand kann nicht negativ sein');
        }
      }

      await this.updateMaterial(id, { 
        currentStock: newStock,
        lastRestocked: operation === 'add' ? new Date() : material.lastRestocked
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Lagerstands:', error);
      throw error;
    }
  }

  // Materialverbrauch für einen Termin erfassen
  static async recordUsage(usage: Omit<MaterialUsage, 'usedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, this.USAGE_COLLECTION), {
        ...usage,
        usedAt: now
      });

      // Lagerstand automatisch reduzieren
      await this.updateStock(usage.materialId, usage.quantityUsed, 'subtract');

      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Erfassen des Materialverbrauchs:', error);
      throw error;
    }
  }

  // Materialverbrauch für einen Termin abrufen
  static async getUsageByAppointment(appointmentId: string): Promise<MaterialUsage[]> {
    try {
      const q = query(
        collection(db, this.USAGE_COLLECTION),
        where('appointmentId', '==', appointmentId),
        orderBy('usedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as MaterialUsage));
    } catch (error) {
      console.error('Fehler beim Abrufen des Materialverbrauchs:', error);
      throw error;
    }
  }

  // Materialien mit niedrigem Lagerstand abrufen
  static async getLowStockMaterials(): Promise<Material[]> {
    try {
      const materials = await this.getActiveMaterials();
      return materials.filter(material => material.currentStock <= material.minimumStock);
    } catch (error) {
      console.error('Fehler beim Abrufen der Materialien mit niedrigem Lagerstand:', error);
      throw error;
    }
  }

  // Materialverbrauch-Statistiken abrufen
  static async getUsageStatistics(startDate: Date, endDate: Date): Promise<{
    totalCost: number;
    usageByCategory: Record<string, number>;
    mostUsedMaterials: Array<{ materialId: string; materialName: string; totalUsed: number; totalCost: number }>;
  }> {
    try {
      const q = query(
        collection(db, this.USAGE_COLLECTION),
        where('usedAt', '>=', startDate),
        where('usedAt', '<=', endDate)
      );
      const querySnapshot = await getDocs(q);
      const usages = querySnapshot.docs.map(doc => doc.data() as MaterialUsage);

      let totalCost = 0;
      const usageByCategory: Record<string, number> = {};
      const materialUsage: Record<string, { name: string; used: number; cost: number }> = {};

      for (const usage of usages) {
        totalCost += usage.totalCost;
        
        // Material-Details abrufen für Kategorie
        const material = await this.getMaterialById(usage.materialId);
        if (material) {
          usageByCategory[material.category] = (usageByCategory[material.category] || 0) + usage.totalCost;
          
          if (!materialUsage[usage.materialId]) {
            materialUsage[usage.materialId] = {
              name: material.name,
              used: 0,
              cost: 0
            };
          }
          materialUsage[usage.materialId].used += usage.quantityUsed;
          materialUsage[usage.materialId].cost += usage.totalCost;
        }
      }

      const mostUsedMaterials = Object.entries(materialUsage)
        .map(([materialId, data]) => ({
          materialId,
          materialName: data.name,
          totalUsed: data.used,
          totalCost: data.cost
        }))
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, 10);

      return {
        totalCost,
        usageByCategory,
        mostUsedMaterials
      };
    } catch (error) {
      console.error('Fehler beim Abrufen der Verbrauchsstatistiken:', error);
      throw error;
    }
  }

  // Standard-Materialien erstellen
  static async createDefaultMaterials(): Promise<void> {
    const defaultMaterials = [
      {
        name: 'Schwarze Tattoo-Farbe',
        category: 'ink' as const,
        unit: 'ml' as const,
        currentStock: 100,
        minimumStock: 20,
        costPerUnit: 0.5,
        supplier: 'Tattoo Supply Co.',
        isActive: true
      },
      {
        name: 'Rote Tattoo-Farbe',
        category: 'ink' as const,
        unit: 'ml' as const,
        currentStock: 80,
        minimumStock: 15,
        costPerUnit: 0.6,
        supplier: 'Tattoo Supply Co.',
        isActive: true
      },
      {
        name: 'Tattoo-Nadeln (3RL)',
        category: 'needle' as const,
        unit: 'piece' as const,
        currentStock: 200,
        minimumStock: 50,
        costPerUnit: 0.3,
        supplier: 'Tattoo Supply Co.',
        isActive: true
      },
      {
        name: 'Einweghandschuhe (M)',
        category: 'disposable' as const,
        unit: 'pack' as const,
        currentStock: 50,
        minimumStock: 10,
        costPerUnit: 5.0,
        supplier: 'Medical Supply Co.',
        isActive: true
      },
      {
        name: 'Desinfektionsmittel',
        category: 'disposable' as const,
        unit: 'bottle' as const,
        currentStock: 10,
        minimumStock: 3,
        costPerUnit: 15.0,
        supplier: 'Medical Supply Co.',
        isActive: true
      }
    ];

    for (const material of defaultMaterials) {
      await this.createMaterial(material);
    }
  }
} 