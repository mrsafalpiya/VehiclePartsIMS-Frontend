export type UserRole = 'admin' | 'staff' | 'customer';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  vehicles: Vehicle[];
  createdAt: string; // ISO date string
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

export interface Part {
  id: string;
  name: string;
  code: string;
  sellingPrice: number;
  stockQuantity: number;
  vendorId: string;
}

export interface PurchaseLineItem {
  partId: string;
  quantity: number;
  unitCostPrice: number;
}

export interface PurchaseInvoice {
  id: string;
  vendorId: string;
  date: string; // ISO date string
  lineItems: PurchaseLineItem[];
  total: number;
}

export type PaymentStatus = 'paid' | 'unpaid';

export interface SalesLineItem {
  partId: string;
  quantity: number;
  unitSellingPrice: number;
  lineTotal: number;
}

export interface SalesInvoice {
  id: string;
  customerId: string;
  date: string; // ISO date string
  lineItems: SalesLineItem[];
  subtotal: number;
  discount: number;
  finalTotal: number;
  paymentStatus: PaymentStatus;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  customerId: string;
  preferredDate: string; // ISO date string
  preferredTime: string; // e.g. "10:00 AM"
  status: AppointmentStatus;
  createdAt: string; // ISO date string
}

export interface PartRequest {
  id: string;
  customerId: string;
  partName: string;
  notes: string;
  createdAt: string; // ISO date string
}

export interface ServiceReview {
  id: string;
  customerId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: string; // ISO date string
}

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  createdAt: string; // ISO date string
  read: boolean;
}
