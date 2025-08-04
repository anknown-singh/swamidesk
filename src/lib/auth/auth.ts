import { User } from '@/lib/types';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@swamidesk.com',
    name: 'System Administrator',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    email: 'dr.smith@swamidesk.com',
    name: 'Dr. John Smith',
    role: 'doctor',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    email: 'patient@swamidesk.com',
    name: 'Jane Doe',
    role: 'patient',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    email: 'receptionist@swamidesk.com',
    name: 'Mary Johnson',
    role: 'receptionist',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  // Mock authentication - replace with real authentication logic
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const user = mockUsers.find(u => u.email === email);
  if (user && password === 'password') {
    return user;
  }
  
  return null;
};

export const getCurrentUser = (): User | null => {
  // Mock function to get current user - replace with real implementation
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }
  return null;
};

export const logout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
};