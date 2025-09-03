-- Medicine Master Table
-- Comprehensive medicine reference database for prescriptions
-- Separate from inventory management

CREATE TABLE IF NOT EXISTS medicine_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Medicine Information
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  brand_names TEXT[], -- Array of brand names
  
  -- Classification
  category VARCHAR(100) NOT NULL, -- Analgesic, Antibiotic, etc.
  subcategory VARCHAR(100), -- NSAID, Penicillin, etc.
  therapeutic_class VARCHAR(100), -- Pain relief, Infection treatment
  pharmacological_class VARCHAR(100), -- Beta blocker, ACE inhibitor
  
  -- Dosage Information
  dosage_forms TEXT[] NOT NULL, -- ['Tablet', 'Injection', 'Syrup']
  strengths TEXT[] NOT NULL, -- ['500mg', '250mg', '1g']
  standard_dosage_adult VARCHAR(100), -- Standard adult dose
  standard_dosage_pediatric VARCHAR(100), -- Standard pediatric dose
  
  -- Administration
  routes TEXT[] NOT NULL, -- ['Oral', 'IV', 'IM']
  frequencies TEXT[], -- ['Once daily', 'Twice daily', 'TID']
  
  -- Clinical Information
  indications TEXT[], -- What it's used for
  contraindications TEXT[], -- When not to use
  side_effects TEXT[], -- Common side effects
  drug_interactions TEXT[], -- Drug interactions
  warnings TEXT[], -- Special warnings
  
  -- Prescription Guidelines
  max_daily_dose VARCHAR(100), -- Maximum daily dose
  duration_guidelines VARCHAR(200), -- Typical treatment duration
  monitoring_requirements TEXT[], -- What to monitor
  
  -- Additional Information
  mechanism_of_action TEXT, -- How it works
  pregnancy_category VARCHAR(10), -- A, B, C, D, X
  controlled_substance BOOLEAN DEFAULT FALSE,
  prescription_required BOOLEAN DEFAULT TRUE,
  
  -- Search and Reference
  search_keywords TEXT[], -- Additional searchable terms
  synonyms TEXT[], -- Alternative names
  icd_codes TEXT[], -- Related ICD codes
  
  -- Administrative
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  UNIQUE(name, generic_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_medicine_master_name ON medicine_master(name);
CREATE INDEX IF NOT EXISTS idx_medicine_master_generic ON medicine_master(generic_name);
CREATE INDEX IF NOT EXISTS idx_medicine_master_category ON medicine_master(category);
CREATE INDEX IF NOT EXISTS idx_medicine_master_search ON medicine_master USING gin(search_keywords);
CREATE INDEX IF NOT EXISTS idx_medicine_master_active ON medicine_master(is_active);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_medicine_master_fulltext ON medicine_master USING gin(
  to_tsvector('english', 
    coalesce(name, '') || ' ' || 
    coalesce(generic_name, '') || ' ' || 
    coalesce(category, '') || ' ' || 
    array_to_string(coalesce(brand_names, '{}'), ' ') || ' ' ||
    array_to_string(coalesce(search_keywords, '{}'), ' ')
  )
);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_medicine_master_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER medicine_master_updated_at_trigger
  BEFORE UPDATE ON medicine_master
  FOR EACH ROW
  EXECUTE FUNCTION update_medicine_master_updated_at();

-- Table comment
COMMENT ON TABLE medicine_master IS 'Comprehensive medicine reference database for prescriptions, separate from inventory management';

-- Column comments
COMMENT ON COLUMN medicine_master.brand_names IS 'Array of commercial brand names for this medicine';
COMMENT ON COLUMN medicine_master.dosage_forms IS 'Available dosage forms (Tablet, Injection, Syrup, etc.)';
COMMENT ON COLUMN medicine_master.strengths IS 'Available strengths (500mg, 250mg, 1g, etc.)';
COMMENT ON COLUMN medicine_master.routes IS 'Administration routes (Oral, IV, IM, Topical, etc.)';
COMMENT ON COLUMN medicine_master.search_keywords IS 'Additional searchable terms for better discovery';
COMMENT ON COLUMN medicine_master.controlled_substance IS 'Whether this is a controlled/narcotic substance';
COMMENT ON COLUMN medicine_master.prescription_required IS 'Whether prescription is required (vs OTC)';

-- Success message
SELECT 'Medicine Master table created successfully!' as result;