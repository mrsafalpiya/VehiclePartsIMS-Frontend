import { createContext, useContext } from 'react'
import type {
  User,
  Customer,
  Vendor,
  Part,
  PurchaseInvoice,
  SalesInvoice,
  Appointment,
  PartRequest,
  ServiceReview,
  Notification,
} from '#/types/index'

export interface Store {
  // Entities
  users: User[]
  customers: Customer[]
  vendors: Vendor[]
  parts: Part[]
  purchaseInvoices: PurchaseInvoice[]
  salesInvoices: SalesInvoice[]
  appointments: Appointment[]
  partRequests: PartRequest[]
  reviews: ServiceReview[]
  notifications: Notification[]

  // Users CRUD
  addUser: (user: User) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void

  // Customers CRUD
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, updates: Partial<Customer>) => void
  deleteCustomer: (id: string) => void

  // Vendors CRUD
  addVendor: (vendor: Vendor) => void
  updateVendor: (id: string, updates: Partial<Vendor>) => void
  deleteVendor: (id: string) => void

  // Parts CRUD
  addPart: (part: Part) => void
  updatePart: (id: string, updates: Partial<Part>) => void
  deletePart: (id: string) => void

  // Purchase Invoices CRUD
  addPurchaseInvoice: (invoice: PurchaseInvoice) => void
  updatePurchaseInvoice: (id: string, updates: Partial<PurchaseInvoice>) => void

  // Sales Invoices CRUD
  addSalesInvoice: (invoice: SalesInvoice) => void
  updateSalesInvoice: (id: string, updates: Partial<SalesInvoice>) => void

  // Appointments CRUD
  addAppointment: (appointment: Appointment) => void
  updateAppointment: (id: string, updates: Partial<Appointment>) => void

  // Part Requests CRUD
  addPartRequest: (request: PartRequest) => void
  deletePartRequest: (id: string) => void

  // Reviews CRUD
  addReview: (review: ServiceReview) => void

  // Notifications CRUD
  addNotification: (notification: Notification) => void
  markNotificationRead: (id: string) => void
}

export const StoreContext = createContext<Store | null>(null)

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
