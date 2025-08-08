'use client'

import { createHash, createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto'

// Encryption configuration
const ALGORITHM = 'aes-256-gcm'
const SALT_LENGTH = 16
const IV_LENGTH = 16
const // TAG_LENGTH = 16
const ITERATIONS = 100000

interface EncryptedData {
  data: string
  iv: string
  tag: string
  salt: string
}

interface FieldEncryptionConfig {
  encrypt: boolean
  algorithm?: string
  keyDerivation?: boolean
}

// Data encryption service for sensitive healthcare information
export class DataEncryption {
  private static instance: DataEncryption
  private encryptionKey: Buffer | null = null

  public static getInstance(): DataEncryption {
    if (!DataEncryption.instance) {
      DataEncryption.instance = new DataEncryption()
    }
    return DataEncryption.instance
  }

  constructor() {
    this.initializeKey()
  }

  // Initialize encryption key from environment or generate
  private initializeKey(): void {
    const envKey = process.env.ENCRYPTION_KEY
    if (envKey) {
      this.encryptionKey = Buffer.from(envKey, 'hex')
    } else {
      // In production, this should always come from environment
      console.warn('No ENCRYPTION_KEY found in environment, using generated key')
      this.encryptionKey = randomBytes(32)
    }
  }

  // Derive key from password with salt
  private deriveKey(password: string, salt: Buffer): Buffer {
    return pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256')
  }

  // Encrypt sensitive data
  encrypt(plaintext: string, useKeyDerivation = false): EncryptedData {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized')
    }

    const salt = randomBytes(SALT_LENGTH)
    const iv = randomBytes(IV_LENGTH)
    
    let key = this.encryptionKey
    if (useKeyDerivation) {
      key = this.deriveKey(this.encryptionKey.toString('hex'), salt)
    }

    const cipher = createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()

    return {
      data: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: salt.toString('hex')
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData: EncryptedData, useKeyDerivation = false): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized')
    }

    const salt = Buffer.from(encryptedData.salt, 'hex')
    const iv = Buffer.from(encryptedData.iv, 'hex')
    const tag = Buffer.from(encryptedData.tag, 'hex')
    
    let key = this.encryptionKey
    if (useKeyDerivation) {
      key = this.deriveKey(this.encryptionKey.toString('hex'), salt)
    }

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  // Hash sensitive data (one-way)
  hash(data: string, salt?: string): { hash: string; salt: string } {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : randomBytes(16)
    const hash = createHash('sha256')
      .update(data)
      .update(saltBuffer)
      .digest('hex')
    
    return {
      hash,
      salt: saltBuffer.toString('hex')
    }
  }

  // Verify hashed data
  verifyHash(data: string, hash: string, salt: string): boolean {
    const computed = this.hash(data, salt)
    return computed.hash === hash
  }

  // Generate secure random token
  generateToken(length = 32): string {
    return randomBytes(length).toString('hex')
  }

  // Encrypt object fields selectively
  encryptObject<T extends Record<string, any>>(
    obj: T,
    config: Record<keyof T, FieldEncryptionConfig>
  ): T {
    const result = { ...obj }
    
    for (const [key, fieldConfig] of Object.entries(config)) {
      if (fieldConfig.encrypt && result[key]) {
        const encrypted = this.encrypt(
          String(result[key]), 
          fieldConfig.keyDerivation || false
        )
        result[key] = JSON.stringify(encrypted)
      }
    }
    
    return result
  }

  // Decrypt object fields selectively
  decryptObject<T extends Record<string, any>>(
    obj: T,
    config: Record<keyof T, FieldEncryptionConfig>
  ): T {
    const result = { ...obj }
    
    for (const [key, fieldConfig] of Object.entries(config)) {
      if (fieldConfig.encrypt && result[key]) {
        try {
          const encryptedData = JSON.parse(String(result[key])) as EncryptedData
          result[key] = this.decrypt(encryptedData, fieldConfig.keyDerivation || false)
        } catch (error) {
          console.error(`Failed to decrypt field ${key}:`, error)
          // Don't throw, just leave field as is for backward compatibility
        }
      }
    }
    
    return result
  }
}

// Healthcare-specific encryption configurations
export const HEALTHCARE_ENCRYPTION_CONFIG = {
  // Patient sensitive data
  patient: {
    ssn: { encrypt: true, keyDerivation: true },
    phone: { encrypt: true },
    address: { encrypt: true },
    emergency_contact: { encrypt: true },
    insurance_number: { encrypt: true, keyDerivation: true },
    medical_history: { encrypt: true },
    allergies: { encrypt: true },
    current_medications: { encrypt: true }
  },

  // Prescription data
  prescription: {
    medication_details: { encrypt: true },
    dosage_instructions: { encrypt: true },
    pharmacy_notes: { encrypt: true }
  },

  // Medical records
  medical_record: {
    diagnosis: { encrypt: true },
    treatment_notes: { encrypt: true },
    lab_results: { encrypt: true },
    vital_signs: { encrypt: true },
    symptoms: { encrypt: true }
  },

  // Financial information
  billing: {
    payment_method: { encrypt: true },
    insurance_details: { encrypt: true },
    financial_notes: { encrypt: true }
  },

  // User credentials (additional protection)
  user: {
    two_factor_backup_codes: { encrypt: true, keyDerivation: true },
    security_questions: { encrypt: true },
    recovery_codes: { encrypt: true, keyDerivation: true }
  }
}

