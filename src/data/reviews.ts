import type { ServiceReview } from '#/types/index';

export const reviews: ServiceReview[] = [
  {
    id: 'rv1',
    customerId: 'c1',
    rating: 5,
    comment: 'Excellent service! Very professional and fast.',
    createdAt: '2024-07-15T10:00:00Z',
  },
  {
    id: 'rv2',
    customerId: 'c2',
    rating: 4,
    comment: 'Good work on my car, pricing is fair.',
    createdAt: '2024-07-20T11:00:00Z',
  },
  {
    id: 'rv3',
    customerId: 'c3',
    rating: 3,
    comment: 'Average experience, took longer than expected.',
    createdAt: '2024-08-05T09:00:00Z',
  },
  {
    id: 'rv4',
    customerId: 'c4',
    rating: 5,
    comment: 'Amazing team! Will definitely come back.',
    createdAt: '2024-08-10T15:00:00Z',
  },
];
