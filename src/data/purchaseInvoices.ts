import type { PurchaseInvoice } from '#/types/index';

export const purchaseInvoices: PurchaseInvoice[] = [
  {
    id: 'pi1',
    vendorId: 'vnd1',
    date: '2024-06-01T10:00:00Z',
    lineItems: [
      { partId: 'p1', quantity: 20, unitCostPrice: 8.00 },
      { partId: 'p2', quantity: 20, unitCostPrice: 6.00 },
    ],
    total: 280.00,
  },
  {
    id: 'pi2',
    vendorId: 'vnd2',
    date: '2024-06-15T10:00:00Z',
    lineItems: [
      { partId: 'p3', quantity: 10, unitCostPrice: 22.00 },
      { partId: 'p5', quantity: 10, unitCostPrice: 18.00 },
    ],
    total: 400.00,
  },
  {
    id: 'pi3',
    vendorId: 'vnd3',
    date: '2024-07-01T10:00:00Z',
    lineItems: [
      { partId: 'p6', quantity: 5, unitCostPrice: 60.00 },
      { partId: 'p7', quantity: 10, unitCostPrice: 12.00 },
    ],
    total: 420.00,
  },
];
