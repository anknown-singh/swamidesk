'use client'

import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

// Input validation types
interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitized?: any
}

interface ValidationRule {
  required?: boolean
  type?: 'string' | 'number' | 'email' | 'phone' | 'date' | 'array' | 'object'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  customValidator?: (value: any) => string | null
  sanitize?: boolean
  allowedValues?: string[]
}

interface ValidationSchema {
  [key: string]: ValidationRule
}

// Enhanced input validation and sanitization
export class InputValidator {
  private static instance: InputValidator

  public static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator()
    }
    return InputValidator.instance
  }

  // Validate single field
  validateField(value: any, rule: ValidationRule, fieldName: string): ValidationResult {
    const errors: string[] = []
    let sanitizedValue = value

    // Required field check
    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push(`${fieldName} is required`)
      return { isValid: false, errors }
    }

    // Skip further validation if field is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return { isValid: true, errors: [], sanitized: value }
    }

    // Type validation and sanitization
    switch (rule.type) {
      case 'string':
        sanitizedValue = this.validateString(value, rule, fieldName, errors)
        break
      case 'number':
        sanitizedValue = this.validateNumber(value, rule, fieldName, errors)
        break
      case 'email':
        sanitizedValue = this.validateEmail(value, rule, fieldName, errors)
        break
      case 'phone':
        sanitizedValue = this.validatePhone(value, rule, fieldName, errors)
        break
      case 'date':
        sanitizedValue = this.validateDate(value, rule, fieldName, errors)
        break
      case 'array':
        sanitizedValue = this.validateArray(value, rule, fieldName, errors)
        break
      case 'object':
        sanitizedValue = this.validateObject(value, rule, fieldName, errors)
        break
    }

    // Custom validation
    if (rule.customValidator && errors.length === 0) {
      const customError = rule.customValidator(sanitizedValue)
      if (customError) {
        errors.push(customError)
      }
    }

    // Allowed values check
    if (rule.allowedValues && !rule.allowedValues.includes(sanitizedValue)) {
      errors.push(`${fieldName} must be one of: ${rule.allowedValues.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: sanitizedValue
    }
  }

  // Validate object against schema
  validateSchema(data: any, schema: ValidationSchema): ValidationResult {
    const errors: string[] = []
    const sanitized: any = {}

    // Validate each field in schema
    for (const [fieldName, rule] of Object.entries(schema)) {
      const fieldResult = this.validateField(data[fieldName], rule, fieldName)
      
      if (!fieldResult.isValid) {
        errors.push(...fieldResult.errors)
      } else {
        sanitized[fieldName] = fieldResult.sanitized
      }
    }

    // Check for unexpected fields
    for (const key of Object.keys(data)) {
      if (!schema[key]) {
        errors.push(`Unexpected field: ${key}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    }
  }

  // String validation and sanitization
  private validateString(value: any, rule: ValidationRule, fieldName: string, errors: string[]): string {
    let stringValue = String(value)

    // Sanitize HTML if requested
    if (rule.sanitize) {
      stringValue = DOMPurify.sanitize(stringValue, { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [] 
      })
    }

    // Length validation
    if (rule.minLength !== undefined && stringValue.length < rule.minLength) {
      errors.push(`${fieldName} must be at least ${rule.minLength} characters`)
    }
    
    if (rule.maxLength !== undefined && stringValue.length > rule.maxLength) {
      errors.push(`${fieldName} must not exceed ${rule.maxLength} characters`)
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      errors.push(`${fieldName} format is invalid`)
    }

    // XSS prevention
    if (this.containsScript(stringValue)) {
      errors.push(`${fieldName} contains invalid characters`)
      stringValue = stringValue.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    }

    return stringValue.trim()
  }

  // Number validation
  private validateNumber(value: any, rule: ValidationRule, fieldName: string, errors: string[]): number {
    const numValue = Number(value)

    if (isNaN(numValue)) {
      errors.push(`${fieldName} must be a valid number`)
      return 0
    }

    if (rule.min !== undefined && numValue < rule.min) {
      errors.push(`${fieldName} must be at least ${rule.min}`)
    }

    if (rule.max !== undefined && numValue > rule.max) {
      errors.push(`${fieldName} must not exceed ${rule.max}`)
    }

    return numValue
  }

  // Email validation
  private validateEmail(value: any, _rule: ValidationRule, fieldName: string, errors: string[]): string {
    const emailValue = String(value).toLowerCase().trim()

    if (!validator.isEmail(emailValue)) {
      errors.push(`${fieldName} must be a valid email address`)
    }

    // Additional email security checks
    if (this.containsMaliciousPatterns(emailValue)) {
      errors.push(`${fieldName} contains invalid characters`)
    }

    return emailValue
  }

  // Phone validation
  private validatePhone(value: any, _rule: ValidationRule, fieldName: string, errors: string[]): string {
    let phoneValue = String(value).replace(/\D/g, '') // Remove non-digits

    // Basic phone validation (adjust for your region)
    if (phoneValue.length < 10 || phoneValue.length > 15) {
      errors.push(`${fieldName} must be a valid phone number`)
    }

    return phoneValue
  }

  // Date validation
  private validateDate(value: any, _rule: ValidationRule, fieldName: string, errors: string[]): string {
    const dateValue = String(value)

    if (!validator.isISO8601(dateValue) && !validator.isDate(dateValue)) {
      errors.push(`${fieldName} must be a valid date`)
    }

    return dateValue
  }

  // Array validation
  private validateArray(value: any, rule: ValidationRule, fieldName: string, errors: string[]): any[] {
    if (!Array.isArray(value)) {
      errors.push(`${fieldName} must be an array`)
      return []
    }

    if (rule.minLength !== undefined && value.length < rule.minLength) {
      errors.push(`${fieldName} must contain at least ${rule.minLength} items`)
    }

    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      errors.push(`${fieldName} must not contain more than ${rule.maxLength} items`)
    }

    return value
  }

  // Object validation
  private validateObject(value: any, _rule: ValidationRule, fieldName: string, errors: string[]): any {
    if (typeof value !== 'object' || value === null) {
      errors.push(`${fieldName} must be an object`)
      return {}
    }

    return value
  }

  // Security checks
  private containsScript(value: string): boolean {
    const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
    const onEventPattern = /\bon\w+\s*=/gi
    const jsProtocolPattern = /javascript:/gi
    
    return scriptPattern.test(value) || onEventPattern.test(value) || jsProtocolPattern.test(value)
  }

  private containsMaliciousPatterns(value: string): boolean {
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /data:text\/html/i
    ]

    return maliciousPatterns.some(pattern => pattern.test(value))
  }

  // Sanitize HTML content
  sanitizeHtml(html: string, allowedTags: string[] = []): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
      ALLOW_DATA_ATTR: false
    })
  }

  // SQL injection prevention (basic check)
  preventSqlInjection(value: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /[';]--/,
      /\/\*[\s\S]*?\*\//,
      /\b(OR|AND)\s+\d+\s*=\s*\d+/i
    ]

    return sqlPatterns.some(pattern => pattern.test(value))
  }
}

