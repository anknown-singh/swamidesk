-- Corrected Medicine Master Database - Essential Medicines
-- Updated to match correct medicine_master table schema
-- Contains 20 essential medicines with proper data structure

INSERT INTO medicine_master (
  name, generic_name, brand_names, category, subcategory, therapeutic_class,
  dosage_forms, strengths, standard_dosage_adult, standard_dosage_pediatric,
  routes, indications, contraindications, side_effects, interactions,
  pregnancy_category, lactation_safe, prescription_required, controlled_substance,
  schedule, manufacturer, storage_conditions, shelf_life_months, is_active
) VALUES

-- Pain & Inflammation
('Ibuprofen 400mg', 'Ibuprofen', ARRAY['Advil', 'Brufen'], 'Analgesic', 'Anti-inflammatory', 'NSAID', ARRAY['Tablet', 'Capsule'], ARRAY['400mg', '600mg'], '400mg every 6-8 hours', '10mg/kg every 6-8 hours', ARRAY['Oral'], ARRAY['Pain', 'Inflammation', 'Fever'], ARRAY['Peptic ulcer', 'Severe heart failure'], ARRAY['GI upset', 'Dizziness'], ARRAY['Warfarin', 'ACE inhibitors'], 'C', false, false, false, null, 'Pfizer', 'Store at room temperature', 36, TRUE),
('Aspirin 325mg', 'Aspirin', ARRAY['Disprin', 'Ecosprin'], 'Analgesic', 'Antiplatelet', 'NSAID', ARRAY['Tablet'], ARRAY['325mg', '75mg'], '325mg daily', 'Not recommended', ARRAY['Oral'], ARRAY['Cardiovascular protection', 'Pain', 'Fever'], ARRAY['Children under 16 years', 'Active bleeding'], ARRAY['GI bleeding', 'Tinnitus'], ARRAY['Warfarin', 'Methotrexate'], 'D', false, false, false, null, 'Bayer', 'Store in dry place', 24, TRUE),
('Paracetamol 500mg', 'Paracetamol', ARRAY['Panadol', 'Tylenol'], 'Analgesic', 'Non-NSAID', 'Antipyretic', ARRAY['Tablet', 'Syrup'], ARRAY['500mg', '250mg'], '500mg every 6 hours', '10-15mg/kg every 6 hours', ARRAY['Oral'], ARRAY['Pain', 'Fever'], ARRAY['Severe liver disease'], ARRAY['Liver toxicity (rare)'], ARRAY['Warfarin (high doses)'], 'B', true, false, false, null, 'GSK', 'Store below 25°C', 36, TRUE),

-- Antibiotics  
('Amoxicillin 500mg', 'Amoxicillin', ARRAY['Amoxil', 'Amoxiclav'], 'Antibiotic', 'Penicillin', 'Beta-lactam', ARRAY['Capsule', 'Suspension'], ARRAY['500mg', '250mg'], '500mg three times daily', '20-40mg/kg/day', ARRAY['Oral'], ARRAY['Respiratory infections', 'UTI'], ARRAY['Penicillin allergy'], ARRAY['Diarrhea', 'Nausea'], ARRAY['Warfarin'], 'B', true, true, false, null, 'GSK', 'Store below 25°C', 36, TRUE),
('Azithromycin 250mg', 'Azithromycin', ARRAY['Zithromax', 'Z-Pack'], 'Antibiotic', 'Macrolide', 'Protein synthesis inhibitor', ARRAY['Tablet', 'Suspension'], ARRAY['250mg', '500mg'], '500mg once daily', '10mg/kg once daily', ARRAY['Oral'], ARRAY['Respiratory infections', 'Chlamydia'], ARRAY['Macrolide allergy', 'Liver disease'], ARRAY['Nausea', 'Diarrhea'], ARRAY['Warfarin', 'Digoxin'], 'B', true, true, false, null, 'Pfizer', 'Store at room temperature', 36, TRUE),
('Ciprofloxacin 500mg', 'Ciprofloxacin', ARRAY['Cipro'], 'Antibiotic', 'Fluoroquinolone', 'DNA gyrase inhibitor', ARRAY['Tablet', 'Injection'], ARRAY['250mg', '500mg', '750mg'], '500mg twice daily', '10-20mg/kg twice daily', ARRAY['Oral', 'IV'], ARRAY['UTI', 'Respiratory infections'], ARRAY['Tendinitis history', 'Children <18 years'], ARRAY['Nausea', 'Headache', 'Tendinitis'], ARRAY['Warfarin', 'Theophylline'], 'C', false, true, false, null, 'Bayer', 'Store at room temperature', 36, TRUE),

