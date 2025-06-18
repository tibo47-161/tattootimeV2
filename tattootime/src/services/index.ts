// Bestehende Services
export * from './appointmentService';
export * from './slotService';

// Neue Services für erweiterte Features
export { PricingService } from './pricingService';
export { MaterialService } from './materialService';
export { PaymentService } from './paymentService';
export { NotificationService } from './notificationService';
export { ReviewService } from './reviewService';
export { CustomerService } from './customerService';
export { InitializationService } from './initializationService';
export { AdminService } from './adminService';

// Test Suite
export { ServiceTestSuite } from './testServices'; 