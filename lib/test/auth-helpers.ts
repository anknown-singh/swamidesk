import { vi } from 'vitest'
import type { UserProfile } from '@/lib/types'

export const TEST_USERS: Record<string, UserProfile> = {
  admin: {
    id: 'admin-test-id',
    email: 'admin@test.com',
    role: 'admin',
    full_name: 'Test Admin',
    phone: '+91-9999999999',
    department: null,
    specialization: null,
    password_hash: 'test-hash',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  doctor: {
    id: 'doctor-test-id',
    email: 'doctor@test.com',
    role: 'doctor',
    full_name: 'Dr. Test Physician',
    phone: '+91-8888888888',
    department: 'cardiology',
    specialization: 'Cardiology',
    password_hash: 'test-hash',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  receptionist: {
    id: 'receptionist-test-id',
    email: 'receptionist@test.com',
    role: 'receptionist',
    full_name: 'Test Receptionist',
    phone: '+91-7777777777',
    department: null,
    specialization: null,
    password_hash: 'test-hash',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  attendant: {
    id: 'attendant-test-id',
    email: 'attendant@test.com',
    role: 'attendant',
    full_name: 'Test Attendant',
    phone: '+91-6666666666',
    department: null,
    specialization: null,
    password_hash: 'test-hash',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  pharmacist: {
    id: 'pharmacist-test-id',
    email: 'pharmacist@test.com',
    role: 'pharmacist',
    full_name: 'Test Pharmacist',
    phone: '+91-5555555555',
    department: 'pharmacy',
    specialization: null,
    password_hash: 'test-hash',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  }
}

export const ROLE_DASHBOARDS = {
  admin: '/admin/dashboard',
  doctor: '/doctor/dashboard',
  receptionist: '/receptionist/dashboard',
  attendant: '/attendant/dashboard',
  service_attendant: '/attendant/dashboard',
  pharmacist: '/pharmacy/dashboard'
} as const

export const ROLE_PERMISSIONS = {
  admin: [
    '/admin/*', '/doctor/*', '/receptionist/*', 
    '/attendant/*', '/pharmacy/*'
  ],
  doctor: ['/doctor/*'],
  receptionist: ['/receptionist/*'],
  attendant: ['/attendant/*'],
  service_attendant: ['/attendant/*'],
  pharmacist: ['/pharmacy/*']
} as const

// Mock authentication context
export const createMockAuthContext = (user: UserProfile | null = null) => ({
  user,
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  getUserProfile: vi.fn(() => Promise.resolve(user)),
})

// Mock auth hook for testing
export const mockUseAuth = (role?: keyof typeof TEST_USERS) => {
  const user = role ? TEST_USERS[role] : null
  
  return {
    user,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    getUserProfile: vi.fn(() => Promise.resolve(user)),
  }
}

// Helper to test role-based access
export const testRoleAccess = (
  userRole: keyof typeof TEST_USERS,
  attemptedPath: string
): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole]
  return permissions.some(permission => {
    if (permission.endsWith('/*')) {
      const basePath = permission.slice(0, -1)
      return attemptedPath.startsWith(basePath)
    }
    return attemptedPath === permission
  })
}

// Mock session for different roles
export const createMockSession = (role: keyof typeof TEST_USERS) => {
  const user = TEST_USERS[role]
  
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user: {
      id: user.id,
      email: user.email,
      aud: 'authenticated',
      role: 'authenticated',
      created_at: user.created_at,
      updated_at: user.created_at,
      user_metadata: {
        role: user.role,
        full_name: user.full_name
      },
      app_metadata: {},
      identities: [],
      phone: user.phone,
      email_confirmed_at: user.created_at,
      phone_confirmed_at: null,
      confirmed_at: user.created_at,
      last_sign_in_at: new Date().toISOString(),
      recovery_sent_at: null,
    }
  }
}

// Helper for testing authentication flows
export const mockAuthFlow = {
  signIn: (email: string, password: string) => {
    // Find user by email
    const user = Object.values(TEST_USERS).find(u => u.email === email)
    
    if (!user || password !== 'password123') {
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      }
    }
    
    return {
      data: {
        user: user,
        session: createMockSession(user.role as keyof typeof TEST_USERS)
      },
      error: null
    }
  },
  
  signOut: () => ({
    error: null
  }),
  
  getSession: (role?: keyof typeof TEST_USERS) => {
    if (!role) {
      return { data: { session: null }, error: null }
    }
    
    return {
      data: { session: createMockSession(role) },
      error: null
    }
  }
}

// Helper to setup authenticated test environment
export const setupAuthenticatedTest = (role: keyof typeof TEST_USERS) => {
  const user = TEST_USERS[role]
  const session = createMockSession(role)
  
  // Mock Next.js useRouter to return expected dashboard
  const mockUseRouter = vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }))
  
  const mockUsePathname = vi.fn(() => ROLE_DASHBOARDS[role])
  
  vi.doMock('next/navigation', () => ({
    useRouter: mockUseRouter,
    usePathname: mockUsePathname,
    useSearchParams: vi.fn(() => new URLSearchParams()),
  }))
  
  return { user, session }
}