// Healthcare-specific validation schemas
export const HEALTHCARE_VALIDATION_SCHEMAS = {
  // Patient data validation
  patient: {
    full_name: {
      required: true,
      type: 'string' as const,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s.'-]+$/,
      sanitize: true
    },
    email: {
      required: true,
      type: 'email' as const,
      maxLength: 255
    },
    phone: {
      required: true,
      type: 'phone' as const
    },
    date_of_birth: {
      required: true,
      type: 'date' as const,
      customValidator: (value: string) => {
        const birthDate = new Date(value)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        
        if (age < 0 || age > 150) {
          return 'Date of birth must result in a valid age'
        }
        return null
      }
    },
    gender: {
      required: true,
      type: 'string' as const,
      allowedValues: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    ssn: {
      type: 'string' as const,
      pattern: /^\d{3}-?\d{2}-?\d{4}$/,
      customValidator: (value: string) => {
        // Basic SSN validation (US format)
        const cleanSSN = value.replace(/-/g, '')
        if (cleanSSN.length !== 9) {
          return 'SSN must be 9 digits'
        }
        return null
      }
    },
    address: {
      type: 'string' as const,
      maxLength: 500,
      sanitize: true
    },
    emergency_contact_name: {
      type: 'string' as const,
      maxLength: 100,
      pattern: /^[a-zA-Z\s.'-]+$/,
      sanitize: true
    },
    emergency_contact_phone: {
      type: 'phone' as const
    },
    insurance_number: {
      type: 'string' as const,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9-]+$/
    },
    allergies: {
      type: 'string' as const,
      maxLength: 1000,
      sanitize: true
    },
    current_medications: {
      type: 'string' as const,
      maxLength: 1000,
      sanitize: true
    }
  },

  // Prescription validation
  prescription: {
    patient_id: {
      required: true,
      type: 'string' as const,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    },
    doctor_id: {
      required: true,
      type: 'string' as const,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    },
    medications: {
      required: true,
      type: 'array' as const,
      minLength: 1,
      maxLength: 20
    },
    dosage_instructions: {
      required: true,
      type: 'string' as const,
      maxLength: 1000,
      sanitize: true
    },
    duration_days: {
      required: true,
      type: 'number' as const,
      min: 1,
      max: 365
    },
    refills_allowed: {
      type: 'number' as const,
      min: 0,
      max: 12
    }
  },

  // Appointment validation
  appointment: {
    patient_id: {
      required: true,
      type: 'string' as const,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    },
    doctor_id: {
      required: true,
      type: 'string' as const,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    },
    appointment_date: {
      required: true,
      type: 'date' as const,
      customValidator: (value: string) => {
        const appointmentDate = new Date(value)
        const today = new Date()
        
        if (appointmentDate < today) {
          return 'Appointment date cannot be in the past'
        }
        return null
      }
    },
    appointment_time: {
      required: true,
      type: 'string' as const,
      pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    reason: {
      required: true,
      type: 'string' as const,
      minLength: 5,
      maxLength: 500,
      sanitize: true
    },
    notes: {
      type: 'string' as const,
      maxLength: 1000,
      sanitize: true
    }
  },

  // Medical record validation
  medical_record: {
    patient_id: {
      required: true,
      type: 'string' as const,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    },
    doctor_id: {
      required: true,
      type: 'string' as const,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    },
    diagnosis: {
      required: true,
      type: 'string' as const,
      minLength: 5,
      maxLength: 1000,
      sanitize: true
    },
    treatment_plan: {
      type: 'string' as const,
      maxLength: 2000,
      sanitize: true
    },
    symptoms: {
      type: 'string' as const,
      maxLength: 1000,
      sanitize: true
    },
    vital_signs: {
      type: 'object' as const
    },
    lab_results: {
      type: 'string' as const,
      maxLength: 2000,
      sanitize: true
    }
  },

  // User registration validation
  user_registration: {
    email: {
      required: true,
      type: 'email' as const,
      maxLength: 255
    },
    password: {
      required: true,
      type: 'string' as const,
      minLength: 8,
      maxLength: 128,
      customValidator: (value: string) => {
        // Strong password requirements
        const hasUpper = /[A-Z]/.test(value)
        const hasLower = /[a-z]/.test(value)
        const hasNumber = /\d/.test(value)
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value)
        
        if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
          return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }
        return null
      }
    },
    full_name: {
      required: true,
      type: 'string' as const,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s.'-]+$/,
      sanitize: true
    },
    role: {
      required: true,
      type: 'string' as const,
      allowedValues: ['doctor', 'nurse', 'receptionist', 'pharmacist', 'admin', 'attendant']
    }
  }
}

// Rate limiting for validation attempts
export class ValidationRateLimit {
  private static attempts = new Map<string, { count: number; resetTime: number }>()
  private static maxAttempts = 10
  private static windowMs = 60000 // 1 minute

  static isRateLimited(identifier: string): boolean {
    const now = Date.now()
    const attempt = this.attempts.get(identifier)

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs })
      return false
    }

    if (attempt.count >= this.maxAttempts) {
      return true
    }

    attempt.count++
    return false
  }

  static reset(identifier: string): void {
    this.attempts.delete(identifier)
  }
}

// Export singleton instance
export const inputValidator = InputValidator.getInstance()