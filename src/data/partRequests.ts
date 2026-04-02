import type { PartRequest } from '#/types/index';

export const partRequests: PartRequest[] = [
  {
    id: 'pr1',
    customerId: 'c2',
    partName: 'Timing Belt',
    notes: 'Need it for 2020 BMW 3 Series',
    createdAt: '2024-08-20T10:00:00Z',
  },
  {
    id: 'pr2',
    customerId: 'c5',
    partName: 'Radiator',
    notes: 'Old one is cracked, need replacement',
    createdAt: '2024-08-22T14:00:00Z',
  },
  {
    id: 'pr3',
    customerId: 'c1',
    partName: 'Alternator',
    notes: "Car won't start, think alternator is dead",
    createdAt: '2024-08-25T16:00:00Z',
  },
];
