-- Sample Medicine Master Database 
-- Insert sample data for medicine_master table matching actual schema

INSERT INTO medicine_master (
  generic_name, brand_name, manufacturer, strength, dosage_form, composition,
  therapeutic_class, pharmacological_class, schedule, pack_size, mrp,
  category, indications, contraindications, side_effects, drug_interactions,
  storage_conditions, expiry_period, is_active
) VALUES

('Ibuprofen', 'Advil', 'Pfizer', '400mg', 'Tablet', 'Ibuprofen 400mg', 'Anti-inflammatory', 'NSAID', 'OTC', '10 tablets', 45.00, 'Analgesic', 'Pain, Inflammation, Fever', 'Peptic ulcer, Severe heart failure', 'GI upset, Dizziness', 'Warfarin, ACE inhibitors', 'Store at room temperature', '3 years', TRUE),

('Aspirin', 'Disprin', 'Reckitt Benckiser', '325mg', 'Tablet', 'Acetylsalicylic acid 325mg', 'Antiplatelet', 'NSAID', 'OTC', '10 tablets', 25.00, 'Analgesic', 'Cardiovascular protection, Pain, Fever', 'Children under 16 years, Active bleeding', 'GI bleeding, Tinnitus', 'Warfarin, Methotrexate', 'Store in dry place', '2 years', TRUE),

('Diclofenac', 'Voltaren', 'Novartis', '50mg', 'Tablet', 'Diclofenac Sodium 50mg', 'Anti-inflammatory', 'NSAID', 'Prescription', '10 tablets', 35.00, 'Analgesic', 'Arthritis, Post-operative pain', 'Severe cardiac disease, Active GI bleeding', 'Headache, Dizziness, GI upset', 'Lithium, Digoxin', 'Store below 25°C', '3 years', TRUE),

('Paracetamol', 'Crocin', 'GSK', '500mg', 'Tablet', 'Paracetamol 500mg', 'Analgesic', 'Non-narcotic analgesic', 'OTC', '15 tablets', 15.00, 'Antipyretic', 'Fever, Pain', 'Severe liver disease', 'Rare: Liver toxicity', 'Avoid with alcohol', 'Store at room temperature', '4 years', TRUE),

('Amoxicillin', 'Amoxil', 'GSK', '250mg', 'Capsule', 'Amoxicillin Trihydrate 250mg', 'Antibiotic', 'Penicillin', 'Prescription', '10 capsules', 85.00, 'Beta-lactam antibiotic', 'Bacterial infections', 'Penicillin allergy', 'Diarrhea, Nausea, Rash', 'Oral contraceptives', 'Refrigerate', '2 years', TRUE),

('Metformin', 'Glucophage', 'Bristol Myers Squibb', '500mg', 'Tablet', 'Metformin HCl 500mg', 'Antidiabetic', 'Biguanide', 'Prescription', '20 tablets', 65.00, 'Antidiabetic', 'Type 2 Diabetes', 'Kidney disease, Heart failure', 'GI upset, Lactic acidosis (rare)', 'Contrast agents', 'Store at room temperature', '3 years', TRUE),

('Amlodipine', 'Norvasc', 'Pfizer', '5mg', 'Tablet', 'Amlodipine Besylate 5mg', 'Antihypertensive', 'Calcium channel blocker', 'Prescription', '10 tablets', 75.00, 'Cardiovascular', 'Hypertension, Angina', 'Cardiogenic shock', 'Ankle swelling, Dizziness', 'Simvastatin', 'Store below 30°C', '2 years', TRUE),

('Omeprazole', 'Prilosec', 'AstraZeneca', '20mg', 'Capsule', 'Omeprazole 20mg', 'Proton pump inhibitor', 'PPI', 'Prescription', '14 capsules', 95.00, 'Gastric acid reducer', 'GERD, Peptic ulcer', 'None significant', 'Headache, Diarrhea', 'Warfarin, Clopidogrel', 'Store in dry place', '2 years', TRUE),

('Salbutamol', 'Ventolin', 'GSK', '2mg', 'Tablet', 'Salbutamol Sulfate 2mg', 'Bronchodilator', 'Beta-2 agonist', 'Prescription', '20 tablets', 45.00, 'Respiratory', 'Asthma, COPD', 'Hypersensitivity', 'Tremor, Palpitations', 'Beta-blockers', 'Store below 25°C', '3 years', TRUE),

('Prednisolone', 'Wysolone', 'Wyeth', '5mg', 'Tablet', 'Prednisolone 5mg', 'Corticosteroid', 'Anti-inflammatory', 'Prescription', '10 tablets', 25.00, 'Steroid', 'Inflammation, Allergies', 'Systemic fungal infections', 'Weight gain, Mood changes', 'NSAIDs, Vaccines', 'Store at room temperature', '3 years', TRUE);