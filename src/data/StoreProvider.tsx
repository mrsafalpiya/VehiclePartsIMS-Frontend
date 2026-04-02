import { useState, type ReactNode } from 'react'
import { StoreContext, type Store } from '#/data/store'
import type { Notification } from '#/types/index'
import { users as initialUsers } from '#/data/users'
import { customers as initialCustomers } from '#/data/customers'
import { vendors as initialVendors } from '#/data/vendors'
import { parts as initialParts } from '#/data/parts'
import { purchaseInvoices as initialPurchaseInvoices } from '#/data/purchaseInvoices'
import { salesInvoices as initialSalesInvoices } from '#/data/salesInvoices'
import { appointments as initialAppointments } from '#/data/appointments'
import { partRequests as initialPartRequests } from '#/data/partRequests'
import { reviews as initialReviews } from '#/data/reviews'

export function StoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState(initialUsers)
  const [customers, setCustomers] = useState(initialCustomers)
  const [vendors, setVendors] = useState(initialVendors)
  const [parts, setParts] = useState(initialParts)
  const [purchaseInvoices, setPurchaseInvoices] = useState(initialPurchaseInvoices)
  const [salesInvoices, setSalesInvoices] = useState(initialSalesInvoices)
  const [appointments, setAppointments] = useState(initialAppointments)
  const [partRequests, setPartRequests] = useState(initialPartRequests)
  const [reviews, setReviews] = useState(initialReviews)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const storeValue: Store = {
    // Entities
    users,
    customers,
    vendors,
    parts,
    purchaseInvoices,
    salesInvoices,
    appointments,
    partRequests,
    reviews,
    notifications,

    // Users CRUD
    addUser: (user) => setUsers((prev) => [...prev, user]),
    updateUser: (id, updates) =>
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u))),
    deleteUser: (id) => setUsers((prev) => prev.filter((u) => u.id !== id)),

    // Customers CRUD
    addCustomer: (customer) => setCustomers((prev) => [...prev, customer]),
    updateCustomer: (id, updates) =>
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c))),
    deleteCustomer: (id) => setCustomers((prev) => prev.filter((c) => c.id !== id)),

    // Vendors CRUD
    addVendor: (vendor) => setVendors((prev) => [...prev, vendor]),
    updateVendor: (id, updates) =>
      setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v))),
    deleteVendor: (id) => setVendors((prev) => prev.filter((v) => v.id !== id)),

    // Parts CRUD
    addPart: (part) => setParts((prev) => [...prev, part]),
    updatePart: (id, updates) =>
      setParts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p))),
    deletePart: (id) => setParts((prev) => prev.filter((p) => p.id !== id)),

    // Purchase Invoices CRUD
    addPurchaseInvoice: (invoice) => setPurchaseInvoices((prev) => [...prev, invoice]),
    updatePurchaseInvoice: (id, updates) =>
      setPurchaseInvoices((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      ),

    // Sales Invoices CRUD
    addSalesInvoice: (invoice) => setSalesInvoices((prev) => [...prev, invoice]),
    updateSalesInvoice: (id, updates) =>
      setSalesInvoices((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      ),

    // Appointments CRUD
    addAppointment: (appointment) => setAppointments((prev) => [...prev, appointment]),
    updateAppointment: (id, updates) =>
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      ),

    // Part Requests CRUD
    addPartRequest: (request) => setPartRequests((prev) => [...prev, request]),
    deletePartRequest: (id) => setPartRequests((prev) => prev.filter((r) => r.id !== id)),

    // Reviews CRUD
    addReview: (review) => setReviews((prev) => [...prev, review]),

    // Notifications CRUD
    addNotification: (notification) => setNotifications((prev) => [...prev, notification]),
    markNotificationRead: (id) =>
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      ),
  }

  return (
    <StoreContext.Provider value={storeValue}>
      {children}
    </StoreContext.Provider>
  )
}