// Field-level encryption utilities
export class FieldEncryption {
  private static encryption = DataEncryption.getInstance()

  // Encrypt patient sensitive fields before database insertion
  static encryptPatientData(patientData: any): any {
    return this.encryption.encryptObject(
      patientData, 
      HEALTHCARE_ENCRYPTION_CONFIG.patient
    )
  }

  // Decrypt patient sensitive fields after database retrieval
  static decryptPatientData(patientData: any): any {
    return this.encryption.decryptObject(
      patientData, 
      HEALTHCARE_ENCRYPTION_CONFIG.patient
    )
  }

  // Encrypt prescription data
  static encryptPrescriptionData(prescriptionData: any): any {
    return this.encryption.encryptObject(
      prescriptionData, 
      HEALTHCARE_ENCRYPTION_CONFIG.prescription
    )
  }

  // Decrypt prescription data
  static decryptPrescriptionData(prescriptionData: any): any {
    return this.encryption.decryptObject(
      prescriptionData, 
      HEALTHCARE_ENCRYPTION_CONFIG.prescription
    )
  }

  // Encrypt medical records
  static encryptMedicalRecord(recordData: any): any {
    return this.encryption.encryptObject(
      recordData, 
      HEALTHCARE_ENCRYPTION_CONFIG.medical_record
    )
  }

  // Decrypt medical records
  static decryptMedicalRecord(recordData: any): any {
    return this.encryption.decryptObject(
      recordData, 
      HEALTHCARE_ENCRYPTION_CONFIG.medical_record
    )
  }

  // Encrypt billing information
  static encryptBillingData(billingData: any): any {
    return this.encryption.encryptObject(
      billingData, 
      HEALTHCARE_ENCRYPTION_CONFIG.billing
    )
  }

  // Decrypt billing information
  static decryptBillingData(billingData: any): any {
    return this.encryption.decryptObject(
      billingData, 
      HEALTHCARE_ENCRYPTION_CONFIG.billing
    )
  }

  // Encrypt user security data
  static encryptUserSecurityData(userData: any): any {
    return this.encryption.encryptObject(
      userData, 
      HEALTHCARE_ENCRYPTION_CONFIG.user
    )
  }

  // Decrypt user security data
  static decryptUserSecurityData(userData: any): any {
    return this.encryption.decryptObject(
      userData, 
      HEALTHCARE_ENCRYPTION_CONFIG.user
    )
  }
}

// Data anonymization for analytics and reporting
export class DataAnonymization {
  private static encryption = DataEncryption.getInstance()

  // Anonymize patient data for analytics
  static anonymizePatient(patientData: any): any {
    const anonymized = { ...patientData }
    
    // Replace identifiers with hashed versions
    if (anonymized.ssn) {
      anonymized.patient_hash = this.encryption.hash(anonymized.ssn).hash
      delete anonymized.ssn
    }
    
    if (anonymized.full_name) {
      anonymized.name_hash = this.encryption.hash(anonymized.full_name).hash
      delete anonymized.full_name
    }
    
    if (anonymized.email) {
      anonymized.email_hash = this.encryption.hash(anonymized.email).hash
      delete anonymized.email
    }
    
    if (anonymized.phone) {
      delete anonymized.phone
    }
    
    if (anonymized.address) {
      delete anonymized.address
    }
    
    // Keep only necessary fields for analytics
    return {
      id: anonymized.id,
      patient_hash: anonymized.patient_hash,
      age_group: this.getAgeGroup(anonymized.date_of_birth),
      gender: anonymized.gender,
      visit_count: anonymized.visit_count || 0,
      created_at: anonymized.created_at,
      last_visit: anonymized.last_visit
    }
  }

  // Create age groups instead of exact ages
  private static getAgeGroup(dateOfBirth: string): string {
    const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear()
    
    if (age < 18) return '0-17'
    if (age < 30) return '18-29'
    if (age < 50) return '30-49'
    if (age < 65) return '50-64'
    return '65+'
  }

  // Anonymize medical records for research
  static anonymizeMedicalRecord(recordData: any): any {
    const anonymized = { ...recordData }
    
    // Remove direct identifiers
    delete anonymized.patient_id
    delete anonymized.doctor_id
    
    // Hash any remaining identifiers
    if (anonymized.record_id) {
      anonymized.record_hash = this.encryption.hash(anonymized.record_id).hash
      delete anonymized.record_id
    }
    
    // Generalize dates to months
    if (anonymized.created_at) {
      const date = new Date(anonymized.created_at)
      anonymized.created_month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      delete anonymized.created_at
    }
    
    return anonymized
  }
}

// Export singleton instance
export const dataEncryption = DataEncryption.getInstance()