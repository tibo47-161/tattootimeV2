import { PricingService } from './pricingService';
import { MaterialService } from './materialService';
import { PaymentService } from './paymentService';
import { NotificationService } from './notificationService';
import { ReviewService } from './reviewService';
import { CustomerService } from './customerService';
import { InitializationService } from './initializationService';

export class ServiceTestSuite {
  // Test der Preisberechnung
  static async testPricingService(): Promise<boolean> {
    try {
      console.log('🧪 Teste PricingService...');
      
      // Standard-Preisregeln erstellen
      await PricingService.createDefaultPricingRules();
      
      // Preisregeln abrufen
      const rules = await PricingService.getActivePricingRules();
      if (rules.length === 0) {
        throw new Error('Keine Preisregeln gefunden');
      }
      
      // Preisberechnung testen
      const rule = rules[0];
      const price = PricingService.calculatePrice(
        rule,
        'arm',
        { width: 10, height: 15 },
        'traditional',
        'medium',
        120
      );
      
      if (price.totalPrice <= 0) {
        throw new Error('Preisberechnung fehlgeschlagen');
      }
      
      console.log('✅ PricingService Test erfolgreich');
      return true;
    } catch (error) {
      console.error('❌ PricingService Test fehlgeschlagen:', error);
      return false;
    }
  }

  // Test des Material-Services
  static async testMaterialService(): Promise<boolean> {
    try {
      console.log('🧪 Teste MaterialService...');
      
      // Standard-Materialien erstellen
      await MaterialService.createDefaultMaterials();
      
      // Materialien abrufen
      const materials = await MaterialService.getActiveMaterials();
      if (materials.length === 0) {
        throw new Error('Keine Materialien gefunden');
      }
      
      // Lagerstand testen
      const material = materials[0];
      const originalStock = material.currentStock;
      
      await MaterialService.updateStock(material.id!, 10, 'add');
      const updatedMaterial = await MaterialService.getMaterialById(material.id!);
      
      if (!updatedMaterial || updatedMaterial.currentStock !== originalStock + 10) {
        throw new Error('Lagerstand-Update fehlgeschlagen');
      }
      
      console.log('✅ MaterialService Test erfolgreich');
      return true;
    } catch (error) {
      console.error('❌ MaterialService Test fehlgeschlagen:', error);
      return false;
    }
  }

  // Test des Payment-Services
  static async testPaymentService(): Promise<boolean> {
    try {
      console.log('🧪 Teste PaymentService...');
      
      // Test-Zahlung erstellen
      const paymentId = await PaymentService.createPayment({
        appointmentId: 'test-appointment',
        userId: 'test-user',
        amount: 50.00,
        currency: 'EUR',
        status: 'pending',
        paymentMethod: 'stripe',
        description: 'Test-Zahlung'
      });
      
      if (!paymentId) {
        throw new Error('Zahlung konnte nicht erstellt werden');
      }
      
      // Zahlung abrufen
      const payment = await PaymentService.getPaymentById(paymentId);
      if (!payment) {
        throw new Error('Zahlung nicht gefunden');
      }
      
      console.log('✅ PaymentService Test erfolgreich');
      return true;
    } catch (error) {
      console.error('❌ PaymentService Test fehlgeschlagen:', error);
      return false;
    }
  }

  // Test des Notification-Services
  static async testNotificationService(): Promise<boolean> {
    try {
      console.log('🧪 Teste NotificationService...');
      
      // Standard-Nachsorge-Templates erstellen
      await NotificationService.createDefaultAftercareTemplates();
      
      // Templates abrufen
      const templates = await NotificationService.getActiveAftercareTemplates();
      if (templates.length === 0) {
        throw new Error('Keine Nachsorge-Templates gefunden');
      }
      
      // Test-Benachrichtigung erstellen
      const notificationId = await NotificationService.createNotification({
        userId: 'test-user',
        type: 'appointment_reminder',
        title: 'Test-Benachrichtigung',
        message: 'Dies ist eine Test-Benachrichtigung',
        channel: 'email',
        status: 'pending'
      });
      
      if (!notificationId) {
        throw new Error('Benachrichtigung konnte nicht erstellt werden');
      }
      
      console.log('✅ NotificationService Test erfolgreich');
      return true;
    } catch (error) {
      console.error('❌ NotificationService Test fehlgeschlagen:', error);
      return false;
    }
  }

  // Test des Review-Services
  static async testReviewService(): Promise<boolean> {
    try {
      console.log('🧪 Teste ReviewService...');
      
      // Bewertungsstatistiken abrufen
      const stats = await ReviewService.getReviewStatistics();
      
      if (typeof stats.averageRating !== 'number' || stats.totalReviews < 0) {
        throw new Error('Bewertungsstatistiken sind ungültig');
      }
      
      console.log('✅ ReviewService Test erfolgreich');
      return true;
    } catch (error) {
      console.error('❌ ReviewService Test fehlgeschlagen:', error);
      return false;
    }
  }

  // Test des Customer-Services
  static async testCustomerService(): Promise<boolean> {
    try {
      console.log('🧪 Teste CustomerService...');
      
      // Kundenstatistiken abrufen
      const stats = await CustomerService.getCustomerStatistics();
      
      if (typeof stats.totalCustomers !== 'number' || stats.totalCustomers < 0) {
        throw new Error('Kundenstatistiken sind ungültig');
      }
      
      console.log('✅ CustomerService Test erfolgreich');
      return true;
    } catch (error) {
      console.error('❌ CustomerService Test fehlgeschlagen:', error);
      return false;
    }
  }

  // Test des Initialization-Services
  static async testInitializationService(): Promise<boolean> {
    try {
      console.log('🧪 Teste InitializationService...');
      
      // System-Status abrufen
      const status = await InitializationService.getSystemStatus();
      
      if (typeof status.isInitialized !== 'boolean') {
        throw new Error('System-Status ist ungültig');
      }
      
      console.log('✅ InitializationService Test erfolgreich');
      return true;
    } catch (error) {
      console.error('❌ InitializationService Test fehlgeschlagen:', error);
      return false;
    }
  }

  // Alle Tests ausführen
  static async runAllTests(): Promise<{
    success: boolean;
    results: Record<string, boolean>;
    summary: string;
  }> {
    console.log('🚀 Starte Service-Tests...\n');
    
    const results = {
      pricingService: await this.testPricingService(),
      materialService: await this.testMaterialService(),
      paymentService: await this.testPaymentService(),
      notificationService: await this.testNotificationService(),
      reviewService: await this.testReviewService(),
      customerService: await this.testCustomerService(),
      initializationService: await this.testInitializationService()
    };
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    const success = successCount === totalCount;
    
    const summary = `
📊 Test-Ergebnisse:
✅ Erfolgreich: ${successCount}/${totalCount}
${Object.entries(results).map(([service, result]) => 
  `${result ? '✅' : '❌'} ${service}`
).join('\n')}

${success ? '🎉 Alle Tests erfolgreich!' : '⚠️ Einige Tests fehlgeschlagen'}
    `;
    
    console.log(summary);
    
    return {
      success,
      results,
      summary
    };
  }
} 