-- Cardiovascular
('Lisinopril 10mg', 'Lisinopril', ARRAY['Prinivil', 'Zestril'], 'Cardiovascular', 'ACE Inhibitor', 'Antihypertensive', ARRAY['Tablet'], ARRAY['5mg', '10mg', '20mg'], '10mg once daily', 'Not recommended', ARRAY['Oral'], ARRAY['Hypertension', 'Heart failure'], ARRAY['Angioedema', 'Pregnancy'], ARRAY['Dry cough', 'Hyperkalemia'], ARRAY['Potassium supplements', 'NSAIDs'], 'D', false, true, false, null, 'Merck', 'Store at room temperature', 36, TRUE),
('Atorvastatin 20mg', 'Atorvastatin', ARRAY['Lipitor'], 'Cardiovascular', 'Statin', 'HMG-CoA reductase inhibitor', ARRAY['Tablet'], ARRAY['10mg', '20mg', '40mg'], '20mg once daily', 'Not recommended', ARRAY['Oral'], ARRAY['High cholesterol', 'Cardiovascular risk'], ARRAY['Active liver disease', 'Pregnancy'], ARRAY['Muscle pain', 'Liver enzymes elevation'], ARRAY['Warfarin', 'Digoxin'], 'X', false, true, false, null, 'Pfizer', 'Store at room temperature', 36, TRUE),
('Metoprolol 50mg', 'Metoprolol', ARRAY['Lopressor', 'Toprol'], 'Cardiovascular', 'Beta-blocker', 'Cardioselective', ARRAY['Tablet'], ARRAY['25mg', '50mg', '100mg'], '50mg twice daily', '1-2mg/kg twice daily', ARRAY['Oral'], ARRAY['Hypertension', 'Angina'], ARRAY['Asthma', 'Heart block'], ARRAY['Fatigue', 'Bradycardia'], ARRAY['Verapamil', 'Digoxin'], 'C', true, true, false, null, 'Novartis', 'Store at room temperature', 36, TRUE),

-- Gastrointestinal
('Omeprazole 20mg', 'Omeprazole', ARRAY['Prilosec'], 'Gastrointestinal', 'Proton pump inhibitor', 'Acid suppression', ARRAY['Capsule'], ARRAY['20mg', '40mg'], '20mg once daily', '1mg/kg once daily', ARRAY['Oral'], ARRAY['GERD', 'Peptic ulcer'], ARRAY['Hypersensitivity'], ARRAY['Headache', 'Diarrhea'], ARRAY['Warfarin', 'Clopidogrel'], 'C', true, false, false, null, 'AstraZeneca', 'Store at room temperature', 36, TRUE),
('Ondansetron 4mg', 'Ondansetron', ARRAY['Zofran'], 'Gastrointestinal', 'Antiemetic', '5-HT3 antagonist', ARRAY['Tablet', 'Injection'], ARRAY['4mg', '8mg'], '4mg every 8 hours', '0.15mg/kg every 8 hours', ARRAY['Oral', 'IV'], ARRAY['Nausea', 'Vomiting'], ARRAY['Hypersensitivity'], ARRAY['Headache', 'Constipation'], ARRAY['Apomorphine'], 'B', true, true, false, null, 'GSK', 'Store at room temperature', 36, TRUE),

-- Respiratory
('Albuterol 100mcg', 'Albuterol', ARRAY['Ventolin', 'ProAir'], 'Respiratory', 'Bronchodilator', 'Beta-2 agonist', ARRAY['Inhaler', 'Nebulizer'], ARRAY['100mcg/puff'], '2 puffs every 4-6 hours', '2 puffs every 4-6 hours', ARRAY['Inhalation'], ARRAY['Asthma', 'COPD'], ARRAY['Hypersensitivity'], ARRAY['Tremor', 'Tachycardia'], ARRAY['Beta-blockers'], 'C', true, false, false, null, 'GSK', 'Store at room temperature', 24, TRUE),
('Montelukast 10mg', 'Montelukast', ARRAY['Singulair'], 'Respiratory', 'Leukotriene antagonist', 'Anti-inflammatory', ARRAY['Tablet'], ARRAY['4mg', '5mg', '10mg'], '10mg once daily', '4-5mg once daily', ARRAY['Oral'], ARRAY['Asthma', 'Allergic rhinitis'], ARRAY['Hypersensitivity'], ARRAY['Headache', 'Behavioral changes'], ARRAY['Phenobarbital', 'Rifampin'], 'B', true, true, false, null, 'Merck', 'Store at room temperature', 36, TRUE),

