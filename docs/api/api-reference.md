# SwamIDesk API Reference

> **Complete REST API documentation for SwamIDesk healthcare management system**

## 📚 Overview

The SwamIDesk API provides RESTful endpoints for healthcare management operations. It supports JSON data exchange and implements comprehensive authentication and authorization.

### Base URL
```
Production: https://api.swamidesk.com/v1
Development: http://localhost:3000/api/v1
```

### API Versioning
Current version: `v1`
- All endpoints are prefixed with `/api/v1`
- API versions are maintained for backward compatibility

## 🔐 Authentication

### Authentication Methods

#### Bearer Token Authentication
```http
Authorization: Bearer <your-jwt-token>
```

#### API Key Authentication
```http
X-API-Key: <your-api-key>
```

### Getting Authentication Token
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "doctor"
  }
}
```

## 👥 Users API

### Get Current User
```http
GET /users/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "user-123",
  "email": "doctor@clinic.com",
  "fullName": "Dr. John Smith",
  "role": "doctor",
  "department": "cardiology",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### List Users (Admin Only)
```http
GET /users?page=1&limit=20&role=doctor
Authorization: Bearer <admin-token>
```

### Create User (Admin Only)
```http
POST /users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "newuser@clinic.com",
  "fullName": "Dr. Jane Doe",
  "role": "doctor",
  "department": "pediatrics",
  "password": "temporary123"
}
```

### Update User
```http
PUT /users/{userId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Dr. John Smith Jr.",
  "department": "cardiology"
}
```

### Delete User (Admin Only)
```http
DELETE /users/{userId}
Authorization: Bearer <admin-token>
```

## 🏥 Patients API

