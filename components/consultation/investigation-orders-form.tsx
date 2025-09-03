'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAutoSave } from '@/lib/hooks/useAutoSave'

// Components
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Plus, X, ArrowLeft, ArrowRight, FileSearch, Search, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SaveStatusIndicator } from '@/components/ui/save-status-indicator'

// Form data types
type InvestigationData = {
  investigation_type: string
  investigation_name: string
  reason: string
  urgency: 'routine' | 'urgent' | 'stat'
  notes: string
}

type InvestigationOrdersFormData = {
  investigations: InvestigationData[]
}

interface InvestigationOrdersFormProps {
  consultationId: string
  onNext: () => void
  onPrevious: () => void
}

// Common investigation categories and tests with smart reasons - 300+ tests
const INVESTIGATION_CATEGORIES = {
  'Laboratory': [
    // Hematology Tests (25 tests)
    { name: 'Complete Blood Count (CBC)', reason: 'To check for infection, anemia, or blood disorders', prep: '' },
    { name: 'Complete Blood Count with Differential', reason: 'Detailed blood count with white cell types', prep: '' },
    { name: 'Hemoglobin (Hb)', reason: 'To diagnose anemia or polycythemia', prep: '' },
    { name: 'Hematocrit (HCT)', reason: 'To measure red blood cell percentage', prep: '' },
    { name: 'Platelet Count', reason: 'To assess bleeding risk and clotting disorders', prep: '' },
    { name: 'ESR', reason: 'To detect inflammation in the body', prep: '' },
    { name: 'CRP', reason: 'To detect acute inflammation or infection', prep: '' },
    { name: 'Prothrombin Time (PT)', reason: 'To monitor blood clotting and warfarin therapy', prep: '' },
    { name: 'Partial Thromboplastin Time (PTT)', reason: 'To assess blood clotting disorders', prep: '' },
    { name: 'INR', reason: 'To monitor warfarin therapy and clotting', prep: '' },
    { name: 'D-Dimer', reason: 'To rule out blood clots or pulmonary embolism', prep: '' },
    { name: 'Fibrinogen', reason: 'To evaluate bleeding disorders and DIC', prep: '' },
    { name: 'Reticulocyte Count', reason: 'To assess bone marrow function and anemia', prep: '' },
    { name: 'Peripheral Blood Smear', reason: 'To examine blood cell morphology', prep: '' },
    { name: 'G6PD Enzyme', reason: 'To diagnose G6PD deficiency', prep: '' },
    { name: 'Sickling Test', reason: 'To screen for sickle cell disease', prep: '' },
    { name: 'Hemoglobin Electrophoresis', reason: 'To diagnose thalassemia and hemoglobinopathies', prep: '' },
    { name: 'Coombs Test (Direct)', reason: 'To diagnose hemolytic anemia', prep: '' },
    { name: 'Coombs Test (Indirect)', reason: 'To screen for antibodies before transfusion', prep: '' },
    { name: 'Blood Group & Rh Typing', reason: 'To determine blood type for transfusion', prep: '' },
    { name: 'Cross Matching', reason: 'To ensure blood compatibility for transfusion', prep: '' },
    { name: 'Bleeding Time', reason: 'To assess platelet function and bleeding disorders', prep: '' },
    { name: 'Clotting Time', reason: 'To evaluate blood coagulation', prep: '' },
    { name: 'Bone Marrow Aspiration', reason: 'To diagnose blood disorders and cancers', prep: 'Local anesthesia required' },
    { name: 'Flow Cytometry', reason: 'To diagnose blood cancers and immune disorders', prep: '' },

    // Biochemistry Tests (40 tests)
    { name: 'Blood Sugar (Fasting)', reason: 'To diagnose or monitor diabetes', prep: 'Fast 8-12 hours before test' },
    { name: 'Blood Sugar (Random)', reason: 'To screen for diabetes or monitor blood glucose', prep: '' },
    { name: 'Blood Sugar (Post Prandial)', reason: 'To monitor diabetes control after meals', prep: 'Eat normal meal 2 hours before test' },
    { name: 'HbA1c', reason: 'To monitor diabetes control over 2-3 months', prep: '' },
    { name: 'Glucose Tolerance Test (GTT)', reason: 'To diagnose diabetes and glucose intolerance', prep: 'Fast 8-12 hours, drink glucose solution' },
    { name: 'Kidney Function Test', reason: 'To evaluate kidney function and detect kidney disease', prep: '' },
    { name: 'Urea', reason: 'To assess kidney function', prep: '' },
    { name: 'Creatinine', reason: 'To evaluate kidney function', prep: '' },
    { name: 'BUN (Blood Urea Nitrogen)', reason: 'To assess kidney and liver function', prep: '' },
    { name: 'eGFR (Estimated Glomerular Filtration Rate)', reason: 'To assess kidney function', prep: '' },
    { name: 'Liver Function Test', reason: 'To assess liver health and function', prep: '' },
    { name: 'SGOT (AST)', reason: 'To evaluate liver and heart damage', prep: '' },
    { name: 'SGPT (ALT)', reason: 'To assess liver function and damage', prep: '' },
    { name: 'Alkaline Phosphatase', reason: 'To evaluate liver and bone disorders', prep: '' },
    { name: 'Bilirubin (Total)', reason: 'To diagnose jaundice and liver problems', prep: '' },
    { name: 'Bilirubin (Direct)', reason: 'To differentiate types of jaundice', prep: '' },
    { name: 'Bilirubin (Indirect)', reason: 'To assess hemolytic disorders', prep: '' },
    { name: 'Total Protein', reason: 'To assess nutritional status and liver function', prep: '' },
    { name: 'Albumin', reason: 'To evaluate liver function and nutritional status', prep: '' },
    { name: 'Globulin', reason: 'To assess immune system and liver function', prep: '' },
    { name: 'A/G Ratio', reason: 'To evaluate liver and kidney function', prep: '' },
    { name: 'Lipid Profile', reason: 'To assess cardiovascular risk and cholesterol levels', prep: 'Fast 12 hours before test' },
    { name: 'Total Cholesterol', reason: 'To assess heart disease risk', prep: 'Fast 12 hours' },
    { name: 'HDL Cholesterol', reason: 'To evaluate good cholesterol levels', prep: 'Fast 12 hours' },
    { name: 'LDL Cholesterol', reason: 'To assess bad cholesterol and heart risk', prep: 'Fast 12 hours' },
    { name: 'VLDL Cholesterol', reason: 'To evaluate very low density lipoprotein', prep: 'Fast 12 hours' },
    { name: 'Triglycerides', reason: 'To assess fat levels and heart disease risk', prep: 'Fast 12 hours' },
    { name: 'Electrolytes (Na, K, Cl)', reason: 'To check electrolyte balance and kidney function', prep: '' },
    { name: 'Sodium (Na)', reason: 'To assess fluid balance and kidney function', prep: '' },
    { name: 'Potassium (K)', reason: 'To monitor heart function and medications', prep: '' },
    { name: 'Chloride (Cl)', reason: 'To assess acid-base balance', prep: '' },
    { name: 'Calcium', reason: 'To assess bone health and parathyroid function', prep: '' },
    { name: 'Phosphorus', reason: 'To evaluate bone and kidney disorders', prep: '' },
    { name: 'Magnesium', reason: 'To assess electrolyte balance', prep: '' },
    { name: 'Uric Acid', reason: 'To diagnose gout and kidney stones', prep: '' },
    { name: 'LDH (Lactate Dehydrogenase)', reason: 'To assess tissue damage', prep: '' },
    { name: 'CPK (Creatine Phosphokinase)', reason: 'To evaluate muscle and heart damage', prep: '' },
    { name: 'CPK-MB', reason: 'To diagnose heart muscle damage', prep: '' },
    { name: 'Amylase', reason: 'To diagnose pancreatitis', prep: '' },
    { name: 'Lipase', reason: 'To diagnose pancreatic disorders', prep: '' },

    // Cardiac Markers (10 tests)
    { name: 'Cardiac Enzymes', reason: 'To diagnose heart attack or heart muscle damage', prep: '' },
    { name: 'Troponin I', reason: 'To diagnose heart attack with high specificity', prep: '' },
    { name: 'Troponin T', reason: 'To detect heart muscle damage', prep: '' },
    { name: 'CK-MB', reason: 'To evaluate heart muscle damage', prep: '' },
    { name: 'Myoglobin', reason: 'To detect early heart muscle damage', prep: '' },
    { name: 'BNP (B-type Natriuretic Peptide)', reason: 'To diagnose heart failure', prep: '' },
    { name: 'NT-proBNP', reason: 'To assess heart failure severity', prep: '' },
    { name: 'Homocysteine', reason: 'To assess cardiovascular disease risk', prep: 'Fast 12 hours' },
    { name: 'hs-CRP (High Sensitivity CRP)', reason: 'To assess cardiovascular inflammation risk', prep: '' },
    { name: 'Apolipoprotein A1', reason: 'To evaluate cardiovascular risk', prep: 'Fast 12 hours' },

    // Endocrine Tests (25 tests)
    { name: 'Thyroid Function Test', reason: 'To diagnose thyroid disorders', prep: '' },
    { name: 'TSH (Thyroid Stimulating Hormone)', reason: 'To screen for thyroid disorders', prep: '' },
    { name: 'T3 (Triiodothyronine)', reason: 'To evaluate thyroid function', prep: '' },
    { name: 'T4 (Thyroxine)', reason: 'To assess thyroid hormone levels', prep: '' },
    { name: 'Free T3', reason: 'To evaluate active thyroid hormone', prep: '' },
    { name: 'Free T4', reason: 'To assess active thyroid hormone', prep: '' },
    { name: 'Reverse T3', reason: 'To evaluate thyroid hormone metabolism', prep: '' },
    { name: 'Anti-TPO', reason: 'To diagnose autoimmune thyroid disease', prep: '' },
    { name: 'Anti-Thyroglobulin', reason: 'To detect thyroid antibodies', prep: '' },
    { name: 'Thyroglobulin', reason: 'To monitor thyroid cancer treatment', prep: '' },
    { name: 'Insulin (Fasting)', reason: 'To evaluate insulin resistance', prep: 'Fast 8-12 hours' },
    { name: 'C-Peptide', reason: 'To assess pancreatic function', prep: '' },
    { name: 'Cortisol (Morning)', reason: 'To evaluate adrenal function', prep: 'Collect at 8 AM' },
    { name: 'Cortisol (Evening)', reason: 'To assess circadian rhythm', prep: 'Collect at 11 PM' },
    { name: 'Dexamethasone Suppression Test', reason: 'To diagnose Cushing\'s syndrome', prep: 'Take dexamethasone at 11 PM' },
    { name: 'ACTH', reason: 'To evaluate adrenal and pituitary function', prep: '' },
    { name: 'Growth Hormone', reason: 'To diagnose growth hormone disorders', prep: '' },
    { name: 'IGF-1', reason: 'To evaluate growth hormone status', prep: '' },
    { name: 'Prolactin', reason: 'To evaluate pituitary function', prep: '' },
    { name: 'FSH (Follicle Stimulating Hormone)', reason: 'To evaluate reproductive function', prep: '' },
    { name: 'LH (Luteinizing Hormone)', reason: 'To assess reproductive hormones', prep: '' },
    { name: 'Testosterone (Total)', reason: 'To evaluate male hormone levels', prep: '' },
    { name: 'Testosterone (Free)', reason: 'To assess bioavailable testosterone', prep: '' },
    { name: 'Estradiol', reason: 'To evaluate female hormone levels', prep: '' },
    { name: 'Progesterone', reason: 'To assess ovulation and pregnancy', prep: '' },

    // Vitamins & Minerals (15 tests)
    { name: 'Vitamin D', reason: 'To assess vitamin D deficiency', prep: '' },
    { name: 'Vitamin D3 (25-OH)', reason: 'To measure vitamin D status', prep: '' },
    { name: 'Vitamin D2 (25-OH)', reason: 'To assess vitamin D2 levels', prep: '' },
    { name: 'Vitamin B12', reason: 'To diagnose B12 deficiency or pernicious anemia', prep: '' },
    { name: 'Folate (Folic Acid)', reason: 'To diagnose folate deficiency anemia', prep: '' },
    { name: 'Vitamin B1 (Thiamine)', reason: 'To diagnose thiamine deficiency', prep: '' },
    { name: 'Vitamin B6 (Pyridoxine)', reason: 'To assess B6 status', prep: '' },
    { name: 'Vitamin C (Ascorbic Acid)', reason: 'To diagnose vitamin C deficiency', prep: '' },
    { name: 'Vitamin A (Retinol)', reason: 'To assess vitamin A status', prep: '' },
    { name: 'Vitamin E (Tocopherol)', reason: 'To evaluate antioxidant status', prep: '' },
    { name: 'Vitamin K', reason: 'To assess vitamin K status', prep: '' },
    { name: 'Iron Studies', reason: 'To diagnose iron deficiency or iron overload', prep: '' },
    { name: 'Serum Iron', reason: 'To evaluate iron levels', prep: '' },
    { name: 'TIBC (Total Iron Binding Capacity)', reason: 'To assess iron metabolism', prep: '' },
    { name: 'Transferrin Saturation', reason: 'To evaluate iron utilization', prep: '' },
    { name: 'Zinc', reason: 'To assess zinc levels for wound healing', prep: '' },

    // Infectious Disease Tests (20 tests)
    { name: 'Blood Culture', reason: 'To detect bacteria in bloodstream', prep: '' },
    { name: 'Urine Culture', reason: 'To identify bacteria causing urinary tract infection', prep: 'Clean catch midstream urine' },
    { name: 'Stool Culture', reason: 'To identify bacterial causes of diarrhea', prep: '' },
    { name: 'Sputum Culture', reason: 'To identify respiratory pathogens', prep: 'Deep cough specimen' },
    { name: 'Throat Culture', reason: 'To diagnose strep throat and other infections', prep: '' },
    { name: 'Wound Culture', reason: 'To identify bacteria in infected wounds', prep: '' },
    { name: 'Hepatitis B Surface Antigen (HBsAg)', reason: 'To screen for hepatitis B infection', prep: '' },
    { name: 'Hepatitis B Surface Antibody', reason: 'To check immunity to hepatitis B', prep: '' },
    { name: 'Hepatitis C Antibody', reason: 'To screen for hepatitis C infection', prep: '' },
    { name: 'HIV 1 & 2', reason: 'To screen for HIV infection', prep: '' },
    { name: 'VDRL/RPR', reason: 'To screen for syphilis', prep: '' },
    { name: 'Widal Test', reason: 'To diagnose typhoid fever', prep: '' },
    { name: 'Malaria Antigen', reason: 'To diagnose malaria infection', prep: '' },
    { name: 'Dengue NS1 Antigen', reason: 'To diagnose dengue fever early', prep: '' },
    { name: 'Dengue IgM/IgG', reason: 'To diagnose dengue infection', prep: '' },
    { name: 'Chikungunya IgM', reason: 'To diagnose chikungunya fever', prep: '' },
    { name: 'Typhoid IgM/IgG', reason: 'To diagnose typhoid fever', prep: '' },
    { name: 'Tuberculosis (TB Gold)', reason: 'To diagnose latent tuberculosis', prep: '' },
    { name: 'Mantoux Test (PPD)', reason: 'To screen for tuberculosis exposure', prep: 'Read after 48-72 hours' },
    { name: 'AFB Smear', reason: 'To diagnose tuberculosis in sputum', prep: 'Early morning specimen' },
    
    // Additional Infectious Disease Tests (10 tests)
    { name: 'COVID-19 PCR Test', reason: 'To diagnose COVID-19 infection with high accuracy', prep: 'Nasopharyngeal swab, follow current protocols' },
    { name: 'COVID-19 Antibody Test', reason: 'To detect previous COVID-19 infection or vaccination', prep: 'Blood sample, timing important for accuracy' },
    { name: 'Stool Ova and Parasites', reason: 'To detect intestinal parasites and eggs', prep: 'Fresh stool sample, avoid antibiotics' },
    { name: 'Giardia Antigen Test', reason: 'To diagnose Giardia parasitic infection', prep: 'Fresh stool sample' },
    { name: 'Cryptosporidium Antigen', reason: 'To detect Cryptosporidium parasites', prep: 'Stool sample, common in immunocompromised' },
    { name: 'Clostridium Difficile Toxin', reason: 'To diagnose C. diff colitis', prep: 'Fresh liquid stool sample' },
    { name: 'Respiratory Syncytial Virus (RSV)', reason: 'To diagnose RSV infection in infants/elderly', prep: 'Nasal swab or aspirate' },
    { name: 'Epstein-Barr Virus (EBV) Panel', reason: 'To diagnose mono and EBV infection status', prep: 'Blood sample, multiple antibodies tested' },
    { name: 'Cytomegalovirus (CMV) IgM/IgG', reason: 'To diagnose CMV infection', prep: 'Blood sample, important in pregnancy' },
    { name: 'Lyme Disease Antibody', reason: 'To diagnose Lyme disease from tick bite', prep: 'Blood sample, timing affects accuracy' }
  ],
  'Dermatology': [
    // Skin Examination Tests (20 tests)
    { name: 'Skin Biopsy (Punch)', reason: 'To diagnose skin lesions or rule out skin cancer', prep: 'Local anesthesia, keep area clean after' },
    { name: 'Skin Biopsy (Shave)', reason: 'To sample raised skin lesions', prep: 'Local anesthesia, minimal scarring' },
    { name: 'Skin Biopsy (Excisional)', reason: 'To completely remove skin lesions for analysis', prep: 'Local anesthesia, sutures required' },
    { name: 'Fine Needle Aspiration (Skin)', reason: 'To sample cells from skin lumps or cysts', prep: 'Local anesthesia if needed' },
    { name: 'Skin Scraping (KOH Prep)', reason: 'To diagnose fungal skin infections', prep: 'No lotions or antifungals before test' },
    { name: 'Tzanck Smear', reason: 'To diagnose herpes virus infections', prep: 'Clean lesion area, avoid topical treatments' },
    { name: 'Wood\'s Lamp Examination', reason: 'To diagnose certain fungal infections and pigment disorders', prep: 'Clean skin, avoid fluorescent products' },
    { name: 'Dermoscopy (Dermatoscopy)', reason: 'To evaluate skin lesions and moles for cancer', prep: 'Clean skin, avoid oils or lotions' },
    { name: 'Patch Testing (Contact Dermatitis)', reason: 'To identify contact allergens causing dermatitis', prep: 'Avoid topical steroids, keep patches dry' },
    { name: 'Skin Prick Test (Allergies)', reason: 'To identify environmental and food allergens', prep: 'Stop antihistamines 7 days before test' },
    { name: 'Intradermal Test (Allergies)', reason: 'To test for specific allergens with intradermal injection', prep: 'Stop antihistamines, local reaction expected' },
    { name: 'Phototest (Phototesting)', reason: 'To diagnose sun-related skin conditions', prep: 'Avoid sun exposure and photosensitizing drugs' },
    { name: 'Nail Clipping (Fungal)', reason: 'To diagnose nail fungal infections', prep: 'No nail polish, avoid antifungals' },
    { name: 'Hair Pluck Test', reason: 'To diagnose hair disorders and alopecia', prep: 'No hair treatments before test' },
    { name: 'Skin Culture (Bacterial)', reason: 'To identify bacterial skin infections', prep: 'Clean area, avoid topical antibiotics' },
    { name: 'Skin Culture (Fungal)', reason: 'To diagnose fungal skin and nail infections', prep: 'No antifungal treatments before test' },
    { name: 'Viral Culture (Skin)', reason: 'To diagnose viral skin infections like HSV', prep: 'Sample from fresh lesions' },
    { name: 'Skin pH Testing', reason: 'To assess skin barrier function', prep: 'No soaps or lotions 24 hours before' },
    { name: 'Sebum Measurement', reason: 'To evaluate skin oil production', prep: 'No face washing 3 hours before test' },
    { name: 'Digital Photography (Mole Mapping)', reason: 'To monitor changes in moles and skin lesions', prep: 'Clean skin, good lighting required' }
  ],
  'Ophthalmology': [
    // Eye Examination Tests (15 tests)
    { name: 'Visual Acuity Test', reason: 'To measure sharpness and clarity of vision', prep: 'Bring current glasses or contact lenses' },
    { name: 'Refraction Test', reason: 'To determine prescription for glasses or contacts', prep: 'Bring current eyewear, eye drops may blur vision' },
    { name: 'Tonometry (Eye Pressure)', reason: 'To screen for glaucoma by measuring eye pressure', prep: 'No contact lenses, numbing drops used' },
    { name: 'Fundoscopy (Ophthalmoscopy)', reason: 'To examine retina and optic nerve', prep: 'Pupil dilation, light sensitivity after' },
    { name: 'Slit Lamp Examination', reason: 'To examine front structures of the eye', prep: 'No contact lenses before test' },
    { name: 'Visual Field Test (Perimetry)', reason: 'To detect peripheral vision loss and glaucoma', prep: 'Bring glasses, concentration required' },
    { name: 'Optical Coherence Tomography (OCT)', reason: 'To image retinal layers and optic nerve', prep: 'Pupil dilation may be required' },
    { name: 'Fluorescein Angiography', reason: 'To evaluate blood circulation in retina', prep: 'Contrast dye injection, temporary yellow vision' },
    { name: 'Fundus Photography', reason: 'To document and monitor retinal changes', prep: 'Pupil dilation, bright flash photography' },
    { name: 'Corneal Topography', reason: 'To map the shape and curvature of cornea', prep: 'No contact lenses 24 hours before' },
    { name: 'A-Scan Ultrasonography', reason: 'To measure eye length for cataract surgery', prep: 'Numbing drops, contact probe on eye' },
    { name: 'B-Scan Ultrasonography', reason: 'To examine eye structures when view is blocked', prep: 'Gel applied to closed eyelid' },
    { name: 'Electroretinography (ERG)', reason: 'To test retinal electrical activity', prep: 'Eye electrode placement, avoid caffeine' },
    { name: 'Color Vision Test (Ishihara)', reason: 'To detect color blindness', prep: 'Good lighting conditions required' },
    { name: 'Tear Film Analysis', reason: 'To evaluate dry eye syndrome', prep: 'No eye drops or makeup on test day' }
  ],
  'ENT': [
    // Ear, Nose, Throat Tests (12 tests)
    { name: 'Pure Tone Audiometry', reason: 'To assess hearing thresholds and detect hearing loss', prep: 'Clean ears, avoid loud noise exposure' },
    { name: 'Tympanometry', reason: 'To test middle ear function and eardrum mobility', prep: 'Clean ear canals, remove hearing aids' },
    { name: 'Brainstem Auditory Evoked Response (BAER)', reason: 'To test hearing pathway from ear to brain', prep: 'Electrodes on head, quiet environment' },
    { name: 'Otoacoustic Emissions (OAE)', reason: 'To test inner ear hair cell function', prep: 'Clean ears, no wax blockage' },
    { name: 'Speech Audiometry', reason: 'To evaluate speech understanding and discrimination', prep: 'Clean ears, concentration required' },
    { name: 'Vestibular Function Test', reason: 'To evaluate balance disorders and dizziness', prep: 'Avoid alcohol and sedatives 48 hours' },
    { name: 'Electronystagmography (ENG)', reason: 'To assess balance system with eye movement recording', prep: 'No makeup, avoid caffeine and alcohol' },
    { name: 'Videonystagmography (VNG)', reason: 'To evaluate balance disorders using video recording', prep: 'No contact lenses or eye makeup' },
    { name: 'Nasal Endoscopy', reason: 'To examine nasal passages and sinuses', prep: 'Decongestant spray may be used' },
    { name: 'Laryngoscopy (Flexible)', reason: 'To examine vocal cords and larynx', prep: 'Local anesthetic spray, avoid eating 2 hours' },
    { name: 'Laryngoscopy (Direct)', reason: 'To examine larynx under general anesthesia', prep: 'Fast 8 hours, arrange transport home' },
    { name: 'Swallowing Study (Barium Swallow)', reason: 'To evaluate swallowing disorders', prep: 'Fast 4 hours, barium contrast required' }
  ],
  'Gynecology': [
    // Women's Health Tests (12 tests)
    { name: 'Pap Smear (Cervical Cytology)', reason: 'To screen for cervical cancer and precancerous changes', prep: 'No douching, intercourse, or tampons 48 hours before' },
    { name: 'HPV DNA Test', reason: 'To detect human papillomavirus associated with cervical cancer', prep: 'No douching, intercourse, or tampons 48 hours before' },
    { name: 'Colposcopy', reason: 'To examine cervix closely for abnormal areas', prep: 'Schedule between periods, avoid douching' },
    { name: 'Cervical Biopsy', reason: 'To sample abnormal cervical tissue for analysis', prep: 'Avoid aspirin, expect cramping and bleeding' },
    { name: 'Endometrial Biopsy', reason: 'To sample uterine lining for abnormal bleeding', prep: 'Take pain medication beforehand, expect cramping' },
    { name: 'Hysteroscopy', reason: 'To examine inside of uterus with scope', prep: 'May require anesthesia, arrange transport' },
    { name: 'Hysterosalpingography (HSG)', reason: 'To evaluate uterus and fallopian tubes for fertility', prep: 'Schedule after period, take pain medication' },
    { name: 'Pelvic Ultrasound (Transabdominal)', reason: 'To examine pelvic organs externally', prep: 'Full bladder required for better images' },
    { name: 'Transvaginal Ultrasound', reason: 'To examine pelvic organs internally with probe', prep: 'Empty bladder, more detailed internal view' },
    { name: 'BRCA Gene Testing', reason: 'To assess genetic risk for breast and ovarian cancer', prep: 'Blood test, genetic counseling recommended' },
    { name: 'CA-125 (Cancer Antigen)', reason: 'To monitor ovarian cancer or evaluate pelvic masses', prep: 'Blood test, levels can be elevated in benign conditions' },
    { name: 'AMH (Anti-Mullerian Hormone)', reason: 'To assess ovarian reserve and fertility potential', prep: 'Blood test, timing not cycle-dependent' }
  ],
  'Point-of-Care': [
    // Point-of-Care Tests (15 tests)
    { name: 'Blood Glucose (Fingerstick)', reason: 'To quickly check blood sugar levels', prep: 'Clean finger, no special preparation' },
    { name: 'Urine Pregnancy Test', reason: 'To detect pregnancy hormone in urine', prep: 'First morning urine preferred' },
    { name: 'Rapid Strep Test', reason: 'To quickly diagnose strep throat infection', prep: 'Throat swab, no food or drink before' },
    { name: 'Influenza Rapid Test', reason: 'To diagnose flu virus infection quickly', prep: 'Nasal swab, best within 3 days of symptoms' },
    { name: 'COVID-19 Rapid Antigen Test', reason: 'To quickly screen for COVID-19 infection', prep: 'Nasal swab, follow current guidelines' },
    { name: 'INR Point-of-Care', reason: 'To monitor blood clotting for warfarin therapy', prep: 'Fingerstick blood sample' },
    { name: 'Hemoglobin Quick Check', reason: 'To rapidly assess for anemia', prep: 'Fingerstick blood sample' },
    { name: 'Urine Dipstick', reason: 'To screen for urinary tract infections and kidney problems', prep: 'Clean catch urine sample' },
    { name: 'Fecal Occult Blood Test', reason: 'To detect hidden blood in stool', prep: 'Stool sample, avoid certain foods' },
    { name: 'Monospot Test (EBV)', reason: 'To diagnose infectious mononucleosis', prep: 'Blood sample, rapid result' },
    { name: 'H. pylori Stool Antigen', reason: 'To detect stomach bacteria causing ulcers', prep: 'Stool sample, avoid antibiotics' },
    { name: 'CRP Point-of-Care', reason: 'To quickly assess inflammation levels', prep: 'Fingerstick or blood sample' },
    { name: 'Troponin Point-of-Care', reason: 'To rapidly diagnose heart attack', prep: 'Blood sample, emergency setting' },
    { name: 'BNP Point-of-Care', reason: 'To quickly assess heart failure', prep: 'Blood sample for heart function' },
    { name: 'Lactoferrin (Stool)', reason: 'To detect intestinal inflammation', prep: 'Fresh stool sample' }
  ],
  'Genetics': [
    // Genetic Tests (12 tests)
    { name: 'Karyotype (Chromosome Analysis)', reason: 'To detect chromosomal abnormalities', prep: 'Blood sample, genetic counseling advised' },
    { name: 'FISH (Fluorescence In Situ Hybridization)', reason: 'To detect specific genetic abnormalities', prep: 'Blood or tissue sample, specialized lab' },
    { name: 'Microarray (Chromosomal)', reason: 'To detect small chromosomal changes', prep: 'Blood sample, high-resolution analysis' },
    { name: 'Next-Generation Sequencing Panel', reason: 'To test multiple genes simultaneously', prep: 'Blood sample, genetic counseling recommended' },
    { name: 'Whole Exome Sequencing', reason: 'To sequence all protein-coding genes', prep: 'Blood sample, extensive genetic analysis' },
    { name: 'BRCA1/BRCA2 Gene Testing', reason: 'To assess hereditary breast/ovarian cancer risk', prep: 'Blood sample, genetic counseling required' },
    { name: 'Lynch Syndrome Testing', reason: 'To detect hereditary colorectal cancer risk', prep: 'Blood sample, family history important' },
    { name: 'Cystic Fibrosis Gene Testing', reason: 'To detect CF gene mutations', prep: 'Blood or saliva sample' },
    { name: 'Sickle Cell Gene Testing', reason: 'To detect sickle cell disease mutations', prep: 'Blood sample, hemoglobin analysis' },
    { name: 'Thalassemia Gene Testing', reason: 'To detect thalassemia gene mutations', prep: 'Blood sample, ethnic background relevant' },
    { name: 'Pharmacogenomics Testing', reason: 'To predict drug response based on genetics', prep: 'Blood or saliva sample' },
    { name: 'Paternity Testing', reason: 'To determine biological parentage', prep: 'Blood or cheek swab samples' }
  ],
  'Imaging': [
    // X-Ray Studies (25 tests)
    { name: 'X-Ray Chest', reason: 'To evaluate lungs, heart, and chest structure', prep: '' },
    { name: 'X-Ray Chest (PA & Lateral)', reason: 'To evaluate lungs and mediastinum in two views', prep: '' },
    { name: 'X-Ray Abdomen', reason: 'To detect abdominal problems, blockages, or stones', prep: '' },
    { name: 'X-Ray Abdomen (Erect)', reason: 'To detect intestinal obstruction or perforation', prep: '' },
    { name: 'X-Ray Spine (Cervical)', reason: 'To evaluate neck pain, fractures, or disc problems', prep: '' },
    { name: 'X-Ray Spine (Dorsal)', reason: 'To evaluate upper back problems', prep: '' },
    { name: 'X-Ray Spine (Lumbar)', reason: 'To evaluate lower back pain and disc problems', prep: '' },
    { name: 'X-Ray Spine (Lumbosacral)', reason: 'To evaluate lower back and sacral region', prep: '' },
    { name: 'X-Ray Pelvis', reason: 'To evaluate hip fractures and pelvic injuries', prep: '' },
    { name: 'X-Ray Hip Joint', reason: 'To assess hip pain, fractures, or arthritis', prep: '' },
    { name: 'X-Ray Knee Joint', reason: 'To evaluate knee pain, fractures, or arthritis', prep: '' },
    { name: 'X-Ray Shoulder Joint', reason: 'To assess shoulder pain or dislocation', prep: '' },
    { name: 'X-Ray Elbow Joint', reason: 'To evaluate elbow pain or fractures', prep: '' },
    { name: 'X-Ray Wrist Joint', reason: 'To assess wrist fractures or arthritis', prep: '' },
    { name: 'X-Ray Hand', reason: 'To evaluate hand fractures or joint problems', prep: '' },
    { name: 'X-Ray Foot', reason: 'To assess foot fractures or bone problems', prep: '' },
    { name: 'X-Ray Ankle Joint', reason: 'To evaluate ankle sprains or fractures', prep: '' },
    { name: 'X-Ray Skull', reason: 'To assess head trauma or bone abnormalities', prep: '' },
    { name: 'X-Ray Sinus (PNS)', reason: 'To evaluate sinus infections or blockages', prep: '' },
    { name: 'X-Ray Mandible', reason: 'To assess jaw fractures or TMJ problems', prep: '' },
    { name: 'X-Ray Ribs', reason: 'To detect rib fractures after trauma', prep: '' },
    { name: 'X-Ray Clavicle', reason: 'To evaluate collar bone fractures', prep: '' },
    { name: 'X-Ray Femur', reason: 'To assess thigh bone fractures', prep: '' },
    { name: 'X-Ray Tibia-Fibula', reason: 'To evaluate lower leg fractures', prep: '' },
    { name: 'X-Ray Humerus', reason: 'To assess upper arm bone fractures', prep: '' },

    // CT Scans (20 tests)
    { name: 'CT Scan Head', reason: 'To evaluate headache, stroke, or brain injury', prep: 'Remove metal objects' },
    { name: 'CT Brain (Plain)', reason: 'To detect brain hemorrhage or masses', prep: 'Remove metal objects' },
    { name: 'CT Brain (Contrast)', reason: 'To evaluate brain tumors or infections', prep: 'Check kidney function, remove metals' },
    { name: 'CT Scan Chest', reason: 'To evaluate lung disease, chest pain, or breathing problems', prep: 'Remove metal objects' },
    { name: 'CT Chest (HRCT)', reason: 'To evaluate interstitial lung diseases', prep: 'Remove metal objects' },
    { name: 'CT Scan Abdomen', reason: 'To evaluate abdominal pain, masses, or internal injuries', prep: 'May require contrast, fast if needed' },
    { name: 'CT Abdomen & Pelvis', reason: 'To evaluate abdominal and pelvic organs', prep: 'Oral and IV contrast may be needed' },
    { name: 'CT Scan Pelvis', reason: 'To evaluate pelvic organs and masses', prep: 'May require contrast' },
    { name: 'CT Spine (Cervical)', reason: 'To evaluate neck injuries or disc problems', prep: 'Remove metal objects' },
    { name: 'CT Spine (Dorsal)', reason: 'To assess upper back problems', prep: 'Remove metal objects' },
    { name: 'CT Spine (Lumbar)', reason: 'To evaluate lower back pain and disc herniation', prep: 'Remove metal objects' },
    { name: 'CT Angiography (Brain)', reason: 'To evaluate brain blood vessels', prep: 'IV contrast, check kidney function' },
    { name: 'CT Angiography (Chest)', reason: 'To detect pulmonary embolism', prep: 'IV contrast, check kidney function' },
    { name: 'CT Coronary Angiography', reason: 'To evaluate heart arteries non-invasively', prep: 'Heart rate control, IV contrast' },
    { name: 'CT Urography', reason: 'To evaluate kidney and urinary tract', prep: 'IV contrast, adequate hydration' },
    { name: 'CT Enterography', reason: 'To evaluate small bowel diseases', prep: 'Oral and IV contrast' },
    { name: 'CT Colonography', reason: 'To screen for colon cancer', prep: 'Bowel preparation required' },
    { name: 'CT Temporal Bone', reason: 'To evaluate hearing loss or ear problems', prep: 'Remove metal objects' },
    { name: 'CT Sinus', reason: 'To evaluate chronic sinusitis', prep: 'Remove metal objects' },
    { name: 'CT Neck', reason: 'To evaluate neck masses or lymph nodes', prep: 'May require contrast' },

    // MRI Studies (20 tests)
    { name: 'MRI Brain', reason: 'To evaluate neurological symptoms or brain disorders', prep: 'Remove all metal, inform about implants' },
    { name: 'MRI Brain (Plain)', reason: 'To detect brain lesions or structural abnormalities', prep: 'Remove all metal objects' },
    { name: 'MRI Brain (Contrast)', reason: 'To evaluate brain tumors or infections', prep: 'Remove metals, check kidney function' },
    { name: 'MRI Spine (Cervical)', reason: 'To evaluate neck pain, nerve problems, or disc issues', prep: 'Remove all metal, inform about implants' },
    { name: 'MRI Spine (Dorsal)', reason: 'To assess upper back and spinal cord problems', prep: 'Remove all metal objects' },
    { name: 'MRI Spine (Lumbar)', reason: 'To evaluate lower back pain and disc herniation', prep: 'Remove all metal objects' },
    { name: 'MRI Whole Spine', reason: 'To evaluate entire spinal cord and vertebrae', prep: 'Remove all metal objects' },
    { name: 'MRI Knee Joint', reason: 'To evaluate joint pain, ligament tears, or cartilage damage', prep: 'Remove all metal, inform about implants' },
    { name: 'MRI Shoulder Joint', reason: 'To assess rotator cuff tears or joint problems', prep: 'Remove all metal objects' },
    { name: 'MRI Hip Joint', reason: 'To evaluate hip pain or avascular necrosis', prep: 'Remove all metal objects' },
    { name: 'MRI Ankle Joint', reason: 'To assess ligament tears or cartilage damage', prep: 'Remove all metal objects' },
    { name: 'MRI Wrist Joint', reason: 'To evaluate wrist pain or ligament tears', prep: 'Remove all metal objects' },
    { name: 'MRI Abdomen', reason: 'To evaluate abdominal organs and masses', prep: 'Remove all metal, may need contrast' },
    { name: 'MRI Pelvis', reason: 'To evaluate pelvic organs and masses', prep: 'Remove all metal objects' },
    { name: 'MRI Chest', reason: 'To evaluate chest masses or heart problems', prep: 'Remove all metal objects' },
    { name: 'MRI Angiography (Brain)', reason: 'To evaluate brain blood vessels', prep: 'Remove metals, may need contrast' },
    { name: 'MRI Heart (Cardiac MRI)', reason: 'To evaluate heart function and structure', prep: 'Remove all metal, ECG leads' },
    { name: 'MRI Enterography', reason: 'To evaluate inflammatory bowel disease', prep: 'Oral contrast, remove metals' },
    { name: 'MRI Neck', reason: 'To evaluate neck masses or thyroid', prep: 'Remove all metal objects' },
    { name: 'MRI Temporal Joint (TMJ)', reason: 'To evaluate jaw joint problems', prep: 'Remove all metal objects' },

    // Ultrasound Studies (25 tests)
    { name: 'Ultrasound Abdomen', reason: 'To evaluate abdominal organs and detect stones or masses', prep: 'Fast 6-8 hours, full bladder for pelvis' },
    { name: 'Ultrasound Pelvis', reason: 'To evaluate pelvic organs and reproductive system', prep: 'Full bladder required' },
    { name: 'Ultrasound Heart (Echo)', reason: 'To evaluate heart function and structure', prep: '' },
    { name: 'Ultrasound Thyroid', reason: 'To evaluate thyroid size, nodules, or masses', prep: '' },
    { name: 'Ultrasound Neck', reason: 'To evaluate neck masses and lymph nodes', prep: '' },
    { name: 'Ultrasound Breast', reason: 'To evaluate breast lumps or masses', prep: '' },
    { name: 'Ultrasound Scrotal', reason: 'To evaluate testicular pain or masses', prep: '' },
    { name: 'Ultrasound Prostate (TRUS)', reason: 'To evaluate prostate size and guide biopsy', prep: 'Enema may be required' },
    { name: 'Ultrasound Kidney', reason: 'To evaluate kidney stones or masses', prep: '' },
    { name: 'Ultrasound Liver', reason: 'To evaluate liver size and detect masses', prep: 'Fast 6-8 hours' },
    { name: 'Ultrasound Gallbladder', reason: 'To detect gallstones or gallbladder disease', prep: 'Fast 6-8 hours' },
    { name: 'Ultrasound Pancreas', reason: 'To evaluate pancreatic masses or inflammation', prep: 'Fast 6-8 hours' },
    { name: 'Ultrasound Spleen', reason: 'To assess spleen size and masses', prep: '' },
    { name: 'Ultrasound Carotid Doppler', reason: 'To evaluate neck artery blockages', prep: '' },
    { name: 'Ultrasound Doppler (Lower Limb)', reason: 'To detect blood clots in leg veins', prep: '' },
    { name: 'Ultrasound Doppler (Upper Limb)', reason: 'To evaluate arm blood vessels', prep: '' },
    { name: 'Ultrasound Renal Doppler', reason: 'To assess kidney blood flow', prep: '' },
    { name: 'Ultrasound Portal Doppler', reason: 'To evaluate liver blood flow', prep: 'Fast 6-8 hours' },
    { name: 'Ultrasound TVS (Transvaginal)', reason: 'To evaluate uterus and ovaries', prep: 'Empty bladder' },
    { name: 'Ultrasound Follicular Study', reason: 'To monitor ovulation for fertility', prep: 'Specific timing required' },
    { name: 'Ultrasound Pregnancy (First Trimester)', reason: 'To confirm pregnancy and assess development', prep: 'Full bladder' },
    { name: 'Ultrasound Pregnancy (Second Trimester)', reason: 'To assess fetal growth and anomalies', prep: '' },
    { name: 'Ultrasound Pregnancy (Third Trimester)', reason: 'To assess fetal growth and position', prep: '' },
    { name: 'Ultrasound NT Scan', reason: 'To screen for chromosomal abnormalities', prep: 'Specific gestational age' },
    { name: 'Ultrasound Soft Tissue', reason: 'To evaluate soft tissue masses or swellings', prep: '' },
    { name: 'Ultrasound Lymph Nodes', reason: 'To evaluate enlarged lymph nodes', prep: '' },

    // Special Imaging (15 tests)
    { name: 'Mammography', reason: 'To screen for breast cancer or evaluate breast lumps', prep: 'No deodorant, powder, or lotions' },
    { name: 'Digital Mammography', reason: 'To screen for breast cancer with digital technology', prep: 'No deodorant, powder, or lotions' },
    { name: 'Mammography with Tomosynthesis', reason: 'To screen for breast cancer with 3D imaging', prep: 'No deodorant, powder, or lotions' },
    { name: 'DEXA Scan', reason: 'To diagnose osteoporosis and assess bone density', prep: 'No calcium supplements 24hrs before' },
    { name: 'DEXA Scan (Spine)', reason: 'To assess spine bone density', prep: 'No calcium supplements 24hrs before' },
    { name: 'DEXA Scan (Hip)', reason: 'To assess hip bone density', prep: 'No calcium supplements 24hrs before' },
    { name: 'Bone Scan', reason: 'To detect bone metastases or infections', prep: 'Radioactive injection, return after 3 hours' },
    { name: 'Thyroid Scan', reason: 'To evaluate thyroid function and nodules', prep: 'Avoid iodine, thyroid medications' },
    { name: 'Renal Scan', reason: 'To assess kidney function and blood flow', prep: 'Good hydration required' },
    { name: 'Liver Scan', reason: 'To evaluate liver function and masses', prep: 'Radioactive injection required' },
    { name: 'Gallium Scan', reason: 'To detect infection or inflammation', prep: 'Return for delayed images' },
    { name: 'PET Scan', reason: 'To detect cancer spread or metabolic activity', prep: 'Fast 6 hours, avoid sugar' },
    { name: 'PET-CT Scan', reason: 'To detect and stage cancers', prep: 'Fast 6 hours, avoid sugar and exercise' },
    { name: 'SPECT Scan', reason: 'To evaluate organ function', prep: 'Varies by organ studied' },
    { name: 'Myelography', reason: 'To evaluate spinal cord and nerve roots', prep: 'Contrast injection into spine' }
  ],
  'Cardiac': [
    // Basic Cardiac Tests (15 tests)
    { name: 'ECG (12 Lead)', reason: 'To evaluate heart rhythm and detect heart problems', prep: '' },
    { name: 'ECG (15 Lead)', reason: 'To evaluate posterior wall of heart', prep: '' },
    { name: 'ECG (18 Lead)', reason: 'To evaluate right ventricle and posterior wall', prep: '' },
    { name: 'Rhythm Strip', reason: 'To monitor heart rhythm continuously', prep: '' },
    { name: 'Echocardiography', reason: 'To assess heart function and structure', prep: '' },
    { name: '2D Echo', reason: 'To evaluate heart chambers, valves, and function', prep: '' },
    { name: 'Doppler Echocardiography', reason: 'To assess blood flow through heart', prep: '' },
    { name: 'Color Doppler Echo', reason: 'To evaluate heart valve function', prep: '' },
    { name: 'Transesophageal Echo (TEE)', reason: 'To get detailed view of heart structures', prep: 'Fast 6-8 hours, throat numbing' },
    { name: 'Stress Echocardiography', reason: 'To evaluate heart function under stress', prep: 'Wear comfortable clothes' },
    { name: 'Dobutamine Stress Echo', reason: 'To evaluate heart function with medication', prep: 'IV line required' },
    { name: '3D Echocardiography', reason: 'To get three-dimensional view of heart', prep: '' },
    { name: 'Fetal Echocardiography', reason: 'To evaluate fetal heart development', prep: 'Specific gestational age' },
    { name: 'Bubble Study', reason: 'To detect heart defects with contrast', prep: 'IV line for contrast injection' },
    { name: 'M-Mode Echocardiography', reason: 'To measure heart chamber dimensions', prep: '' },

    // Stress Tests (10 tests)
    { name: 'Stress Test (TMT)', reason: 'To evaluate heart function during exercise', prep: 'Wear comfortable shoes, avoid caffeine' },
    { name: 'Exercise Stress Test', reason: 'To evaluate exercise-induced heart problems', prep: 'Comfortable clothes, avoid caffeine' },
    { name: 'Treadmill Stress Test', reason: 'To assess heart response to exercise', prep: 'Wear running shoes, avoid caffeine' },
    { name: 'Pharmacological Stress Test', reason: 'To stress heart with medications', prep: 'Avoid caffeine 24 hours' },
    { name: 'Adenosine Stress Test', reason: 'To evaluate coronary blood flow', prep: 'Avoid caffeine 24 hours' },
    { name: 'Dipyridamole Stress Test', reason: 'To assess coronary circulation', prep: 'Avoid caffeine and theophylline' },
    { name: 'Dobutamine Stress Test', reason: 'To evaluate heart function with medication', prep: 'IV access required' },
    { name: 'Nuclear Stress Test', reason: 'To evaluate heart blood flow with isotopes', prep: 'Avoid caffeine, fasting may be required' },
    { name: 'Myocardial Perfusion Scan', reason: 'To assess heart muscle blood supply', prep: 'Radioactive tracer injection' },
    { name: 'Thallium Stress Test', reason: 'To evaluate coronary artery disease', prep: 'Avoid caffeine, radioactive injection' },

    // Monitoring Tests (10 tests)
    { name: 'Holter Monitoring (24 Hour)', reason: 'To monitor heart rhythm over 24 hours', prep: 'Normal activities, keep monitor dry' },
    { name: 'Holter Monitoring (48 Hour)', reason: 'To monitor heart rhythm over 48 hours', prep: 'Normal activities, keep monitor dry' },
    { name: 'Event Monitor', reason: 'To record heart rhythm during symptoms', prep: 'Wear for prescribed duration' },
    { name: 'Loop Recorder', reason: 'To monitor intermittent heart rhythm problems', prep: 'Activation during symptoms' },
    { name: 'Mobile Cardiac Telemetry', reason: 'To monitor heart rhythm continuously', prep: 'Real-time monitoring device' },
    { name: 'Ambulatory Blood Pressure Monitor', reason: 'To monitor blood pressure over 24 hours', prep: 'Normal activities with cuff on' },
    { name: 'Tilt Table Test', reason: 'To diagnose fainting or syncope', prep: 'Fast 4 hours, lying flat during test' },
    { name: 'Head-Up Tilt Test', reason: 'To evaluate vasovagal syncope', prep: 'Fast 4 hours before test' },
    { name: 'Electrophysiology Study', reason: 'To evaluate electrical activity of heart', prep: 'Fast 6-8 hours, catheter insertion' },
    { name: 'Signal Averaged ECG', reason: 'To detect late potentials in heart rhythm', prep: 'Still positioning required' },

    // Invasive Procedures (10 tests)  
    { name: 'Coronary Angiography', reason: 'To evaluate coronary artery blockages', prep: 'Fast 6-8 hours, inform about allergies' },
    { name: 'Left Heart Catheterization', reason: 'To assess left heart function and arteries', prep: 'Fast 6-8 hours, groin puncture site' },
    { name: 'Right Heart Catheterization', reason: 'To measure pressures in right heart', prep: 'Fast 6-8 hours, neck or groin access' },
    { name: 'Cardiac Catheterization', reason: 'To evaluate heart chambers and vessels', prep: 'Fast 6-8 hours, catheter through blood vessel' },
    { name: 'Percutaneous Coronary Intervention', reason: 'To open blocked coronary arteries', prep: 'Pre-procedure medications, fasting' },
    { name: 'Fractional Flow Reserve', reason: 'To measure coronary blood flow', prep: 'Cardiac catheterization required' },
    { name: 'Intravascular Ultrasound', reason: 'To visualize inside of coronary arteries', prep: 'During cardiac catheterization' },
    { name: 'Endomyocardial Biopsy', reason: 'To diagnose heart muscle diseases', prep: 'Cardiac catheterization, local anesthesia' },
    { name: 'Balloon Valvuloplasty', reason: 'To open narrowed heart valves', prep: 'Cardiac catheterization, general anesthesia' },
    { name: 'Septal Ablation', reason: 'To treat hypertrophic cardiomyopathy', prep: 'Cardiac catheterization, alcohol injection' }
  ],
  'Pulmonary': [
    // Lung Function Tests (15 tests)
    { name: 'Pulmonary Function Test (PFT)', reason: 'To evaluate lung function and breathing capacity', prep: 'Avoid bronchodilators as advised' },
    { name: 'Spirometry', reason: 'To measure lung volumes and flow rates', prep: 'Avoid bronchodilators 6-24 hours' },
    { name: 'Pre & Post Bronchodilator PFT', reason: 'To assess response to bronchodilator therapy', prep: 'Baseline then post-medication testing' },
    { name: 'Lung Volumes', reason: 'To measure total lung capacity', prep: 'Avoid bronchodilators as advised' },
    { name: 'Diffusion Capacity (DLCO)', reason: 'To assess gas exchange in lungs', prep: 'Avoid smoking before test' },
    { name: 'Peak Flow Measurement', reason: 'To monitor lung function at home', prep: 'Best effort required' },
    { name: 'Methacholine Challenge Test', reason: 'To diagnose asthma with airway sensitivity', prep: 'Avoid bronchodilators 24-48 hours' },
    { name: 'Exercise PFT', reason: 'To evaluate lung function during exercise', prep: 'Comfortable clothes, avoid bronchodilators' },
    { name: 'Six-Minute Walk Test', reason: 'To assess functional exercise capacity', prep: 'Comfortable walking shoes' },
    { name: 'Cardiopulmonary Exercise Test', reason: 'To evaluate heart and lung function together', prep: 'Comfortable exercise clothes' },
    { name: 'Arterial Blood Gas (ABG)', reason: 'To assess oxygen and acid-base status', prep: 'Arterial puncture, breathing room air' },
    { name: 'Pulse Oximetry', reason: 'To monitor oxygen saturation', prep: 'Remove nail polish from finger' },
    { name: 'CO-Oximetry', reason: 'To measure carbon monoxide in blood', prep: 'Arterial or venous blood sample' },
    { name: 'Fractional Exhaled Nitric Oxide', reason: 'To assess airway inflammation', prep: 'Avoid eating, drinking before test' },
    { name: 'Impulse Oscillometry', reason: 'To measure lung function in children', prep: 'Comfortable sitting position' },

    // Bronchoscopy & Related (10 tests)
    { name: 'Flexible Bronchoscopy', reason: 'To examine airways and collect tissue samples', prep: 'Fast 6-8 hours, arrange transport' },
    { name: 'Rigid Bronchoscopy', reason: 'To remove foreign objects or large biopsies', prep: 'General anesthesia, fast 8 hours' },
    { name: 'Bronchoalveolar Lavage (BAL)', reason: 'To collect cells from lungs for analysis', prep: 'During bronchoscopy, local anesthesia' },
    { name: 'Endobronchial Biopsy', reason: 'To sample tissue from airway walls', prep: 'During bronchoscopy, bleeding risk assessment' },
    { name: 'Transbronchial Biopsy', reason: 'To sample lung tissue through airways', prep: 'During bronchoscopy, chest X-ray after' },
    { name: 'Endobronchial Ultrasound (EBUS)', reason: 'To sample lymph nodes near airways', prep: 'Bronchoscopy with ultrasound guidance' },
    { name: 'Navigational Bronchoscopy', reason: 'To reach peripheral lung lesions', prep: 'CT scan guidance, conscious sedation' },
    { name: 'Autofluorescence Bronchoscopy', reason: 'To detect early lung cancer changes', prep: 'Special light during bronchoscopy' },
    { name: 'Narrow Band Imaging', reason: 'To enhance visualization during bronchoscopy', prep: 'Enhanced imaging technology' },
    { name: 'Pleuroscopy (Thoracoscopy)', reason: 'To examine pleural space around lungs', prep: 'Local anesthesia, chest tube insertion' },

    // Sleep Studies (10 tests)
    { name: 'Overnight Sleep Study (PSG)', reason: 'To diagnose sleep disorders like sleep apnea', prep: 'Normal sleep schedule, bring usual medications' },
    { name: 'Home Sleep Study', reason: 'To screen for sleep apnea at home', prep: 'Sleep monitoring device at home' },
    { name: 'Multiple Sleep Latency Test', reason: 'To diagnose narcolepsy and excessive sleepiness', prep: 'Follow specific sleep schedule' },
    { name: 'Maintenance of Wakefulness Test', reason: 'To assess ability to stay awake', prep: 'Specific sleep preparation required' },
    { name: 'CPAP Titration Study', reason: 'To determine optimal CPAP pressure settings', prep: 'Bring CPAP mask if available' },
    { name: 'BiPAP Titration Study', reason: 'To optimize BiPAP pressure settings', prep: 'Overnight study with pressure adjustment' },
    { name: 'Split-Night Sleep Study', reason: 'To diagnose and treat sleep apnea same night', prep: 'Combination diagnostic and treatment study' },
    { name: 'Pediatric Sleep Study', reason: 'To evaluate sleep disorders in children', prep: 'Parent may stay overnight' },
    { name: 'Actigraphy', reason: 'To monitor sleep-wake patterns', prep: 'Wear activity monitor for 1-2 weeks' },
    { name: 'Sleep Diary', reason: 'To track sleep patterns and habits', prep: 'Record sleep times for 1-2 weeks' },

    // Specialized Lung Tests (10 tests)
    { name: 'Chest X-Ray', reason: 'To evaluate lungs and detect respiratory problems', prep: '' },
    { name: 'High Resolution CT Chest', reason: 'To evaluate interstitial lung diseases', prep: 'Remove metal objects, contrast may be used' },
    { name: 'V/Q Scan (Ventilation-Perfusion)', reason: 'To diagnose pulmonary embolism', prep: 'Radioactive material injection and inhalation' },
    { name: 'Lung Perfusion Scan', reason: 'To assess blood flow to lungs', prep: 'Radioactive injection, imaging required' },
    { name: 'Lung Ventilation Scan', reason: 'To assess air distribution in lungs', prep: 'Inhaled radioactive gas' },
    { name: 'Alpha-1 Antitrypsin Level', reason: 'To diagnose emphysema genetic cause', prep: 'Blood test for enzyme deficiency' },
    { name: 'Sweat Chloride Test', reason: 'To diagnose cystic fibrosis', prep: 'Stimulate sweating, collect sweat sample' },
    { name: 'Induced Sputum', reason: 'To collect sputum for analysis', prep: 'Inhaled salt water to produce sputum' },
    { name: 'Pleural Fluid Analysis', reason: 'To analyze fluid around lungs', prep: 'Thoracentesis procedure required' },
    { name: 'Lung Biopsy (Percutaneous)', reason: 'To sample lung tissue through chest wall', prep: 'CT guidance, local anesthesia' }
  ],
  'Endoscopy': [
    // Upper GI Endoscopy (15 tests)
    { name: 'Upper GI Endoscopy (EGD)', reason: 'To examine stomach and upper digestive tract', prep: 'Fast 8-12 hours, arrange transport' },
    { name: 'Esophagogastroduodenoscopy', reason: 'To examine esophagus, stomach, and duodenum', prep: 'Fast 8-12 hours, throat numbing' },
    { name: 'Upper Endoscopy with Biopsy', reason: 'To sample tissue from upper digestive tract', prep: 'Fast 8-12 hours, arrange transport' },
    { name: 'Esophageal Dilation', reason: 'To stretch narrowed esophagus', prep: 'Fast 8-12 hours, sedation required' },
    { name: 'Variceal Band Ligation', reason: 'To treat bleeding esophageal varices', prep: 'Emergency procedure, fast if possible' },
    { name: 'Sclerotherapy', reason: 'To treat bleeding esophageal varices', prep: 'Injection during endoscopy' },
    { name: 'PEG Tube Placement', reason: 'To place feeding tube through stomach wall', prep: 'Fast 8-12 hours, antibiotics' },
    { name: 'Foreign Body Removal', reason: 'To remove swallowed objects', prep: 'Fast if possible, emergency procedure' },
    { name: 'Endoscopic Mucosal Resection', reason: 'To remove early cancers or large polyps', prep: 'Fast 8-12 hours, specialized procedure' },
    { name: 'Endoscopic Submucosal Dissection', reason: 'To remove large lesions from GI tract', prep: 'Fast 8-12 hours, advanced technique' },
    { name: 'Endoscopic Ultrasound (EUS)', reason: 'To evaluate deep layers of GI tract', prep: 'Fast 8-12 hours, ultrasound probe' },
    { name: 'EUS-Guided Fine Needle Aspiration', reason: 'To sample tissue guided by ultrasound', prep: 'Fast 8-12 hours, tissue sampling' },
    { name: 'Chromoendoscopy', reason: 'To enhance visualization of GI lining', prep: 'Dye spray during endoscopy' },
    { name: 'Narrow Band Imaging Upper GI', reason: 'To detect early cancer changes', prep: 'Enhanced imaging during endoscopy' },
    { name: 'Magnification Endoscopy', reason: 'To examine GI lining in detail', prep: 'High-magnification endoscopy' },

    // Lower GI Endoscopy (15 tests)
    { name: 'Colonoscopy', reason: 'To examine colon and detect polyps or cancer', prep: 'Bowel preparation as instructed, arrange transport' },
    { name: 'Screening Colonoscopy', reason: 'To screen for colon cancer in average risk patients', prep: 'Bowel preparation, age 45-50 or older' },
    { name: 'Diagnostic Colonoscopy', reason: 'To evaluate symptoms like bleeding or pain', prep: 'Bowel preparation as instructed' },
    { name: 'Colonoscopy with Polypectomy', reason: 'To remove colon polyps', prep: 'Bowel preparation, inform about blood thinners' },
    { name: 'Sigmoidoscopy', reason: 'To examine lower colon and rectum', prep: 'Enema or limited bowel prep' },
    { name: 'Flexible Sigmoidoscopy', reason: 'To examine sigmoid colon and rectum', prep: 'Fleet enema or limited prep' },
    { name: 'Proctoscopy', reason: 'To examine rectum and anal canal', prep: 'Enema or no preparation needed' },
    { name: 'Anoscopy', reason: 'To examine anal canal and lower rectum', prep: 'Usually no preparation needed' },
    { name: 'Balloon-Assisted Enteroscopy', reason: 'To examine small bowel', prep: 'Bowel preparation, specialized technique' },
    { name: 'Double-Balloon Enteroscopy', reason: 'To reach entire small bowel', prep: 'Bowel preparation, long procedure' },
    { name: 'Single-Balloon Enteroscopy', reason: 'To examine small bowel for bleeding', prep: 'Bowel preparation may be needed' },
    { name: 'Spiral Enteroscopy', reason: 'To examine small bowel with rotating scope', prep: 'Bowel preparation, newer technique' },
    { name: 'Capsule Endoscopy', reason: 'To examine small bowel by swallowing camera', prep: 'Fast 12 hours, swallow camera capsule' },
    { name: 'Colon Capsule Endoscopy', reason: 'To examine colon with swallowed camera', prep: 'Bowel preparation, swallow capsule' },
    { name: 'Virtual Colonoscopy (CT)', reason: 'To screen colon with CT scan', prep: 'Bowel preparation, CO2 insufflation' },

    // Specialized Endoscopy (15 tests)
    { name: 'ERCP', reason: 'To examine bile ducts and pancreatic ducts', prep: 'Fast 8-12 hours, arrange transport' },
    { name: 'Therapeutic ERCP', reason: 'To treat bile duct or pancreatic problems', prep: 'Fast 8-12 hours, antibiotics may be needed' },
    { name: 'Sphincterotomy', reason: 'To cut sphincter muscle during ERCP', prep: 'ERCP procedure, bleeding risk assessment' },
    { name: 'Biliary Stent Placement', reason: 'To drain blocked bile ducts', prep: 'ERCP procedure, may need antibiotics' },
    { name: 'Pancreatic Stent Placement', reason: 'To drain blocked pancreatic duct', prep: 'ERCP procedure with stent insertion' },
    { name: 'Stone Extraction (ERCP)', reason: 'To remove bile duct stones', prep: 'ERCP with stone removal tools' },
    { name: 'Balloon Dilation (ERCP)', reason: 'To open narrowed bile ducts', prep: 'ERCP with balloon catheter' },
    { name: 'Cholangioscopy', reason: 'To directly visualize bile ducts', prep: 'ERCP with small scope insertion' },
    { name: 'Pancreatoscopy', reason: 'To directly examine pancreatic duct', prep: 'ERCP with pancreatic scope' },
    { name: 'EUS of Pancreas', reason: 'To evaluate pancreatic masses or cysts', prep: 'Fast 8-12 hours, ultrasound endoscopy' },
    { name: 'Cystgastrostomy', reason: 'To drain pancreatic cysts', prep: 'EUS-guided drainage procedure' },
    { name: 'Celiac Plexus Block', reason: 'To treat pancreatic pain', prep: 'EUS-guided nerve block injection' },
    { name: 'Ampullectomy', reason: 'To remove ampullary tumors', prep: 'Specialized endoscopic resection' },
    { name: 'Endoscopic Necrosectomy', reason: 'To remove dead pancreatic tissue', prep: 'Advanced therapeutic procedure' },
    { name: 'Peroral Endoscopic Myotomy', reason: 'To treat swallowing disorders', prep: 'Fast 8-12 hours, advanced procedure' }
  ],
  'Specialized': [
    // Biopsy Procedures (20 tests)
    { name: 'Bone Marrow Biopsy', reason: 'To diagnose blood disorders or bone marrow diseases', prep: 'Local anesthesia, arrange transport' },
    { name: 'Bone Marrow Aspiration', reason: 'To sample bone marrow cells for analysis', prep: 'Local anesthesia, pressure after procedure' },
    { name: 'Skin Biopsy (Punch)', reason: 'To diagnose skin lesions or rule out skin cancer', prep: 'Local anesthesia, keep area clean' },
    { name: 'Skin Biopsy (Excisional)', reason: 'To completely remove skin lesions', prep: 'Local anesthesia, sutures required' },
    { name: 'Skin Biopsy (Shave)', reason: 'To sample raised skin lesions', prep: 'Local anesthesia, minimal scarring' },
    { name: 'Fine Needle Aspiration (FNA)', reason: 'To sample cells from lumps or masses', prep: 'Local anesthesia if needed' },
    { name: 'Core Needle Biopsy', reason: 'To obtain tissue samples from organs', prep: 'Local anesthesia, imaging guidance' },
    { name: 'Stereotactic Breast Biopsy', reason: 'To sample breast lesions with precision', prep: 'Mammography guidance, local anesthesia' },
    { name: 'MRI-Guided Breast Biopsy', reason: 'To sample breast lesions seen only on MRI', prep: 'MRI guidance, remove all metal' },
    { name: 'Vacuum-Assisted Breast Biopsy', reason: 'To sample multiple breast tissue areas', prep: 'Local anesthesia, pressure dressing' },
    { name: 'Lymph Node Biopsy', reason: 'To diagnose causes of enlarged lymph nodes', prep: 'Local or general anesthesia depending on site' },
    { name: 'Sentinel Lymph Node Biopsy', reason: 'To check if cancer has spread to lymph nodes', prep: 'Radioactive tracer injection' },
    { name: 'Liver Biopsy (Percutaneous)', reason: 'To diagnose liver diseases', prep: 'Local anesthesia, bleeding time assessment' },
    { name: 'Liver Biopsy (Transjugular)', reason: 'To sample liver when bleeding risk high', prep: 'Catheter through neck vein to liver' },
    { name: 'Kidney Biopsy', reason: 'To diagnose kidney diseases', prep: 'Local anesthesia, blood pressure control' },
    { name: 'Lung Biopsy (Transbronchial)', reason: 'To sample lung tissue through airways', prep: 'Bronchoscopy, chest X-ray after' },
    { name: 'Lung Biopsy (Percutaneous)', reason: 'To sample lung lesions through chest wall', prep: 'CT guidance, pneumothorax risk' },
    { name: 'Prostate Biopsy', reason: 'To diagnose prostate cancer', prep: 'Antibiotics, enema, ultrasound guidance' },
    { name: 'Thyroid Biopsy (FNA)', reason: 'To evaluate thyroid nodules', prep: 'Ultrasound guidance, local anesthesia' },
    { name: 'Muscle Biopsy', reason: 'To diagnose muscle diseases', prep: 'Local anesthesia, functional assessment' },

    // Neurological Tests (15 tests)
    { name: 'Lumbar Puncture (Spinal Tap)', reason: 'To examine spinal fluid for infections or diseases', prep: 'Lying flat for several hours after' },
    { name: 'EMG (Electromyography)', reason: 'To evaluate muscle electrical activity', prep: 'Avoid lotions, inform about blood thinners' },
    { name: 'Nerve Conduction Study (NCS)', reason: 'To evaluate nerve function and damage', prep: 'Avoid lotions, remove jewelry' },
    { name: 'EEG (Electroencephalography)', reason: 'To evaluate brain electrical activity and seizures', prep: 'Clean hair, avoid caffeine' },
    { name: 'Video EEG Monitoring', reason: 'To capture seizures with video and EEG', prep: 'Hospital admission, medication adjustment' },
    { name: 'Sleep EEG', reason: 'To record brain activity during sleep', prep: 'Sleep deprivation may be required' },
    { name: 'Ambulatory EEG', reason: 'To monitor brain activity at home', prep: 'Wear EEG recorder for 24-72 hours' },
    { name: 'Evoked Potentials (Visual)', reason: 'To test visual pathway function', prep: 'Look at pattern stimuli' },
    { name: 'Evoked Potentials (Auditory)', reason: 'To test hearing pathway function', prep: 'Headphones with sound stimuli' },
    { name: 'Evoked Potentials (Somatosensory)', reason: 'To test sensory pathway function', prep: 'Electrical stimulation of nerves' },
    { name: 'Transcranial Doppler', reason: 'To evaluate blood flow in brain arteries', prep: 'Ultrasound probe on skull' },
    { name: 'Carotid Ultrasound', reason: 'To evaluate neck artery blockages', prep: 'No special preparation needed' },
    { name: 'Vertebral Artery Ultrasound', reason: 'To assess vertebral artery flow', prep: 'Ultrasound of neck vessels' },
    { name: 'Single Fiber EMG', reason: 'To diagnose neuromuscular junction disorders', prep: 'Specialized EMG technique' },
    { name: 'Repetitive Nerve Stimulation', reason: 'To diagnose myasthenia gravis', prep: 'Repeated electrical stimulation' },

    // Other Specialized Tests (10 tests)
    { name: 'Audiometry', reason: 'To evaluate hearing loss and ear problems', prep: 'Clean ears, avoid loud noises before test' },
    { name: 'Tympanometry', reason: 'To test middle ear function', prep: 'Clean ear canal, avoid ear drops' },
    { name: 'Brainstem Auditory Evoked Response', reason: 'To test hearing in unconscious patients', prep: 'Electrodes on head, sound stimulation' },
    { name: 'Vestibular Function Test', reason: 'To evaluate balance and dizziness', prep: 'Avoid alcohol and sedatives' },
    { name: 'Electronystagmography (ENG)', reason: 'To evaluate balance system function', prep: 'Eye movement recording' },
    { name: 'Videonystagmography (VNG)', reason: 'To assess balance disorders with video', prep: 'Video recording of eye movements' },
    { name: 'Rotary Chair Test', reason: 'To evaluate balance system function', prep: 'Rotating chair with eye monitoring' },
    { name: 'Posturography', reason: 'To assess balance and fall risk', prep: 'Standing balance testing' },
    { name: 'Arthroscopy', reason: 'To examine and treat joint problems', prep: 'Arrange transport, post-procedure care' },
    { name: 'Laparoscopy', reason: 'To examine abdominal organs minimally invasively', prep: 'Fast 8-12 hours, general anesthesia' },
    
    // Additional Specialized Tests (15 tests)
    { name: 'Cerebrospinal Fluid Analysis', reason: 'To analyze spinal fluid for infections or diseases', prep: 'Lumbar puncture required, lying flat after' },
    { name: 'Synovial Fluid Analysis', reason: 'To analyze joint fluid for arthritis or infection', prep: 'Joint aspiration, sterile technique' },
    { name: 'Pleural Fluid Analysis', reason: 'To analyze fluid around lungs', prep: 'Thoracentesis procedure, chest X-ray after' },
    { name: 'Pericardial Fluid Analysis', reason: 'To analyze fluid around heart', prep: 'Pericardiocentesis, emergency procedure' },
    { name: 'Ascites Fluid Analysis', reason: 'To analyze abdominal fluid', prep: 'Paracentesis procedure, ultrasound guidance' },
    { name: 'Allergy Skin Testing (Environmental)', reason: 'To identify environmental allergens', prep: 'Stop antihistamines 7 days before' },
    { name: 'Food Challenge Test', reason: 'To diagnose food allergies under supervision', prep: 'Medical supervision, emergency equipment ready' },
    { name: 'Exercise Stress Test (Pulmonary)', reason: 'To evaluate breathing during exercise', prep: 'Comfortable clothes, avoid bronchodilators' },
    { name: 'Cold Agglutinin Test', reason: 'To diagnose cold-induced hemolytic anemia', prep: 'Keep sample warm during transport' },
    { name: 'Cryoglobulin Test', reason: 'To detect abnormal proteins in cold temperatures', prep: 'Keep sample at body temperature' },
    { name: 'Complement Levels (C3, C4)', reason: 'To evaluate immune system complement activity', prep: 'Blood sample, assess immune function' },
    { name: 'Antinuclear Antibody (ANA)', reason: 'To screen for autoimmune diseases', prep: 'Blood sample, multiple patterns possible' },
    { name: 'Anti-DNA Antibody', reason: 'To diagnose lupus and monitor activity', prep: 'Blood sample, specific for lupus' },
    { name: 'Rheumatoid Factor (RF)', reason: 'To diagnose rheumatoid arthritis', prep: 'Blood sample, not specific for RA alone' },
    { name: 'Anti-CCP Antibody', reason: 'To diagnose rheumatoid arthritis specifically', prep: 'Blood sample, more specific than RF' }
  ]
}