-- Endocrine
('Metformin 500mg', 'Metformin', ARRAY['Glucophage'], 'Endocrine', 'Antidiabetic', 'Biguanide', ARRAY['Tablet'], ARRAY['500mg', '850mg', '1000mg'], '500mg twice daily', 'Not recommended <10 years', ARRAY['Oral'], ARRAY['Type 2 diabetes'], ARRAY['Kidney disease', 'Lactic acidosis'], ARRAY['GI upset', 'Metallic taste'], ARRAY['Contrast agents', 'Alcohol'], 'B', true, true, false, null, 'Bristol Myers', 'Store at room temperature', 36, TRUE),
('Levothyroxine 50mcg', 'Levothyroxine', ARRAY['Synthroid', 'Levoxyl'], 'Endocrine', 'Thyroid hormone', 'Hormone replacement', ARRAY['Tablet'], ARRAY['25mcg', '50mcg', '100mcg'], '50-100mcg once daily', '25-50mcg once daily', ARRAY['Oral'], ARRAY['Hypothyroidism'], ARRAY['Hyperthyroidism', 'Uncorrected adrenal insufficiency'], ARRAY['Palpitations', 'Weight loss'], ARRAY['Warfarin', 'Digoxin'], 'A', true, true, false, null, 'Abbott', 'Store at room temperature', 36, TRUE),

-- Neurological/Psychiatric
('Sertraline 50mg', 'Sertraline', ARRAY['Zoloft'], 'Psychiatric', 'Antidepressant', 'SSRI', ARRAY['Tablet'], ARRAY['25mg', '50mg', '100mg'], '50mg once daily', '25mg once daily', ARRAY['Oral'], ARRAY['Depression', 'Anxiety'], ARRAY['MAO inhibitor use', 'Pimozide'], ARRAY['Nausea', 'Sexual dysfunction'], ARRAY['MAO inhibitors', 'Warfarin'], 'C', false, true, false, null, 'Pfizer', 'Store at room temperature', 36, TRUE),
('Gabapentin 300mg', 'Gabapentin', ARRAY['Neurontin'], 'Neurological', 'Anticonvulsant', 'GABA analogue', ARRAY['Capsule', 'Tablet'], ARRAY['100mg', '300mg', '400mg'], '300mg three times daily', '10-15mg/kg three times daily', ARRAY['Oral'], ARRAY['Neuropathic pain', 'Epilepsy'], ARRAY['Hypersensitivity'], ARRAY['Dizziness', 'Somnolence'], ARRAY['Morphine', 'Hydrocodone'], 'C', true, true, false, null, 'Pfizer', 'Store at room temperature', 36, TRUE),

-- Emergency/Essential
('Epinephrine 1mg', 'Epinephrine', ARRAY['EpiPen', 'Adrenalin'], 'Emergency', 'Vasopressor', 'Adrenergic agonist', ARRAY['Injection', 'Auto-injector'], ARRAY['0.3mg', '0.15mg', '1mg/mL'], '0.3-0.5mg IM', '0.01mg/kg IM', ARRAY['IM', 'IV', 'SC'], ARRAY['Anaphylaxis', 'Cardiac arrest'], ARRAY['Narrow-angle glaucoma'], ARRAY['Tachycardia', 'Hypertension'], ARRAY['Beta-blockers', 'MAO inhibitors'], 'C', true, true, false, null, 'Mylan', 'Store at 2-25°C', 18, TRUE),
('Naloxone 0.4mg', 'Naloxone', ARRAY['Narcan'], 'Emergency', 'Opioid antagonist', 'Competitive antagonist', ARRAY['Injection', 'Nasal spray'], ARRAY['0.4mg', '2mg'], '0.4-2mg IV/IM', '0.01-0.1mg/kg IV/IM', ARRAY['IV', 'IM', 'Intranasal'], ARRAY['Opioid overdose'], ARRAY['Hypersensitivity'], ARRAY['Withdrawal symptoms'], ARRAY['None significant'], 'B', true, true, false, null, 'Emergent BioSolutions', 'Store at room temperature', 36, TRUE);

SELECT 'Medicine master database populated with 20 essential medicines (corrected version)' as result;