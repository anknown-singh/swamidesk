-- Simple Medicine Master Database with 100 Essential Medicines
-- Using minimal required columns only

INSERT INTO medicine_master (
  generic_name, category, is_active
) VALUES

-- Pain & Inflammation (10 medicines)
('Ibuprofen', 'Analgesic', TRUE),
('Aspirin', 'Analgesic', TRUE),
('Diclofenac', 'Analgesic', TRUE),
('Tramadol', 'Analgesic', TRUE),
('Naproxen', 'Analgesic', TRUE),
('Paracetamol', 'Analgesic', TRUE),
('Acetaminophen', 'Analgesic', TRUE),
('Celecoxib', 'Analgesic', TRUE),
('Ketorolac', 'Analgesic', TRUE),
('Morphine', 'Analgesic', TRUE),

-- Antibiotics (15 medicines)
('Amoxicillin', 'Antibiotic', TRUE),
('Cephalexin', 'Antibiotic', TRUE),
('Azithromycin', 'Antibiotic', TRUE),
('Ciprofloxacin', 'Antibiotic', TRUE),
('Doxycycline', 'Antibiotic', TRUE),
('Metronidazole', 'Antibiotic', TRUE),
('Clindamycin', 'Antibiotic', TRUE),
('Erythromycin', 'Antibiotic', TRUE),
('Ampicillin', 'Antibiotic', TRUE),
('Trimethoprim', 'Antibiotic', TRUE),
('Nitrofurantoin', 'Antibiotic', TRUE),
('Vancomycin', 'Antibiotic', TRUE),
('Sulfamethoxazole/Trimethoprim', 'Antibiotic', TRUE),
('Levofloxacin', 'Antibiotic', TRUE),
('Ceftriaxone', 'Antibiotic', TRUE),

-- Cardiovascular (12 medicines)
('Lisinopril', 'Cardiovascular', TRUE),
('Atorvastatin', 'Cardiovascular', TRUE),
('Metoprolol', 'Cardiovascular', TRUE),
('Losartan', 'Cardiovascular', TRUE),
('Furosemide', 'Cardiovascular', TRUE),
('Digoxin', 'Cardiovascular', TRUE),
('Warfarin', 'Cardiovascular', TRUE),
('Clopidogrel', 'Cardiovascular', TRUE),
('Simvastatin', 'Cardiovascular', TRUE),
('Amlodipine', 'Cardiovascular', TRUE),
('Hydrochlorothiazide', 'Cardiovascular', TRUE),
('Propranolol', 'Cardiovascular', TRUE),

-- Gastrointestinal (8 medicines)
('Omeprazole', 'Gastrointestinal', TRUE),
('Ranitidine', 'Gastrointestinal', FALSE),
('Loperamide', 'Gastrointestinal', TRUE),
('Ondansetron', 'Gastrointestinal', TRUE),
('Metoclopramide', 'Gastrointestinal', TRUE),
('Pantoprazole', 'Gastrointestinal', TRUE),
('Docusate', 'Gastrointestinal', TRUE),
('Famotidine', 'Gastrointestinal', TRUE),

-- Respiratory (8 medicines)
('Albuterol', 'Respiratory', TRUE),
('Budesonide', 'Respiratory', TRUE),
('Montelukast', 'Respiratory', TRUE),
('Prednisolone', 'Respiratory', TRUE),
('Theophylline', 'Respiratory', TRUE),
('Fluticasone', 'Respiratory', TRUE),
('Loratadine', 'Respiratory', TRUE),
('Cetirizine', 'Respiratory', TRUE),

-- Endocrine/Diabetes (7 medicines)
('Metformin', 'Endocrine', TRUE),
('Insulin glargine', 'Endocrine', TRUE),
('Gliclazide', 'Endocrine', TRUE),
('Levothyroxine', 'Endocrine', TRUE),
('Prednisone', 'Endocrine', TRUE),
('Glipizide', 'Endocrine', TRUE),
('Pioglitazone', 'Endocrine', TRUE),

-- Neurological/Psychiatric (10 medicines)
('Carbamazepine', 'Neurological', TRUE),
('Phenytoin', 'Neurological', TRUE),
('Levodopa/Carbidopa', 'Neurological', TRUE),
('Fluoxetine', 'Psychiatric', TRUE),
('Sertraline', 'Psychiatric', TRUE),
('Risperidone', 'Psychiatric', TRUE),
('Lithium', 'Psychiatric', TRUE),
('Alprazolam', 'Psychiatric', TRUE),
('Lorazepam', 'Psychiatric', TRUE),
('Gabapentin', 'Neurological', TRUE),

-- Miscellaneous Essential (25 medicines)
('Acyclovir', 'Antiviral', TRUE),
('Diphenhydramine', 'Allergy', TRUE),
('Hydrocortisone', 'Anti-inflammatory', TRUE),
('Vitamin D3', 'Supplement', TRUE),
('Folic acid', 'Supplement', TRUE),
('Iron sulfate', 'Supplement', TRUE),
('Multivitamin', 'Supplement', TRUE),
('Calcium carbonate', 'Antacid', TRUE),
('Magnesium oxide', 'Supplement', TRUE),
('Potassium chloride', 'Supplement', TRUE),
('Zinc sulfate', 'Supplement', TRUE),
('Melatonin', 'Sleep aid', TRUE),
('Epinephrine', 'Emergency', TRUE),
('Naloxone', 'Emergency', TRUE),
('Dextrose', 'Emergency', TRUE),
('Vitamin B12', 'Supplement', TRUE),
('Vitamin C', 'Supplement', TRUE),
('Simethicone', 'Gastrointestinal', TRUE),
('Benzocaine', 'Topical anesthetic', TRUE),
('Lidocaine', 'Local anesthetic', TRUE),
('Chlorhexidine', 'Antiseptic', TRUE),
('Povidone iodine', 'Antiseptic', TRUE),
('Hydrogen peroxide', 'Antiseptic', TRUE),
('Glycerin', 'Lubricant', TRUE),
('Saline solution', 'Irrigation', TRUE);

-- Complete the insert statement
SELECT 'Medicine master database populated with 100 essential medicines (simple version)' as result;