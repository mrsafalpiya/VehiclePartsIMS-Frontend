import type { User } from '#/types/index';

export const users: User[] = [
  {
    id: 'u1',
    fullName: 'Alice Admin',
    email: 'admin@garage.com',
    phone: '555-0001',
    role: 'admin',
    password: 'admin123',
  },
  {
    id: 'u2',
    fullName: 'Bob Staff',
    email: 'bob@garage.com',
    phone: '555-0002',
    role: 'staff',
    password: 'staff123',
  },
  {
    id: 'u3',
    fullName: 'Carol Staff',
    email: 'carol@garage.com',
    phone: '555-0003',
    role: 'staff',
    password: 'staff123',
  },
];
