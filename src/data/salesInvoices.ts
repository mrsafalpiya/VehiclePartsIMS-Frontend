import type { SalesInvoice } from '#/types/index';

export const salesInvoices: SalesInvoice[] = [
  {
    id: 'si1',
    customerId: 'c1',
    date: '2024-07-10T14:00:00Z',
    lineItems: [
      { partId: 'p1', quantity: 4, unitSellingPrice: 15.99, lineTotal: 63.96 },
      { partId: 'p2', quantity: 1, unitSellingPrice: 12.50, lineTotal: 12.50 },
    ],
    subtotal: 76.46,
    discount: 0,
    finalTotal: 76.46,
    paymentStatus: 'paid',
  },
  {
    id: 'si2',
    customerId: 'c2',
    date: '2024-07-12T10:00:00Z',
    lineItems: [
      { partId: 'p3', quantity: 1, unitSellingPrice: 45.00, lineTotal: 45.00 },
    ],
    subtotal: 45.00,
    discount: 5.00,
    finalTotal: 40.00,
    paymentStatus: 'paid',
  },
  {
    id: 'si3',
    customerId: 'c3',
    date: '2024-07-15T09:00:00Z',
    lineItems: [
      { partId: 'p6', quantity: 1, unitSellingPrice: 120.00, lineTotal: 120.00 },
      { partId: 'p4', quantity: 1, unitSellingPrice: 22.00, lineTotal: 22.00 },
    ],
    subtotal: 142.00,
    discount: 0,
    finalTotal: 142.00,
    paymentStatus: 'unpaid',
  },
  {
    id: 'si4',
    customerId: 'c1',
    date: '2024-08-01T11:00:00Z',
    lineItems: [
      { partId: 'p5', quantity: 1, unitSellingPrice: 38.00, lineTotal: 38.00 },
      { partId: 'p7', quantity: 1, unitSellingPrice: 24.99, lineTotal: 24.99 },
    ],
    subtotal: 62.99,
    discount: 0,
    finalTotal: 62.99,
    paymentStatus: 'unpaid',
  },
  {
    id: 'si5',
    customerId: 'c4',
    date: '2024-08-05T15:00:00Z',
    lineItems: [
      { partId: 'p8', quantity: 1, unitSellingPrice: 18.00, lineTotal: 18.00 },
      { partId: 'p9', quantity: 1, unitSellingPrice: 16.00, lineTotal: 16.00 },
    ],
    subtotal: 34.00,
    discount: 0,
    finalTotal: 34.00,
    paymentStatus: 'paid',
  },
  {
    id: 'si6',
    customerId: 'c5',
    date: '2024-08-10T13:00:00Z',
    lineItems: [
      { partId: 'p10', quantity: 2, unitSellingPrice: 14.50, lineTotal: 29.00 },
    ],
    subtotal: 29.00,
    discount: 2.00,
    finalTotal: 27.00,
    paymentStatus: 'unpaid',
  },
];
