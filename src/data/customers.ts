import type { Customer } from '#/types/index';

export const customers: Customer[] = [
  {
    id: 'c1',
    fullName: 'David Brown',
    email: 'david@example.com',
    phone: '555-1001',
    address: '123 Main St, Springfield',
    password: 'pass123',
    vehicles: [
      {
        id: 'v1',
        plateNumber: 'ABC-1234',
        make: 'Toyota',
        model: 'Camry',
        year: 2019,
      },
    ],
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'c2',
    fullName: 'Emma Wilson',
    email: 'emma@example.com',
    phone: '555-1002',
    address: '456 Oak Ave, Shelbyville',
    password: 'pass123',
    vehicles: [
      {
        id: 'v2',
        plateNumber: 'XYZ-5678',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
      },
      {
        id: 'v3',
        plateNumber: 'DEF-9012',
        make: 'BMW',
        model: '3 Series',
        year: 2020,
      },
    ],
    createdAt: '2024-02-20T11:00:00Z',
  },
  {
    id: 'c3',
    fullName: 'Frank Davis',
    email: 'frank@example.com',
    phone: '555-1003',
    address: '789 Pine Rd, Capital City',
    password: 'pass123',
    vehicles: [
      {
        id: 'v4',
        plateNumber: 'GHI-3456',
        make: 'Ford',
        model: 'F-150',
        year: 2022,
      },
    ],
    createdAt: '2024-03-10T09:00:00Z',
  },
  {
    id: 'c4',
    fullName: 'Grace Lee',
    email: 'grace@example.com',
    phone: '555-1004',
    address: '321 Elm St, Ogdenville',
    password: 'pass123',
    vehicles: [
      {
        id: 'v5',
        plateNumber: 'JKL-7890',
        make: 'Nissan',
        model: 'Altima',
        year: 2018,
      },
    ],
    createdAt: '2024-04-05T14:00:00Z',
  },
  {
    id: 'c5',
    fullName: 'Henry Kim',
    email: 'henry@example.com',
    phone: '555-1005',
    address: '654 Maple Dr, North Haverbrook',
    password: 'pass123',
    vehicles: [
      {
        id: 'v6',
        plateNumber: 'MNO-1234',
        make: 'Chevrolet',
        model: 'Malibu',
        year: 2020,
      },
    ],
    createdAt: '2024-05-12T16:00:00Z',
  },
];