const URGENCY_OPTIONS = [
  { value: 'routine', label: 'Routine', description: 'Within 1-2 weeks', color: 'text-blue-600' },
  { value: 'urgent', label: 'Urgent', description: 'Within 24-48 hours', color: 'text-orange-600' },
  { value: 'stat', label: 'STAT', description: 'Immediate/Emergency', color: 'text-red-600' }
]

export function InvestigationOrdersForm({ consultationId, onNext, onPrevious }: InvestigationOrdersFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')
  
  // Loading states for quick tests
  const [loadingQuickTest, setLoadingQuickTest] = useState<string | null>(null)
  const [loadingPanel, setLoadingPanel] = useState<string | null>(null)
  

  const [formData, setFormData] = useState<InvestigationOrdersFormData>({
    investigations: []
  })

  // Auto-save functionality
  const { saveStatus, lastSaved, forceSave, error: autoSaveError } = useAutoSave(
    formData,
    'consultation_investigations',
    'consultation_id',
    consultationId,
    {
      delay: 2000,
      enabled: !loading && !!consultationId,
      onSave: async (data: InvestigationOrdersFormData) => {
        // Custom save logic for investigation orders
        const validInvestigations = data.investigations.filter(inv => 
          inv.investigation_type.trim() !== '' && inv.investigation_name.trim() !== ''
        )
        
        if (validInvestigations.length === 0) {
          return // Don't save empty investigations
        }

        // Delete existing orders first
        await supabase
          .from('investigation_orders')
          .delete()
          .eq('consultation_id', consultationId)

        // Insert new orders with correct database field mapping
        const ordersToInsert = validInvestigations.map(investigation => ({
          consultation_id: consultationId,
          investigation_type: investigation.investigation_type,
          investigation_name: investigation.investigation_name,
          clinical_indication: investigation.reason,
          urgency: investigation.urgency,
          instructions: investigation.notes,
          status: 'ordered',
          created_at: new Date().toISOString()
        }))

        const { error } = await supabase
          .from('investigation_orders')
          .insert(ordersToInsert)

        if (error) throw error
      },
      onError: (error) => {
        if (!error.message.includes('does not exist') && !error.message.includes('PGRST116')) {
          console.error('Auto-save failed:', error.message)
        }
      }
    }
  )

  // Load existing investigation orders
  useEffect(() => {
    const loadExistingOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('investigation_orders')
          .select('*')
          .eq('consultation_id', consultationId)

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        if (data && data.length > 0) {
          // Pre-populate form with existing data
          const investigations = data.map(order => ({
            investigation_type: order.investigation_type || '',
            investigation_name: order.investigation_name || '',
            reason: order.clinical_indication || '',
            urgency: (order.urgency || 'routine') as 'routine' | 'urgent' | 'stat',
            notes: order.instructions || ''
          }))
          
          setFormData({ investigations })
        }
      } catch (err) {
        console.error('Error loading investigation orders:', err)
      } finally {
        setLoading(false)
      }
    }

    loadExistingOrders()
  }, [consultationId, supabase])

  // Helper functions for managing form state
  const addInvestigation = () => {
    setFormData(prev => ({
      investigations: [...prev.investigations, {
        investigation_type: '',
        investigation_name: '',
        reason: '',
        urgency: 'routine' as const,
        notes: ''
      }]
    }))
  }

  // Helper function to add investigation with pre-filled data
  const addQuickInvestigation = async (category: string, testData: { name: string, reason: string, prep: string }, urgency: 'routine' | 'urgent' | 'stat' = 'routine') => {
    const testKey = `${category}-${testData.name}`
    
    try {
      setLoadingQuickTest(testKey)
      
      // Add to local state first
      const newInvestigation = {
        investigation_type: category,
        investigation_name: testData.name,
        reason: testData.reason,
        urgency: urgency,
        notes: testData.prep
      }
      
      setFormData(prev => ({
        investigations: [...prev.investigations, newInvestigation]
      }))
      
      // Save to database
      const { error } = await supabase
        .from('investigation_orders')
        .insert({
          consultation_id: consultationId,
          investigation_type: category,
          investigation_name: testData.name,
          clinical_indication: testData.reason,
          urgency: urgency,
          instructions: testData.prep
        })
      
      if (error) {
        // Remove from local state if database save failed
        setFormData(prev => ({
          investigations: prev.investigations.slice(0, -1)
        }))
        throw error
      }
      
    } catch (error) {
      console.error('Error adding quick investigation:', error)
      // Could show error message here if needed
    } finally {
      setLoadingQuickTest(null)
    }
  }

  // Helper function to add multiple investigations from a panel
  const addInvestigationPanel = async (panelName: string, tests: Array<{ category: string, test: string }>, urgency: 'routine' | 'urgent' | 'stat' = 'routine') => {
    try {
      setLoadingPanel(panelName)
      
      for (const { category, test } of tests) {
        const testData = INVESTIGATION_CATEGORIES[category as keyof typeof INVESTIGATION_CATEGORIES]?.find(t => t.name === test)
        if (testData) {
          await addQuickInvestigation(category, testData, urgency)
        }
      }
      
    } catch (error) {
      console.error('Error adding investigation panel:', error)
    } finally {
      setLoadingPanel(null)
    }
  }

  const removeInvestigation = async (index: number) => {
    try {
      const investigationToRemove = formData.investigations[index]
      
      // Delete from database first if investigation exists and has required data
      if (investigationToRemove?.investigation_name && investigationToRemove?.investigation_type) {
        const { error } = await supabase
          .from('investigation_orders')
          .delete()
          .eq('consultation_id', consultationId)
          .eq('investigation_name', investigationToRemove.investigation_name)
          .eq('investigation_type', investigationToRemove.investigation_type)
        
        if (error) {
          console.error('Database delete error:', error)
          throw error
        }
      }
      
      // Update local state after successful database deletion
      setFormData(prev => ({
        investigations: prev.investigations.filter((_, i) => i !== index)
      }))
      
    } catch (error) {
      console.error('Error removing investigation:', error)
    }
  }

  const updateInvestigation = (index: number, field: keyof InvestigationData, value: string) => {
    setFormData(prev => ({
      investigations: prev.investigations.map((investigation, i) => 
        i === index ? { ...investigation, [field]: value } : investigation
      )
    }))
  }

  // Filter tests based on search query
  const filterTests = (tests: Array<{ name: string, reason: string, prep: string }>) => {
    if (!searchQuery.trim()) return tests
    
    return tests.filter(test => 
      test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.reason.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const handleSubmit = async () => {
    // Check for incomplete investigations (partially filled)
    const incompleteInvestigations = formData.investigations.filter((inv) => {
      const hasType = inv.investigation_type.trim() !== ''
      const hasName = inv.investigation_name.trim() !== ''
      
      // If either field is filled, both must be filled
      if ((hasType && !hasName) || (!hasType && hasName)) {
        return true
      }
      return false
    })
    
    // Set errors for incomplete investigations
    if (incompleteInvestigations.length > 0) {
      const newErrors: Record<string, string> = {}
      formData.investigations.forEach((inv, index) => {
        const hasType = inv.investigation_type.trim() !== ''
        const hasName = inv.investigation_name.trim() !== ''
        
        if (hasType && !hasName) {
          newErrors[`investigation_${index}_name`] = 'Investigation name is required when category is selected'
        }
        if (!hasType && hasName) {
          newErrors[`investigation_${index}_type`] = 'Investigation category is required when name is selected'
        }
      })
      
      setErrors(newErrors)
      return // Block progression for incomplete investigations
    }
    
    // Get valid investigations (completely filled)
    const validInvestigations = formData.investigations.filter(inv => 
      inv.investigation_type.trim() !== '' && inv.investigation_name.trim() !== ''
    )

    try {
      setSaving(true)
      setErrors({})
      
      // Only force save if there are valid investigations
      if (validInvestigations.length > 0) {
        await forceSave()
      }
      
      onNext() // Always proceed regardless of whether investigations exist
    } catch (err) {
      console.error('Error saving investigation orders:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading investigation orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-teal-500" />
            <h3 className="text-lg font-semibold">Investigation Orders</h3>
            {formData.investigations.length > 0 && (
              <span className="text-sm bg-teal-100 text-teal-800 px-2 py-1 rounded-full font-medium">
                {formData.investigations.length} {formData.investigations.length === 1 ? 'test' : 'tests'} ordered
              </span>
            )}
          </div>
          <SaveStatusIndicator 
            status={saveStatus} 
            lastSaved={lastSaved} 
            error={autoSaveError}
            compact
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Order diagnostic tests and investigations based on clinical findings and differential diagnosis. Changes are automatically saved as you type.
        </p>
      </div>

      {/* Empty State */}
      {formData.investigations.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <FileSearch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No investigations ordered yet</h3>
            <p className="text-muted-foreground mb-4">
              Click the button below to add your first investigation, or use the Quick Add Tests section.
            </p>
            <Button onClick={addInvestigation} className="w-full max-w-xs">
              <Plus className="w-4 h-4 mr-2" />
              Add First Investigation
            </Button>
          </CardContent>
        </Card>
      )}

      {formData.investigations.map((investigation, investigationIndex) => (
        <Card key={investigationIndex} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSearch className="w-4 h-4" />
                {investigation.investigation_name || `Investigation ${investigationIndex + 1}`}
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeInvestigation(investigationIndex)}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Investigation Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Investigation Category</Label>
                <Select
                  value={investigation.investigation_type}
                  onValueChange={(value) => {
                    updateInvestigation(investigationIndex, 'investigation_type', value)
                    updateInvestigation(investigationIndex, 'investigation_name', '')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(INVESTIGATION_CATEGORIES).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors[`investigation_${investigationIndex}_type`] && (
                  <p className="text-sm text-destructive">
                    {errors[`investigation_${investigationIndex}_type`]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Investigation Name <span className="text-destructive">*</span></Label>
                <Select
                  value={investigation.investigation_name}
                  onValueChange={(value) => {
                    updateInvestigation(investigationIndex, 'investigation_name', value)
                    // Auto-fill reason and notes based on selected investigation
                    const categoryTests = INVESTIGATION_CATEGORIES[investigation.investigation_type as keyof typeof INVESTIGATION_CATEGORIES]
                    const selectedTest = categoryTests?.find(test => test.name === value)
                    if (selectedTest) {
                      updateInvestigation(investigationIndex, 'reason', selectedTest.reason)
                      updateInvestigation(investigationIndex, 'notes', selectedTest.prep)
                    }
                  }}
                  disabled={!investigation.investigation_type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select investigation" />
                  </SelectTrigger>
                  <SelectContent>
                    {investigation.investigation_type &&
                      INVESTIGATION_CATEGORIES[investigation.investigation_type as keyof typeof INVESTIGATION_CATEGORIES]?.map((investigationOption) => (
                        <SelectItem key={investigationOption.name} value={investigationOption.name}>
                          {investigationOption.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors[`investigation_${investigationIndex}_name`] && (
                  <p className="text-sm text-destructive">
                    {errors[`investigation_${investigationIndex}_name`]}
                  </p>
                )}
              </div>
            </div>

            {/* Urgency */}
            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select
                value={investigation.urgency}
                onValueChange={(value: 'routine' | 'urgent' | 'stat') => 
                  updateInvestigation(investigationIndex, 'urgency', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className={option.color}>{option.label}</span>
                        <span className="text-xs text-muted-foreground">({option.description})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clinical Reason and Additional Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`reason_${investigationIndex}`}>Clinical Reason <span className="text-muted-foreground">(Why is this investigation needed?)</span></Label>
                <Textarea
                  value={investigation.reason}
                  onChange={(e) => updateInvestigation(investigationIndex, 'reason', e.target.value)}
                  placeholder="Clinical indication and reason for investigation..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`notes_${investigationIndex}`}>Additional Notes</Label>
                <Textarea
                  value={investigation.notes}
                  onChange={(e) => updateInvestigation(investigationIndex, 'notes', e.target.value)}
                  placeholder="Special instructions, preparation notes, etc..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add Another Investigation */}
      {formData.investigations.length > 0 && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={addInvestigation}
            className="w-full max-w-xs"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Investigation
          </Button>
        </div>
      )}

      {/* Quick Single Investigation Selection - Redesigned for Better Readability */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Add Tests</CardTitle>
          <CardDescription>
            Click to instantly add tests with pre-filled details. Click sections to expand/collapse.
          </CardDescription>
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tests by name or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* All Tests in One Unified Grid - Scrollable */}
          <div className="max-h-96 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {/* Get all tests from all categories */}
            {Object.entries(INVESTIGATION_CATEGORIES).flatMap(([category, tests]) =>
              filterTests(tests).map((testData) => ({
                category,
                testData,
                color: category === 'Laboratory' ? 'blue' : 
                       category === 'Imaging' ? 'purple' : 
                       category === 'Cardiac' ? 'red' : 
                       category === 'Pulmonary' ? 'teal' : 
                       category === 'Endoscopy' ? 'indigo' : 
                       category === 'Dermatology' ? 'pink' :
                       category === 'Ophthalmology' ? 'cyan' :
                       category === 'ENT' ? 'lime' :
                       category === 'Gynecology' ? 'rose' :
                       category === 'Point-of-Care' ? 'orange' :
                       category === 'Genetics' ? 'emerald' :
                       category === 'Specialized' ? 'violet' : 'amber'
              }))
            ).map(({ category, testData, color }) => {
              const testKey = `${category}-${testData.name}`
              const isLoading = loadingQuickTest === testKey
              
              return (
                <Button
                  key={testKey}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className={`h-auto p-3 text-left transition-colors ${
                    isLoading ? 'opacity-50 cursor-not-allowed' :
                    color === 'blue' ? 'hover:bg-blue-50 hover:border-blue-300' :
                    color === 'purple' ? 'hover:bg-purple-50 hover:border-purple-300' :
                    color === 'red' ? 'hover:bg-red-50 hover:border-red-300' :
                    color === 'teal' ? 'hover:bg-teal-50 hover:border-teal-300' :
                    color === 'indigo' ? 'hover:bg-indigo-50 hover:border-indigo-300' :
                    color === 'pink' ? 'hover:bg-pink-50 hover:border-pink-300' :
                    color === 'cyan' ? 'hover:bg-cyan-50 hover:border-cyan-300' :
                    color === 'lime' ? 'hover:bg-lime-50 hover:border-lime-300' :
                    color === 'rose' ? 'hover:bg-rose-50 hover:border-rose-300' :
                    color === 'orange' ? 'hover:bg-orange-50 hover:border-orange-300' :
                    color === 'emerald' ? 'hover:bg-emerald-50 hover:border-emerald-300' :
                    color === 'violet' ? 'hover:bg-violet-50 hover:border-violet-300' :
                    'hover:bg-amber-50 hover:border-amber-300'
                  }`}
                  onClick={() => addQuickInvestigation(category, testData)}
                >
                  <div className="flex items-center gap-2">
                    {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    <div>
                      <div className="text-xs font-medium leading-tight">{testData.name}</div>
                      <div className="text-xs text-muted-foreground">{category}</div>
                    </div>
                  </div>
                </Button>
              )
            })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investigation Panels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Investigation Panels</CardTitle>
          <CardDescription>
            One-click to add complete investigation workups for common conditions. Click sections to expand/collapse.
          </CardDescription>
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search investigation panels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* All Investigation Panels in One Unified Grid - Scrollable */}
          <div className="max-h-96 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Create unified array of all panels */}
              {[
                // Emergency/Urgent Panels
                { name: 'Chest Pain/MI Workup', urgency: 'urgent', category: 'Emergency', tests: [
                  { category: 'Cardiac', test: 'ECG (12 Lead)' },
                  { category: 'Laboratory', test: 'Cardiac Enzymes' },
                  { category: 'Imaging', test: 'X-Ray Chest' },
                  { category: 'Cardiac', test: 'Echocardiography' }
                ]},
                { name: 'Stroke Workup', urgency: 'urgent', category: 'Emergency', tests: [
                  { category: 'Imaging', test: 'CT Scan Head' },
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Electrolytes (Na, K, Cl)' },
                  { category: 'Cardiac', test: 'ECG (12 Lead)' }
                ]},
                { name: 'Sepsis Workup', urgency: 'urgent', category: 'Emergency', tests: [
                  { category: 'Laboratory', test: 'Blood Culture' },
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'CRP' },
                  { category: 'Laboratory', test: 'Urine Culture' }
                ]},
                { name: 'Acute Abdomen Workup', urgency: 'urgent', category: 'Emergency', tests: [
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Amylase' },
                  { category: 'Laboratory', test: 'Lipase' },
                  { category: 'Imaging', test: 'CT Abdomen & Pelvis' },
                  { category: 'Point-of-Care', test: 'Urine Pregnancy Test' }
                ]},
                { name: 'Pulmonary Embolism Workup', urgency: 'urgent', category: 'Emergency', tests: [
                  { category: 'Laboratory', test: 'D-Dimer' },
                  { category: 'Imaging', test: 'CT Angiography (Chest)' },
                  { category: 'Cardiac', test: 'ECG (12 Lead)' },
                  { category: 'Laboratory', test: 'Troponin I' }
                ]},
                { name: 'Severe Headache Workup', urgency: 'urgent', category: 'Emergency', tests: [
                  { category: 'Imaging', test: 'CT Scan Head' },
                  { category: 'Specialized', test: 'Lumbar Puncture (Spinal Tap)' },
                  { category: 'Laboratory', test: 'ESR' },
                  { category: 'Laboratory', test: 'CRP' }
                ]},
                { name: 'Trauma Workup', urgency: 'urgent', category: 'Emergency', tests: [
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Liver Function Test' },
                  { category: 'Imaging', test: 'CT Scan Head' },
                  { category: 'Imaging', test: 'CT Chest' },
                  { category: 'Imaging', test: 'CT Abdomen & Pelvis' }
                ]},
                { name: 'Syncope Workup', urgency: 'urgent', category: 'Emergency', tests: [
                  { category: 'Cardiac', test: 'ECG (12 Lead)' },
                  { category: 'Laboratory', test: 'Electrolytes (Na, K, Cl)' },
                  { category: 'Point-of-Care', test: 'Blood Glucose (Fingerstick)' },
                  { category: 'Cardiac', test: 'Echocardiography' }
                ]},
                // Common Condition Panels
                { name: 'Diabetes Workup', urgency: 'routine', category: 'Common', tests: [
                  { category: 'Laboratory', test: 'Blood Sugar (Fasting)' },
                  { category: 'Laboratory', test: 'HbA1c' },
                  { category: 'Laboratory', test: 'Urine Routine' },
                  { category: 'Laboratory', test: 'Lipid Profile' }
                ]},
                { name: 'Hypertension Workup', urgency: 'routine', category: 'Common', tests: [
                  { category: 'Cardiac', test: 'ECG (12 Lead)' },
                  { category: 'Laboratory', test: 'Kidney Function Test' },
                  { category: 'Laboratory', test: 'Electrolytes (Na, K, Cl)' },
                  { category: 'Cardiac', test: 'Echocardiography' }
                ]},
                { name: 'Thyroid Workup', urgency: 'routine', category: 'Common', tests: [
                  { category: 'Laboratory', test: 'Thyroid Function Test' },
                  { category: 'Imaging', test: 'Ultrasound Thyroid' }
                ]},
                { name: 'Anemia Workup', urgency: 'routine', category: 'Common', tests: [
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Iron Studies' },
                  { category: 'Laboratory', test: 'Vitamin B12' },
                  { category: 'Laboratory', test: 'Stool Routine' }
                ]},
                { name: 'Kidney Disease Workup', urgency: 'routine', category: 'Common', tests: [
                  { category: 'Laboratory', test: 'Kidney Function Test' },
                  { category: 'Laboratory', test: 'Electrolytes (Na, K, Cl)' },
                  { category: 'Laboratory', test: 'Urine Routine' },
                  { category: 'Imaging', test: 'Ultrasound Kidney' },
                  { category: 'Laboratory', test: 'Urine Culture' }
                ]},
                { name: 'Heart Failure Workup', urgency: 'routine', category: 'Common', tests: [
                  { category: 'Cardiac', test: 'BNP (B-type Natriuretic Peptide)' },
                  { category: 'Cardiac', test: 'Echocardiography' },
                  { category: 'Cardiac', test: 'ECG (12 Lead)' },
                  { category: 'Imaging', test: 'X-Ray Chest' }
                ]},
                { name: 'COPD/Asthma Workup', urgency: 'routine', category: 'Common', tests: [
                  { category: 'Pulmonary', test: 'Spirometry' },
                  { category: 'Imaging', test: 'X-Ray Chest' },
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Pulmonary', test: 'Arterial Blood Gas (ABG)' }
                ]},
                { name: 'Osteoporosis Screening', urgency: 'routine', category: 'Common', tests: [
                  { category: 'Imaging', test: 'DEXA Scan' },
                  { category: 'Laboratory', test: 'Calcium' },
                  { category: 'Laboratory', test: 'Vitamin D' },
                  { category: 'Laboratory', test: 'Phosphorus' }
                ]},
                { name: 'Depression/Anxiety Workup', urgency: 'routine', category: 'Common', tests: [
                  { category: 'Laboratory', test: 'Thyroid Function Test' },
                  { category: 'Laboratory', test: 'Vitamin B12' },
                  { category: 'Laboratory', test: 'Vitamin D' },
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' }
                ]},
                { name: 'Chronic Fatigue Workup', urgency: 'routine', category: 'Common', tests: [
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Thyroid Function Test' },
                  { category: 'Laboratory', test: 'Vitamin B12' },
                  { category: 'Laboratory', test: 'Vitamin D' },
                  { category: 'Laboratory', test: 'Iron Studies' },
                  { category: 'Laboratory', test: 'ESR' }
                ]},
                { name: 'Joint Pain Workup', urgency: 'routine', category: 'Common', tests: [
                  { category: 'Laboratory', test: 'ESR' },
                  { category: 'Laboratory', test: 'CRP' },
                  { category: 'Specialized', test: 'Rheumatoid Factor (RF)' },
                  { category: 'Specialized', test: 'Anti-CCP Antibody' },
                  { category: 'Laboratory', test: 'Uric Acid' }
                ]},
                { name: 'Weight Loss Workup', urgency: 'routine', category: 'Common', tests: [
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Thyroid Function Test' },
                  { category: 'Laboratory', test: 'Blood Sugar (Fasting)' },
                  { category: 'Imaging', test: 'CT Chest' },
                  { category: 'Imaging', test: 'CT Abdomen & Pelvis' }
                ]},
                // Health Screening Panels
                { name: 'Basic Health Screening', urgency: 'routine', category: 'Screening', tests: [
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Blood Sugar (Fasting)' },
                  { category: 'Laboratory', test: 'Kidney Function Test' },
                  { category: 'Laboratory', test: 'Liver Function Test' },
                  { category: 'Laboratory', test: 'Lipid Profile' },
                  { category: 'Laboratory', test: 'Thyroid Function Test' },
                  { category: 'Cardiac', test: 'ECG (12 Lead)' }
                ]},
                { name: 'Cancer Screening (Basic)', urgency: 'routine', category: 'Screening', tests: [
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Imaging', test: 'X-Ray Chest' },
                  { category: 'Imaging', test: 'Ultrasound Abdomen' },
                  { category: 'Imaging', test: 'Mammography' }
                ]},
                { name: 'Cardiovascular Risk Screening', urgency: 'routine', category: 'Screening', tests: [
                  { category: 'Laboratory', test: 'Lipid Profile' },
                  { category: 'Laboratory', test: 'Blood Sugar (Fasting)' },
                  { category: 'Cardiac', test: 'ECG (12 Lead)' },
                  { category: 'Laboratory', test: 'hs-CRP (High Sensitivity CRP)' }
                ]},
                { name: 'Bone Health Screening', urgency: 'routine', category: 'Screening', tests: [
                  { category: 'Imaging', test: 'DEXA Scan (Spine)' },
                  { category: 'Imaging', test: 'DEXA Scan (Hip)' },
                  { category: 'Laboratory', test: 'Calcium' },
                  { category: 'Laboratory', test: 'Vitamin D' }
                ]},
                { name: 'Executive Health Checkup', urgency: 'routine', category: 'Screening', tests: [
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Liver Function Test' },
                  { category: 'Laboratory', test: 'Kidney Function Test' },
                  { category: 'Laboratory', test: 'Lipid Profile' },
                  { category: 'Laboratory', test: 'Thyroid Function Test' },
                  { category: 'Cardiac', test: 'Stress Test (TMT)' },
                  { category: 'Imaging', test: 'Ultrasound Abdomen' }
                ]},
                { name: 'Diabetes Risk Screening', urgency: 'routine', category: 'Screening', tests: [
                  { category: 'Laboratory', test: 'Blood Sugar (Fasting)' },
                  { category: 'Laboratory', test: 'HbA1c' },
                  { category: 'Laboratory', test: 'Glucose Tolerance Test (GTT)' },
                  { category: 'Laboratory', test: 'Insulin (Fasting)' }
                ]},
                { name: 'Infectious Disease Screening', urgency: 'routine', category: 'Screening', tests: [
                  { category: 'Laboratory', test: 'Hepatitis B Surface Antigen (HBsAg)' },
                  { category: 'Laboratory', test: 'Hepatitis C Antibody' },
                  { category: 'Laboratory', test: 'HIV 1 & 2' },
                  { category: 'Laboratory', test: 'VDRL/RPR' }
                ]},
                { name: 'Geriatric Screening', urgency: 'routine', category: 'Screening', tests: [
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Vitamin B12' },
                  { category: 'Laboratory', test: 'Vitamin D' },
                  { category: 'Imaging', test: 'DEXA Scan' },
                  { category: 'Ophthalmology', test: 'Visual Acuity Test' },
                  { category: 'ENT', test: 'Pure Tone Audiometry' }
                ]},
                // New Specialty Panels
                { name: 'Skin Lesion Workup', urgency: 'routine', category: 'Dermatology', tests: [
                  { category: 'Dermatology', test: 'Dermoscopy (Dermatoscopy)' },
                  { category: 'Dermatology', test: 'Skin Biopsy (Punch)' },
                  { category: 'Dermatology', test: 'Digital Photography (Mole Mapping)' }
                ]},
                { name: 'Eye Examination Panel', urgency: 'routine', category: 'Ophthalmology', tests: [
                  { category: 'Ophthalmology', test: 'Visual Acuity Test' },
                  { category: 'Ophthalmology', test: 'Tonometry (Eye Pressure)' },
                  { category: 'Ophthalmology', test: 'Fundoscopy (Ophthalmoscopy)' },
                  { category: 'Ophthalmology', test: 'Visual Field Test (Perimetry)' }
                ]},
                { name: 'Hearing Loss Workup', urgency: 'routine', category: 'ENT', tests: [
                  { category: 'ENT', test: 'Pure Tone Audiometry' },
                  { category: 'ENT', test: 'Tympanometry' },
                  { category: 'ENT', test: 'Brainstem Auditory Evoked Response (BAER)' }
                ]},
                { name: 'Women\'s Health Screening', urgency: 'routine', category: 'Gynecology', tests: [
                  { category: 'Gynecology', test: 'Pap Smear (Cervical Cytology)' },
                  { category: 'Gynecology', test: 'Pelvic Ultrasound (Transabdominal)' },
                  { category: 'Imaging', test: 'Mammography' },
                  { category: 'Laboratory', test: 'CA-125 (Cancer Antigen)' }
                ]},
                { name: 'Emergency Point-of-Care Panel', urgency: 'urgent', category: 'Point-of-Care', tests: [
                  { category: 'Point-of-Care', test: 'Blood Glucose (Fingerstick)' },
                  { category: 'Point-of-Care', test: 'Troponin Point-of-Care' },
                  { category: 'Point-of-Care', test: 'BNP Point-of-Care' },
                  { category: 'Point-of-Care', test: 'INR Point-of-Care' }
                ]},
                { name: 'Genetic Counseling Panel', urgency: 'routine', category: 'Genetics', tests: [
                  { category: 'Genetics', test: 'BRCA1/BRCA2 Gene Testing' },
                  { category: 'Genetics', test: 'Lynch Syndrome Testing' },
                  { category: 'Genetics', test: 'Karyotype (Chromosome Analysis)' }
                ]},
                { name: 'COVID-19 Testing Panel', urgency: 'routine', category: 'Infectious Disease', tests: [
                  { category: 'Laboratory', test: 'COVID-19 PCR Test' },
                  { category: 'Laboratory', test: 'COVID-19 Antibody Test' },
                  { category: 'Point-of-Care', test: 'COVID-19 Rapid Antigen Test' }
                ]},
                { name: 'Autoimmune Disease Panel', urgency: 'routine', category: 'Specialized', tests: [
                  { category: 'Specialized', test: 'Antinuclear Antibody (ANA)' },
                  { category: 'Specialized', test: 'Anti-DNA Antibody' },
                  { category: 'Specialized', test: 'Rheumatoid Factor (RF)' },
                  { category: 'Specialized', test: 'Anti-CCP Antibody' }
                ]},
                // Additional Specialty-Specific Panels
                { name: 'Fertility Workup (Female)', urgency: 'routine', category: 'Gynecology', tests: [
                  { category: 'Gynecology', test: 'AMH (Anti-Mullerian Hormone)' },
                  { category: 'Laboratory', test: 'FSH (Follicle Stimulating Hormone)' },
                  { category: 'Laboratory', test: 'LH (Luteinizing Hormone)' },
                  { category: 'Gynecology', test: 'Hysterosalpingography (HSG)' },
                  { category: 'Imaging', test: 'Ultrasound Follicular Study' }
                ]},
                { name: 'Male Hormone Panel', urgency: 'routine', category: 'Laboratory', tests: [
                  { category: 'Laboratory', test: 'Testosterone (Total)' },
                  { category: 'Laboratory', test: 'Testosterone (Free)' },
                  { category: 'Laboratory', test: 'LH (Luteinizing Hormone)' },
                  { category: 'Laboratory', test: 'FSH (Follicle Stimulating Hormone)' },
                  { category: 'Laboratory', test: 'Prolactin' }
                ]},
                { name: 'Allergy Testing Panel', urgency: 'routine', category: 'Specialized', tests: [
                  { category: 'Dermatology', test: 'Skin Prick Test (Allergies)' },
                  { category: 'Specialized', test: 'Allergy Skin Testing (Environmental)' },
                  { category: 'Specialized', test: 'Food Challenge Test' },
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' }
                ]},
                { name: 'Cardiac Risk Assessment', urgency: 'routine', category: 'Cardiac', tests: [
                  { category: 'Cardiac', test: 'Stress Test (TMT)' },
                  { category: 'Cardiac', test: 'Echocardiography' },
                  { category: 'Laboratory', test: 'Lipid Profile' },
                  { category: 'Laboratory', test: 'hs-CRP (High Sensitivity CRP)' },
                  { category: 'Laboratory', test: 'Homocysteine' }
                ]},
                { name: 'Sleep Disorder Workup', urgency: 'routine', category: 'Pulmonary', tests: [
                  { category: 'Pulmonary', test: 'Overnight Sleep Study (PSG)' },
                  { category: 'Laboratory', test: 'Thyroid Function Test' },
                  { category: 'ENT', test: 'Nasal Endoscopy' },
                  { category: 'Imaging', test: 'X-Ray Neck' }
                ]},
                { name: 'Memory Loss/Dementia Workup', urgency: 'routine', category: 'Specialized', tests: [
                  { category: 'Imaging', test: 'MRI Brain' },
                  { category: 'Laboratory', test: 'Thyroid Function Test' },
                  { category: 'Laboratory', test: 'Vitamin B12' },
                  { category: 'Specialized', test: 'Lumbar Puncture (Spinal Tap)' }
                ]},
                { name: 'Liver Disease Workup', urgency: 'routine', category: 'Laboratory', tests: [
                  { category: 'Laboratory', test: 'Liver Function Test' },
                  { category: 'Laboratory', test: 'Hepatitis B Surface Antigen (HBsAg)' },
                  { category: 'Laboratory', test: 'Hepatitis C Antibody' },
                  { category: 'Imaging', test: 'Ultrasound Liver' },
                  { category: 'Laboratory', test: 'Alpha-1 Antitrypsin Level' }
                ]},
                { name: 'Gastrointestinal Bleeding Workup', urgency: 'urgent', category: 'Endoscopy', tests: [
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Point-of-Care', test: 'Fecal Occult Blood Test' },
                  { category: 'Endoscopy', test: 'Upper GI Endoscopy (EGD)' },
                  { category: 'Endoscopy', test: 'Colonoscopy' }
                ]},
                { name: 'Bone Pain/Cancer Screening', urgency: 'routine', category: 'Imaging', tests: [
                  { category: 'Imaging', test: 'Bone Scan' },
                  { category: 'Laboratory', test: 'Alkaline Phosphatase' },
                  { category: 'Laboratory', test: 'Calcium' },
                  { category: 'Imaging', test: 'X-Ray (affected area)' }
                ]},
                { name: 'Neurological Deficit Workup', urgency: 'urgent', category: 'Specialized', tests: [
                  { category: 'Imaging', test: 'MRI Brain' },
                  { category: 'Specialized', test: 'EMG (Electromyography)' },
                  { category: 'Specialized', test: 'Nerve Conduction Study (NCS)' },
                  { category: 'Laboratory', test: 'Vitamin B12' }
                ]},
                { name: 'Kidney Stone Workup', urgency: 'routine', category: 'Imaging', tests: [
                  { category: 'Imaging', test: 'CT Urography' },
                  { category: 'Laboratory', test: 'Kidney Function Test' },
                  { category: 'Laboratory', test: 'Calcium' },
                  { category: 'Laboratory', test: 'Uric Acid' },
                  { category: 'Laboratory', test: 'Urine Routine' }
                ]},
                { name: 'Pregnancy Monitoring Panel', urgency: 'routine', category: 'Gynecology', tests: [
                  { category: 'Point-of-Care', test: 'Urine Pregnancy Test' },
                  { category: 'Imaging', test: 'Ultrasound Pregnancy (First Trimester)' },
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Blood Group & Rh Typing' }
                ]},
                // ENT Specialty Panels
                { name: 'Hearing Loss Evaluation', urgency: 'routine', category: 'ENT', tests: [
                  { category: 'ENT', test: 'Pure Tone Audiometry' },
                  { category: 'ENT', test: 'Tympanometry' },
                  { category: 'ENT', test: 'Brainstem Auditory Evoked Response (BAER)' },
                  { category: 'Imaging', test: 'MRI Temporal Joint (TMJ)' }
                ]},
                { name: 'Chronic Sinusitis Workup', urgency: 'routine', category: 'ENT', tests: [
                  { category: 'Imaging', test: 'CT Sinus' },
                  { category: 'ENT', test: 'Nasal Endoscopy' },
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Specialized', test: 'Allergy Skin Testing (Environmental)' }
                ]},
                { name: 'Voice Disorder Workup', urgency: 'routine', category: 'ENT', tests: [
                  { category: 'ENT', test: 'Laryngoscopy (Flexible)' },
                  { category: 'ENT', test: 'Laryngoscopy (Direct)' },
                  { category: 'Laboratory', test: 'Thyroid Function Test' },
                  { category: 'Imaging', test: 'CT Neck' }
                ]},
                { name: 'Vertigo/Dizziness Workup', urgency: 'routine', category: 'ENT', tests: [
                  { category: 'ENT', test: 'Vestibular Function Test' },
                  { category: 'ENT', test: 'Electronystagmography (ENG)' },
                  { category: 'ENT', test: 'Videonystagmography (VNG)' },
                  { category: 'Imaging', test: 'MRI Brain' }
                ]},
                { name: 'Throat Pain/Cancer Screening', urgency: 'routine', category: 'ENT', tests: [
                  { category: 'ENT', test: 'Laryngoscopy (Flexible)' },
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Point-of-Care', test: 'Rapid Strep Test' },
                  { category: 'Imaging', test: 'CT Neck' }
                ]},
                // Dental Specialty Panels
                { name: 'Dental Infection Workup', urgency: 'routine', category: 'Dental', tests: [
                  { category: 'Imaging', test: 'X-Ray Mandible' },
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'CRP' },
                  { category: 'Laboratory', test: 'Blood Culture' }
                ]},
                { name: 'Pre-Surgical Dental Assessment', urgency: 'routine', category: 'Dental', tests: [
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Prothrombin Time (PT)' },
                  { category: 'Laboratory', test: 'Partial Thromboplastin Time (PTT)' },
                  { category: 'Imaging', test: 'X-Ray Mandible' }
                ]},
                { name: 'Oral Cancer Screening', urgency: 'routine', category: 'Dental', tests: [
                  { category: 'Specialized', test: 'Fine Needle Aspiration (FNA)' },
                  { category: 'Imaging', test: 'CT Neck' },
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Imaging', test: 'X-Ray Mandible' }
                ]},
                { name: 'TMJ Disorder Workup', urgency: 'routine', category: 'Dental', tests: [
                  { category: 'Imaging', test: 'MRI Temporal Joint (TMJ)' },
                  { category: 'Imaging', test: 'X-Ray Mandible' },
                  { category: 'Laboratory', test: 'ESR' },
                  { category: 'Laboratory', test: 'CRP' }
                ]},
                { name: 'Dental Implant Assessment', urgency: 'routine', category: 'Dental', tests: [
                  { category: 'Imaging', test: 'CT Sinus' },
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Blood Sugar (Fasting)' },
                  { category: 'Imaging', test: 'DEXA Scan' }
                ]},
                // Plastic Surgery Panels
                { name: 'Pre-Operative Plastic Surgery', urgency: 'routine', category: 'Plastic Surgery', tests: [
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Prothrombin Time (PT)' },
                  { category: 'Laboratory', test: 'Partial Thromboplastin Time (PTT)' },
                  { category: 'Cardiac', test: 'ECG (12 Lead)' },
                  { category: 'Imaging', test: 'X-Ray Chest' }
                ]},
                { name: 'Breast Reconstruction Assessment', urgency: 'routine', category: 'Plastic Surgery', tests: [
                  { category: 'Imaging', test: 'Mammography' },
                  { category: 'Imaging', test: 'MRI Chest' },
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Genetics', test: 'BRCA1/BRCA2 Gene Testing' }
                ]},
                { name: 'Skin Lesion/Melanoma Screening', urgency: 'routine', category: 'Plastic Surgery', tests: [
                  { category: 'Dermatology', test: 'Dermoscopy (Dermatoscopy)' },
                  { category: 'Dermatology', test: 'Skin Biopsy (Excisional)' },
                  { category: 'Imaging', test: 'Ultrasound Lymph Nodes' },
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' }
                ]},
                { name: 'Burn Assessment Panel', urgency: 'urgent', category: 'Plastic Surgery', tests: [
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Electrolytes (Na, K, Cl)' },
                  { category: 'Laboratory', test: 'Kidney Function Test' },
                  { category: 'Laboratory', test: 'Total Protein' }
                ]},
                { name: 'Cosmetic Surgery Assessment', urgency: 'routine', category: 'Plastic Surgery', tests: [
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Liver Function Test' },
                  { category: 'Laboratory', test: 'Thyroid Function Test' },
                  { category: 'Laboratory', test: 'Blood Sugar (Fasting)' }
                ]},
                { name: 'Wound Healing Assessment', urgency: 'routine', category: 'Plastic Surgery', tests: [
                  { category: 'Laboratory', test: 'Complete Blood Count (CBC)' },
                  { category: 'Laboratory', test: 'Total Protein' },
                  { category: 'Laboratory', test: 'Albumin' },
                  { category: 'Laboratory', test: 'Vitamin C (Ascorbic Acid)' },
                  { category: 'Laboratory', test: 'Zinc' }
                ]}
              ].filter(panel => !searchQuery.trim() || 
                panel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                panel.category.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(panel => {
                const isPanelLoading = loadingPanel === panel.name
                
                return (
                  <Button
                    key={panel.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPanelLoading}
                    className={`justify-start h-auto p-3 text-left transition-colors ${
                      isPanelLoading ? 'opacity-50 cursor-not-allowed' :
                      panel.category === 'Emergency' ? 'border-red-300 hover:bg-red-50' :
                      panel.category === 'Common' ? 'border-blue-300 hover:bg-blue-50' :
                      panel.category === 'Screening' ? 'border-green-300 hover:bg-green-50' :
                      panel.category === 'Dermatology' ? 'border-pink-300 hover:bg-pink-50' :
                      panel.category === 'Ophthalmology' ? 'border-cyan-300 hover:bg-cyan-50' :
                      panel.category === 'ENT' ? 'border-lime-300 hover:bg-lime-50' :
                      panel.category === 'Gynecology' ? 'border-rose-300 hover:bg-rose-50' :
                      panel.category === 'Point-of-Care' ? 'border-orange-300 hover:bg-orange-50' :
                      panel.category === 'Genetics' ? 'border-emerald-300 hover:bg-emerald-50' :
                      panel.category === 'Specialized' ? 'border-violet-300 hover:bg-violet-50' :
                      panel.category === 'Infectious Disease' ? 'border-yellow-300 hover:bg-yellow-50' :
                      panel.category === 'ENT' ? 'border-lime-300 hover:bg-lime-50' :
                      panel.category === 'Dental' ? 'border-amber-300 hover:bg-amber-50' :
                      panel.category === 'Plastic Surgery' ? 'border-sky-300 hover:bg-sky-50' :
                      'border-purple-300 hover:bg-purple-50'
                    }`}
                    onClick={() => addInvestigationPanel(panel.name, panel.tests, panel.urgency as 'routine' | 'urgent')}
                  >
                    <div className="flex items-center gap-2">
                      {isPanelLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                      <div>
                        <div className="text-xs font-medium leading-tight">{panel.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {panel.tests.length} tests • {panel.category}
                          {panel.urgency === 'urgent' && ' • Urgent'}
                        </div>
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Form Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} type="button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back: Diagnosis
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="min-w-[140px]"
        >
          {saving ? 'Saving...' : (
            <>
              Next: Treatment Plan
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Form Errors */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <FileSearch className="h-4 w-4" />
          <AlertDescription>
            Please check the investigation orders for errors and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
