# 🏥 SwamIDesk Consultation System - Comprehensive Plan

## Overview
A complete consultation workflow system that guides doctors through systematic patient examination, from initial complaints to final treatment planning.

## 📋 Consultation Workflow Steps

### 1. **Patient Entry & Appointment Start**
- Patient enters consultant room
- Doctor clicks "Start Consultation" (from schedule system)
- Appointment status updates to 'in_progress'
- Consultation timer begins

### 2. **Chief Complaints**
- Primary symptoms/concerns
- Duration of symptoms
- Severity assessment
- Associated symptoms

### 3. **History Taking**
#### A. History of Present Illness (HPI)
- Detailed symptom progression
- Aggravating/relieving factors  
- Previous treatment attempts
- Timeline of illness

#### B. Past Medical History
- Previous illnesses/surgeries
- Chronic conditions
- Medications history
- Hospitalizations

#### C. Personal History
- Lifestyle factors
- Smoking/alcohol/drug use
- Occupation
- Exercise habits
- Diet patterns

#### D. Family History
- Hereditary conditions
- Family medical conditions
- Genetic predispositions

#### E. Allergy History
- Drug allergies
- Food allergies
- Environmental allergies
- Previous adverse reactions

### 4. **Examination Findings**
#### A. General Examination
- Vital signs (BP, pulse, temp, resp rate, SpO2)
- General appearance
- Mental status
- Nutrition status
- Hydration status
- Pallor/cyanosis/jaundice/edema

#### B. Local/Systemic Examination
- System-specific examination based on complaints
- Inspection, palpation, percussion, auscultation
- Relevant positive/negative findings

### 5. **Provisional Diagnosis**
- Primary differential diagnoses
- Confidence level
- Supporting evidence from history/examination

### 6. **Investigation Advice**
- Laboratory tests
- Imaging studies
- Specialized tests
- Timeline for results

### 7. **Final Diagnosis**
- Confirmed diagnosis
- ICD-10 codes
- Comorbidities
- Severity assessment

### 8. **Treatment Planning**
#### A. Conservative Treatment
- Medications (prescriptions)
- Lifestyle modifications
- Dietary advice
- Physiotherapy
- Follow-up schedule

#### B. Surgical/Procedural Treatment
- Procedure recommendations
- Pre-operative requirements
- Risk assessment
- Consent requirements
- Scheduling

## 🗄️ Database Schema Design

### Existing Tables to Extend
```sql
-- visits table (already exists with basic fields)
ALTER TABLE visits ADD COLUMN consultation_data JSONB;
```

### New Tables Required

#### 1. consultation_sessions
```sql
CREATE TABLE consultation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES visits(id),
    doctor_id UUID REFERENCES users(id),
    patient_id UUID REFERENCES patients(id),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    current_step VARCHAR(50) DEFAULT 'chief_complaints',
    is_completed BOOLEAN DEFAULT FALSE,
    total_duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. consultation_chief_complaints
```sql
CREATE TABLE consultation_chief_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultation_sessions(id),
    complaint TEXT NOT NULL,
    duration VARCHAR(100),
    severity INTEGER CHECK (severity BETWEEN 1 AND 10),
    associated_symptoms TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. consultation_history
```sql
CREATE TABLE consultation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultation_sessions(id),
    history_type VARCHAR(50) NOT NULL, -- 'present_illness', 'past_medical', 'personal', 'family', 'allergy'
    content JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. examination_findings
```sql
CREATE TABLE examination_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultation_sessions(id),
    examination_type VARCHAR(50) NOT NULL, -- 'general', 'cardiovascular', 'respiratory', 'abdominal', etc.
    findings JSONB NOT NULL,
    abnormal_findings TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. consultation_diagnoses
