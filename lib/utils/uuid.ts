/**
 * UUID utilities for consistent UUID handling across the application
 */

/**
 * Generates a valid v4 UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validates if a string is a valid UUID format
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Returns a valid UUID, either the provided one or a fallback
 */
export function ensureValidUUID(uuid?: string | null): string {
  if (uuid && isValidUUID(uuid)) {
    return uuid;
  }
  // Return null UUID pattern as fallback
  return '00000000-0000-0000-0000-000000000000';
}

/**
 * Gets current user ID from Supabase or returns a valid fallback UUID
 */
export async function getCurrentUserIdOrFallback(supabase: any): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return ensureValidUUID(user?.id);
  } catch (error) {
    console.warn('Could not get current user ID, using fallback UUID:', error);
    return ensureValidUUID(null);
  }
}

// Test/Mock UUIDs - use these for consistent testing
export const TEST_UUIDS = {
  USER_1: '11111111-1111-1111-1111-111111111111',
  USER_2: '22222222-2222-2222-2222-222222222222',
  ADMIN_USER: '00000000-0000-0000-0000-000000000000',
  DOCTOR_1: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  DOCTOR_2: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  PATIENT_1: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  PATIENT_2: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  RECEPTIONIST: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  E2E_USER: 'ffffffff-ffff-ffff-ffff-ffffffffffff'
} as const;