### List Patients
```http
GET /patients?page=1&limit=20&search=john&status=active
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `search` - Search by name, phone, or email
- `status` - Filter by status (active, inactive)
- `gender` - Filter by gender
- `ageMin`, `ageMax` - Filter by age range

**Response:**
```json
{
  "data": [
    {
      "id": "patient-123",
      "fullName": "John Doe",
      "dateOfBirth": "1990-01-01",
      "gender": "male",
      "phone": "+1234567890",
      "email": "john@example.com",
      "address": {
        "street": "123 Main St",
        "city": "Anytown",
        "state": "ST",
        "zipCode": "12345"
      },
      "emergencyContact": {
        "name": "Jane Doe",
        "phone": "+0987654321",
        "relationship": "spouse"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Get Patient by ID
```http
GET /patients/{patientId}
Authorization: Bearer <token>
```

### Create Patient
```http
POST /patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "phone": "+1234567890",
  "email": "john@example.com",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "ST",
    "zipCode": "12345"
  },
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+0987654321",
    "relationship": "spouse"
  },
  "insurance": {
    "provider": "Health Insurance Co",
    "policyNumber": "POL123456",
    "groupNumber": "GRP789"
  },
  "medicalHistory": {
    "allergies": ["penicillin", "shellfish"],
    "medications": ["lisinopril 10mg"],
    "conditions": ["hypertension"]
  }
}
```

### Update Patient
```http
PUT /patients/{patientId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "+1234567891",
  "email": "newemail@example.com"
}
```

### Delete Patient
```http
DELETE /patients/{patientId}
Authorization: Bearer <token>
```

## 📅 Appointments API

### List Appointments
```http
GET /appointments?date=2024-01-01&doctorId=doctor-123&status=scheduled
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` - Filter by date (YYYY-MM-DD)
- `dateFrom`, `dateTo` - Date range filter
- `doctorId` - Filter by doctor
- `patientId` - Filter by patient
- `status` - Filter by status (scheduled, confirmed, in-progress, completed, cancelled)

**Response:**
```json
{
  "data": [
    {
      "id": "apt-123",
      "patientId": "patient-123",
      "doctorId": "doctor-123",
      "appointmentDate": "2024-01-01T09:00:00Z",
      "duration": 30,
      "type": "consultation",
      "status": "scheduled",
      "notes": "Regular checkup",
      "patient": {
        "fullName": "John Doe",
        "phone": "+1234567890"
      },
      "doctor": {
        "fullName": "Dr. Smith"
      }
    }
  ]
}
```

### Get Appointment by ID
```http
GET /appointments/{appointmentId}
Authorization: Bearer <token>
```

### Create Appointment
```http
POST /appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-123",
  "doctorId": "doctor-123",
  "appointmentDate": "2024-01-01T09:00:00Z",
  "duration": 30,
  "type": "consultation",
  "notes": "Regular checkup"
}
```

### Update Appointment
```http
PUT /appointments/{appointmentId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Patient confirmed attendance"
}
```

### Cancel Appointment
```http
DELETE /appointments/{appointmentId}
Authorization: Bearer <token>
```

## 🩺 OPD Records API

### List OPD Records
```http
GET /opd-records?patientId=patient-123&dateFrom=2024-01-01&dateTo=2024-01-31
Authorization: Bearer <token>
```

### Get OPD Record by ID
```http
GET /opd-records/{recordId}
Authorization: Bearer <token>
```

### Create OPD Record
```http
POST /opd-records
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-123",
  "doctorId": "doctor-123",
  "appointmentId": "apt-123",
  "chiefComplaint": "Chest pain",
  "historyOfPresentIllness": "Patient reports chest pain for 2 days",
  "physicalExamination": "Normal heart sounds, no murmurs",
  "diagnosis": "Gastroesophageal reflux",
  "treatmentPlan": "PPI therapy, lifestyle modifications",
  "followUpDate": "2024-02-01",
  "vitalSigns": {
    "bloodPressure": "120/80",
    "heartRate": 72,
    "temperature": 98.6,
    "respiratoryRate": 16
  }
}
```

### Update OPD Record
```http
PUT /opd-records/{recordId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "diagnosis": "Updated diagnosis",
  "treatmentPlan": "Updated treatment plan"
}
```

## 💊 Prescriptions API

### List Prescriptions
```http
GET /prescriptions?patientId=patient-123&status=active
Authorization: Bearer <token>
```

### Get Prescription by ID
```http
GET /prescriptions/{prescriptionId}
Authorization: Bearer <token>
```

### Create Prescription
```http
POST /prescriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-123",
  "doctorId": "doctor-123",
  "opdRecordId": "opd-123",
  "medications": [
    {
      "medicineId": "med-123",
      "dosage": "10mg",
      "frequency": "twice daily",
      "duration": "7 days",
      "instructions": "Take with food",
      "quantity": 14
    }
  ],
  "notes": "Complete the full course"
}
```

### Update Prescription Status
```http
PUT /prescriptions/{prescriptionId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "dispensed",
  "pharmacistNotes": "All medications dispensed"
}
```

## 🏪 Medicines API

### List Medicines
```http
GET /medicines?search=aspirin&category=analgesic&inStock=true
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` - Search by name or generic name
- `category` - Filter by category
- `inStock` - Filter by stock availability (true/false)
- `lowStock` - Show items with low stock (true/false)

**Response:**
```json
{
  "data": [
    {
      "id": "med-123",
      "name": "Aspirin 100mg",
      "genericName": "Acetylsalicylic Acid",
      "category": "analgesic",
      "dosageForm": "tablet",
      "strength": "100mg",
      "manufacturer": "Pharma Co",
      "unitPrice": 0.50,
      "stockQuantity": 1000,
      "minimumStock": 100,
      "expiryDate": "2025-12-31",
      "batchNumber": "BATCH001"
    }
  ]
}
```

### Get Medicine by ID
```http
GET /medicines/{medicineId}
Authorization: Bearer <token>
```

### Create Medicine (Admin/Pharmacist)
```http
POST /medicines
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Medicine 50mg",
  "genericName": "Generic Name",
  "category": "antibiotic",
  "dosageForm": "capsule",
  "strength": "50mg",
  "manufacturer": "Pharma Co",
  "unitPrice": 2.50,
  "stockQuantity": 500,
  "minimumStock": 50,
  "expiryDate": "2025-12-31",
  "batchNumber": "BATCH002"
}
```

### Update Medicine Stock
```http
PUT /medicines/{medicineId}/stock
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 100,
  "type": "add",
  "notes": "New stock received"
}
```

## 💰 Invoices API

### List Invoices
```http
GET /invoices?patientId=patient-123&status=pending&dateFrom=2024-01-01
Authorization: Bearer <token>
```

### Get Invoice by ID
```http
GET /invoices/{invoiceId}
Authorization: Bearer <token>
```

### Create Invoice
```http
POST /invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-123",
  "opdRecordId": "opd-123",
  "items": [
    {
      "type": "consultation",
      "description": "General Consultation",
      "quantity": 1,
      "unitPrice": 100.00,
      "total": 100.00
    },
    {
      "type": "medicine",
      "medicineId": "med-123",
      "description": "Aspirin 100mg",
      "quantity": 14,
      "unitPrice": 0.50,
      "total": 7.00
    }
  ],
  "subtotal": 107.00,
  "taxAmount": 10.70,
  "totalAmount": 117.70
}
```

### Update Invoice Status
```http
PUT /invoices/{invoiceId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentStatus": "paid",
  "paymentMethod": "cash",
  "paidAmount": 117.70,
  "paymentDate": "2024-01-01T10:00:00Z"
}
```

## 🩺 Services API

### List Services
```http
GET /services?category=diagnostic&isActive=true
Authorization: Bearer <token>
```

### Get Service by ID
```http
GET /services/{serviceId}
Authorization: Bearer <token>
```

### Create Service (Admin Only)
```http
POST /services
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "ECG",
  "description": "Electrocardiogram",
  "category": "diagnostic",
  "price": 50.00,
  "duration": 15,
  "isActive": true
}
```

## 📊 Reports API

### Patient Report
```http
GET /reports/patients?dateFrom=2024-01-01&dateTo=2024-01-31&format=pdf
Authorization: Bearer <token>
```

### Revenue Report
```http
GET /reports/revenue?period=monthly&year=2024&month=1
Authorization: Bearer <token>
```

### Appointment Statistics
```http
GET /reports/appointments/stats?dateFrom=2024-01-01&dateTo=2024-01-31
Authorization: Bearer <token>
```

## 🔍 Search API

### Global Search
```http
GET /search?q=john&type=patient,appointment&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "results": [
    {
      "type": "patient",
      "id": "patient-123",
      "title": "John Doe",
      "subtitle": "DOB: 1990-01-01 | Phone: +1234567890",
      "url": "/patients/patient-123"
    },
    {
      "type": "appointment",
      "id": "apt-123",
      "title": "Appointment - John Doe",
      "subtitle": "Jan 1, 2024 at 9:00 AM with Dr. Smith",
      "url": "/appointments/apt-123"
    }
  ],
  "total": 2
}
```

## 📡 Webhooks API

### List Webhooks (Admin Only)
```http
GET /webhooks
Authorization: Bearer <admin-token>
```

### Create Webhook (Admin Only)
```http
POST /webhooks
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["patient.created", "appointment.scheduled"],
  "secret": "webhook-secret",
  "isActive": true
}
```

### Webhook Events
Available webhook events:
- `patient.created`
- `patient.updated`
- `appointment.scheduled`
- `appointment.cancelled`
- `prescription.created`
- `invoice.paid`

## ⚠️ Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "message": "Invalid email format"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "req-123"
}
```

### Common Error Codes
| Code | Status | Description |
|------|---------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## 📈 Rate Limiting

### Rate Limits
- **Standard Users**: 1000 requests per hour
- **Admin Users**: 5000 requests per hour
- **API Keys**: 10000 requests per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 🔧 SDKs and Libraries

### JavaScript/Node.js
```bash
npm install @swamidesk/api-client
```

```javascript
import { SwamIDesk } from '@swamidesk/api-client';

const client = new SwamIDesk({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.swamidesk.com/v1'
});

// Get patients
const patients = await client.patients.list();

// Create appointment
const appointment = await client.appointments.create({
  patientId: 'patient-123',
  doctorId: 'doctor-123',
  appointmentDate: '2024-01-01T09:00:00Z'
});
```

### Python
```bash
pip install swamidesk-python
```

```python
from swamidesk import SwamIDesk

client = SwamIDesk(api_key='your-api-key')

# Get patients
patients = client.patients.list()

# Create appointment
appointment = client.appointments.create({
    'patient_id': 'patient-123',
    'doctor_id': 'doctor-123',
    'appointment_date': '2024-01-01T09:00:00Z'
})
```

## 🧪 Testing

### Sandbox Environment
```
Base URL: https://sandbox-api.swamidesk.com/v1
```

### Test Data
The sandbox environment includes test data:
- Test patients with various conditions
- Sample appointments and schedules
- Mock medicine inventory
- Test payment scenarios

### API Testing Tools
- **Postman Collection**: Available for download
- **OpenAPI Spec**: Swagger documentation
- **cURL Examples**: Command-line testing

---

## 📚 Additional Resources

- **Postman Collection**: [Download Collection](./postman-collection.json)
- **OpenAPI Specification**: [View Swagger Docs](./openapi.yaml)
- **SDK Documentation**: [SDK Guides](./sdks/)
- **Webhook Testing**: [Webhook Guide](./webhooks-guide.md)

For API support or questions, contact the development team or refer to the troubleshooting guide.