```sql
CREATE TABLE consultation_diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultation_sessions(id),
    diagnosis_type VARCHAR(20) NOT NULL, -- 'provisional', 'final'
    diagnosis_text TEXT NOT NULL,
    icd10_code VARCHAR(10),
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. investigation_orders
```sql
CREATE TABLE investigation_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultation_sessions(id),
    investigation_type VARCHAR(50) NOT NULL, -- 'lab', 'imaging', 'specialized'
    investigation_name VARCHAR(200) NOT NULL,
    urgency VARCHAR(20) DEFAULT 'routine', -- 'urgent', 'routine', 'stat'
    instructions TEXT,
    expected_date DATE,
    status VARCHAR(20) DEFAULT 'ordered', -- 'ordered', 'completed', 'cancelled'
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. treatment_plans
```sql
CREATE TABLE treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultation_sessions(id),
    treatment_type VARCHAR(50) NOT NULL, -- 'conservative', 'surgical', 'procedural'
    plan_details JSONB NOT NULL,
    medications JSONB, -- Array of medication objects
    procedures JSONB, -- Array of procedure objects
    follow_up_required BOOLEAN DEFAULT TRUE,
    follow_up_days INTEGER,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎨 User Interface Design

### 1. **Consultation Dashboard**
- Progress indicator showing current step
- Patient information panel (always visible)
- Navigation between consultation sections
- Save progress functionality
- Quick access to previous consultations

### 2. **Section-wise Forms**

#### Chief Complaints Interface
- Dynamic complaint entry
- Dropdown for common complaints
- Duration picker (days/weeks/months/years)  
- Severity slider (1-10)
- Associated symptoms checklist

#### History Taking Interface
- Tabbed interface for different history types
- Template-based entry for common conditions
- Free text areas for detailed notes
- Previous history import functionality

#### Examination Interface
- System-wise examination forms
- Normal/Abnormal toggle buttons
- Quick entry for vital signs
- Diagram-based marking for physical findings

#### Diagnosis Interface  
- ICD-10 code lookup
- Differential diagnosis builder
- Confidence level indicators
- Evidence linking from history/examination

#### Investigation Interface
- Category-wise investigation selection
- Template-based orders
- Urgency level setting
- Instructions field

#### Treatment Planning Interface
- Treatment type selection (conservative/surgical)
- Medication prescription integration
- Procedure scheduling integration
- Follow-up scheduling
- Patient education material

## 🔄 Workflow Integration

### Integration with Existing Systems
1. **Appointment System**: Start consultation from schedule
2. **Prescription System**: Auto-generate prescriptions from treatment plan
3. **Procedure Scheduling**: Direct integration for surgical/procedural treatments
4. **Billing System**: Auto-calculate consultation charges
5. **Patient Records**: Historical consultation access

### Status Flow
```
Appointment 'scheduled' → 'in_progress' (consultation started)
                      ↓
Consultation Steps: chief_complaints → history → examination → diagnosis → treatment
                      ↓
Appointment 'completed' (consultation ended)
                      ↓
Generate: Prescriptions, Procedure Orders, Follow-up Appointments, Bills
```

## 🚀 Implementation Phases

### Phase 1: Core Consultation Form (Week 1)
- Database schema creation
- Basic consultation session management
- Chief complaints interface
- Simple history taking form

### Phase 2: Examination & Diagnosis (Week 2)  
- Examination findings interface
- Provisional diagnosis system
- Investigation orders
- Integration with existing prescription system

### Phase 3: Treatment Planning (Week 3)
- Treatment plan builder
- Procedure integration
- Follow-up scheduling
- Billing integration

### Phase 4: Advanced Features (Week 4)
- Templates for common consultations
- Voice-to-text integration
- Consultation analytics
- Mobile-responsive design

## 📱 Technical Implementation Stack

### Frontend Components
- React TypeScript forms with react-hook-form
- Shadcn/ui components for consistent design
- Real-time auto-save functionality
- Progressive enhancement for offline use

### Backend Integration
- Supabase database with JSONB for flexible data storage
- Real-time subscriptions for collaborative features
- Row Level Security (RLS) for data protection
- Audit trails for compliance

### User Experience Features
- Step-by-step wizard interface
- Progress saving and resume capability
- Keyboard shortcuts for power users
- Print-friendly consultation summaries

## 🔒 Compliance & Security

### Medical Data Protection
- HIPAA-compliant data handling
- Audit logs for all consultation actions
- Role-based access control
- Data encryption at rest and in transit

### Quality Assurance
- Mandatory field validation
- Clinical decision support alerts
- Drug interaction checking
- Template standardization

This comprehensive consultation system will transform the SwamIDesk platform into a complete EMR solution for healthcare providers.