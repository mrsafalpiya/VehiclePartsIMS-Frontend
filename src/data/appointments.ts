import type { Appointment } from '#/types/index';

export const appointments: Appointment[] = [
  {
    id: 'apt1',
    customerId: 'c1',
    preferredDate: '2024-09-01',
    preferredTime: '10:00 AM',
    status: 'completed',
    createdAt: '2024-08-25T10:00:00Z',
  },
  {
    id: 'apt2',
    customerId: 'c2',
    preferredDate: '2024-09-05',
    preferredTime: '02:00 PM',
    status: 'confirmed',
    createdAt: '2024-08-28T09:00:00Z',
  },
  {
    id: 'apt3',
    customerId: 'c3',
    preferredDate: '2024-09-10',
    preferredTime: '11:00 AM',
    status: 'pending',
    createdAt: '2024-09-01T14:00:00Z',
  },
  {
    id: 'apt4',
    customerId: 'c4',
    preferredDate: '2024-09-03',
    preferredTime: '09:00 AM',
    status: 'cancelled',
    createdAt: '2024-08-30T11:00:00Z',
  },
];
