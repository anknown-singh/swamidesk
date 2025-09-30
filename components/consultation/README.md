# Consultation Workflows

This directory contains specialty-specific consultation workflows for the Swamidesk healthcare system.

## Structure

```
consultation/
├── shared/                     # Common components and utilities
│   ├── base-consultation-workflow.tsx    # Base interfaces and types
│   ├── use-consultation-session.ts       # Consultation session management hook
│   ├── medication-autocomplete.tsx       # Shared medication search component
│   └── index.ts                          # Shared exports
├── general-medicine/           # General medicine consultation workflow
│   ├── general-consultation-workflow.tsx # Main workflow component
│   ├── general-chief-complaints-form.tsx # Chief complaints form
│   ├── general-history-taking-form.tsx   # History taking form
│   ├── general-vitals-form.tsx           # Vital signs form
│   ├── general-examination-form.tsx      # Physical examination form
│   ├── general-diagnosis-form.tsx        # Diagnosis form
│   ├── general-investigation-orders-form.tsx # Investigation orders form
│   ├── general-treatment-plan-form.tsx   # Treatment plan form
│   ├── general-consultation-summary.tsx  # Consultation summary
│   └── index.ts                          # General medicine exports
└── [future-specialties]/       # Cardiology, Orthopedics, Dermatology, etc.
```

## Shared Components

### BaseConsultationWorkflow
Provides common interfaces and types for all consultation workflows:
- `BaseConsultationStep` - Standard consultation steps
- `BaseConsultationSession` - Session data structure
- `SpecialtyConfig` - Specialty-specific configuration
- `BaseStepComponentProps` - Props for step components

### useConsultationSession Hook
Manages consultation session state and operations:
- `startSession()` - Initialize new consultation session
- `updateStep()` - Update current consultation step
- `completeSession()` - Mark consultation as completed
- `pauseSession()` - Pause ongoing consultation
- `resumeSession()` - Resume paused consultation

### Specialty Configurations
Predefined configurations for different medical specialties:
- **General Medicine**: Standard consultation workflow
- **Cardiology**: Heart-focused examination with ECG requirements
- **Orthopedics**: Musculoskeletal focus with X-ray requirements
- **Dermatology**: Skin-focused with photography capabilities
- **Pediatrics**: Child-specific with growth charts and development

## Usage

### Import General Medicine Consultation
```tsx
import { ConsultationWorkflow } from '@/components/consultation/general-medicine'

// Use in component
<ConsultationWorkflow
  appointmentId={appointmentId}
  onComplete={handleComplete}
  onCancel={handleCancel}
/>
```

### Import Shared Components
```tsx
import { useConsultationSession, getSpecialtyConfig } from '@/components/consultation/shared'

// Use consultation session hook
const { session, startSession, updateStep } = useConsultationSession(appointmentId, 'general-medicine')
```

## Adding New Specialties

To add a new specialty consultation workflow:

1. **Create specialty folder**: `consultation/[specialty-name]/`

2. **Add specialty configuration** to `shared/base-consultation-workflow.tsx`:
```tsx
'specialty-name': {
  name: 'specialty-name',
  displayName: 'Specialty Name',
  steps: ['chief_complaints', 'examination', 'diagnosis', 'treatment'],
  requiredSteps: ['chief_complaints', 'examination'],
  customFields: { /* specialty-specific fields */ }
}
```

3. **Create specialty components**:
   - `[specialty]-consultation-workflow.tsx` - Main workflow
   - `[specialty]-[step]-form.tsx` - Step-specific forms
   - `index.ts` - Export file

4. **Extend base interfaces** for specialty-specific data types

5. **Update imports** in consuming components

## Database Schema

Consultation sessions are stored in the `consultation_sessions` table:
```sql
CREATE TABLE consultation_sessions (
  id UUID PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id),
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES user_profiles(id),
  specialty TEXT,
  current_step TEXT,
  status TEXT CHECK (status IN ('active', 'completed', 'paused')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT FALSE,
  session_data JSONB
);
```

## Migration Notes

- All existing consultation functionality has been moved to `general-medicine/`
- Import paths updated from `@/components/consultation/consultation-workflow` to `@/components/consultation/general-medicine`
- Backward compatibility maintained through index files
- No breaking changes to existing OPD management integration