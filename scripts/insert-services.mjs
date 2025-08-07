/**
 * Comprehensive Service Data Insertion Script
 * Inserts all ENT, Dental, and Cosmetic services into the database
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Comprehensive service definitions
const services = [
  // ENT - EAR Services
  {
    name: 'Endoscopy With Suction Irrigation',
    category: 'procedure',
    department: 'ENT',
    price: 2500,
    duration: 45,
    description: 'Ear endoscopy with suction and irrigation for cleaning and examination'
  },
  {
    name: 'Foreign Body Removal - Ear',
    category: 'ENT',
    subcategory: 'Ear',
    price: 3000,
    duration: 30,
    description: 'Safe removal of foreign objects from the ear canal'
  },
  {
    name: 'Ear Biopsy',
    category: 'ENT',
    subcategory: 'Ear',
    price: 4000,
    duration: 60,
    description: 'Tissue sample collection from ear for diagnostic purposes'
  },
  {
    name: 'Microscopy - Ear',
    category: 'ENT',
    subcategory: 'Ear',
    price: 2000,
    duration: 30,
    description: 'Microscopic examination of ear structures'
  },
  {
    name: 'Myringotomy',
    category: 'ENT',
    subcategory: 'Ear',
    price: 8000,
    duration: 45,
    description: 'Surgical incision in the eardrum to relieve pressure'
  },
  {
    name: 'Myringotomy with Grommet',
    category: 'ENT',
    subcategory: 'Ear',
    price: 12000,
    duration: 60,
    description: 'Myringotomy with insertion of ventilation tube'
  },
  {
    name: 'Pinnaplasty',
    category: 'ENT',
    subcategory: 'Ear',
    price: 25000,
    duration: 120,
    description: 'Cosmetic surgery to reshape protruding ears'
  },
  {
    name: 'Myringoplasty',
    category: 'ENT',
    subcategory: 'Ear',
    price: 18000,
    duration: 90,
    description: 'Surgical repair of perforated eardrum'
  },
  {
    name: 'Tympanoplasty',
    category: 'ENT',
    subcategory: 'Ear',
    price: 35000,
    duration: 150,
    description: 'Surgical reconstruction of the eardrum and small bones'
  },
  {
    name: 'Mastoidectomy',
    category: 'ENT',
    subcategory: 'Ear',
    price: 45000,
    duration: 180,
    description: 'Surgical removal of diseased mastoid air cells'
  },
  {
    name: 'Stapedotomy',
    category: 'ENT',
    subcategory: 'Ear',
    price: 55000,
    duration: 120,
    description: 'Surgery to improve hearing by replacing the stapes bone'
  },
  {
    name: 'Cochlear Implant (Government Scheme)',
    category: 'ENT',
    subcategory: 'Ear',
    price: 0,
    duration: 240,
    description: 'Cochlear implant surgery covered under government scheme'
  },

  // ENT - NOSE Services
  {
    name: 'Nasal Cautery for Allergy/Epistaxis',
    category: 'ENT',
    subcategory: 'Nose',
    price: 3500,
    duration: 30,
    description: 'Nasal cauterization for treating allergies and nosebleeds'
  },
  {
    name: 'Septoplasty',
    category: 'ENT',
    subcategory: 'Nose',
    price: 25000,
    duration: 90,
    description: 'Surgical correction of deviated nasal septum'
  },
  {
    name: 'Turbinoplasty',
    category: 'ENT',
    subcategory: 'Nose',
    price: 20000,
    duration: 75,
    description: 'Surgical reduction of enlarged nasal turbinates'
  },
  {
    name: 'Conchoplasty',
    category: 'ENT',
    subcategory: 'Nose',
    price: 18000,
    duration: 60,
    description: 'Surgical reshaping of nasal concha for better airflow'
  },
  {
    name: 'Rhinoplasty',
    category: 'ENT',
    subcategory: 'Nose',
    price: 45000,
    duration: 150,
    description: 'Cosmetic and functional nose surgery'
  },
  {
    name: 'Anterior FESS',
    category: 'ENT',
    subcategory: 'Nose',
    price: 30000,
    duration: 120,
    description: 'Anterior functional endoscopic sinus surgery'
  },
  {
    name: 'Total FESS (Sinus Surgery)',
    category: 'ENT',
    subcategory: 'Nose',
    price: 50000,
    duration: 180,
    description: 'Complete functional endoscopic sinus surgery'
  },
  {
    name: 'Foreign Body Removal - Nose',
    category: 'ENT',
    subcategory: 'Nose',
    price: 2500,
    duration: 30,
    description: 'Safe removal of foreign objects from nasal cavity'
  },
  {
    name: 'Nasal Bone Fracture Repair',
    category: 'ENT',
    subcategory: 'Nose',
    price: 35000,
    duration: 120,
    description: 'Surgical repair of fractured nasal bones'
  },
  {
    name: 'Nasal Polypectomy',
    category: 'ENT',
    subcategory: 'Nose',
    price: 15000,
    duration: 60,
    description: 'Surgical removal of nasal polyps'
  },
  {
    name: 'Nasal Hemangioma Removal',
    category: 'ENT',
    subcategory: 'Nose',
    price: 20000,
    duration: 90,
    description: 'Surgical removal of nasal blood vessel tumors'
  },
  {
    name: 'Juvenile Nasopharyngeal Angiofibroma',
    category: 'ENT',
    subcategory: 'Nose',
    price: 60000,
    duration: 240,
    description: 'Complex surgery for benign nasopharyngeal tumor'
  },
  {
    name: 'Nasal Biopsy',
    category: 'ENT',
    subcategory: 'Nose',
    price: 3500,
    duration: 45,
    description: 'Tissue sample collection from nasal area for diagnosis'
  },

  // ENT - THROAT & LARYNX Services
  {
    name: 'Oral Biopsy',
    category: 'ENT',
    subcategory: 'Throat',
    price: 4000,
    duration: 45,
    description: 'Tissue sample collection from oral cavity'
  },
  {
    name: 'Tonsillectomy',
    category: 'ENT',
    subcategory: 'Throat',
    price: 20000,
    duration: 75,
    description: 'Surgical removal of tonsils'
  },
  {
    name: 'Adenoidectomy',
    category: 'ENT',
    subcategory: 'Throat',
    price: 18000,
    duration: 60,
    description: 'Surgical removal of adenoids'
  },
  {
    name: 'Tonsil & Adenoid (TAR)',
    category: 'ENT',
    subcategory: 'Throat',
    price: 30000,
    duration: 90,
    description: 'Combined tonsil and adenoid removal'
  },
  {
    name: 'Peritonsillar Abscess/Quinsy Drainage',
    category: 'ENT',
    subcategory: 'Throat',
    price: 8000,
    duration: 45,
    description: 'Drainage of infected tissue around tonsils'
  },
  {
    name: 'Uvuloplasty',
    category: 'ENT',
    subcategory: 'Throat',
    price: 15000,
    duration: 60,
    description: 'Surgical reshaping of uvula for sleep apnea'
  },
  {
    name: 'Uvulopalatoplasty',
    category: 'ENT',
    subcategory: 'Throat',
    price: 25000,
    duration: 90,
    description: 'Surgery on uvula and soft palate'
  },
  {
    name: 'Tongue Tie Release',
    category: 'ENT',
    subcategory: 'Throat',
    price: 5000,
    duration: 30,
    description: 'Surgical correction of ankyloglossia'
  },
  {
    name: 'Laryngoscopy',
    category: 'ENT',
    subcategory: 'Larynx',
    price: 2000,
    duration: 30,
    description: 'Visual examination of the larynx'
  },
  {
    name: 'Direct Laryngoscopy',
    category: 'ENT',
    subcategory: 'Larynx',
    price: 4000,
    duration: 45,
    description: 'Direct visualization of larynx under anesthesia'
  },
  {
    name: 'Microlaryngoscopy with Biopsy',
    category: 'ENT',
    subcategory: 'Larynx',
    price: 12000,
    duration: 75,
    description: 'Microscopic larynx examination with tissue sampling'
  },
  {
    name: 'Vocal Cord Surgery (ML Scopy)',
    category: 'ENT',
    subcategory: 'Larynx',
    price: 25000,
    duration: 120,
    description: 'Microsurgical treatment of vocal cord disorders'
  },

  // ENT - HEAD AND NECK Services
  {
    name: 'Neck Node Biopsy (LA/GA)',
    category: 'ENT',
    subcategory: 'Head & Neck',
    price: 8000,
    duration: 60,
    description: 'Lymph node biopsy under local or general anesthesia'
  },
  {
    name: 'Superficial Parotidectomy',
    category: 'ENT',
    subcategory: 'Head & Neck',
    price: 40000,
    duration: 150,
    description: 'Surgical removal of superficial lobe of parotid gland'
  },
  {
    name: 'Total Parotidectomy',
    category: 'ENT',
    subcategory: 'Head & Neck',
    price: 60000,
    duration: 210,
    description: 'Complete removal of parotid gland'
  },
  {
    name: 'Submandibular Gland Excision',
    category: 'ENT',
    subcategory: 'Head & Neck',
    price: 25000,
    duration: 90,
    description: 'Surgical removal of submandibular salivary gland'
  },
  {
    name: 'Hemithyroidectomy',
    category: 'ENT',
    subcategory: 'Head & Neck',
    price: 35000,
    duration: 120,
    description: 'Surgical removal of half of thyroid gland'
  },
  {
    name: 'Total Thyroidectomy',
    category: 'ENT',
    subcategory: 'Head & Neck',
    price: 50000,
    duration: 180,
    description: 'Complete removal of thyroid gland'
  },
  {
    name: 'Thyroglossal Cyst Excision',
    category: 'ENT',
    subcategory: 'Head & Neck',
    price: 20000,
    duration: 75,
    description: 'Surgical removal of thyroglossal duct cyst'
  },
  {
    name: 'Dermoid/Sebaceous Cyst Excision',
    category: 'ENT',
    subcategory: 'Head & Neck',
    price: 8000,
    duration: 45,
    description: 'Removal of skin cysts from head and neck area'
  },
  {
    name: 'Ludwig\'s Angina Treatment',
    category: 'ENT',
    subcategory: 'Head & Neck',
    price: 15000,
    duration: 90,
    description: 'Treatment of severe neck infection'
  },
  {
    name: 'Neck Space Abscess I&D',
    category: 'ENT',
    subcategory: 'Head & Neck',
    price: 10000,
    duration: 60,
    description: 'Incision and drainage of neck space infections'
  },
  {
    name: 'Ranula Excision',
    category: 'ENT',
    subcategory: 'Head & Neck',
    price: 12000,
    duration: 60,
    description: 'Surgical removal of floor of mouth cyst'
  },

  // ENT - ALLERGY TREATMENT
  {
    name: 'Allergy Profile Test',
    category: 'ENT',
    subcategory: 'Allergy',
    price: 5000,
    duration: 30,
    description: 'Comprehensive allergy testing panel'
  },
  {
    name: 'Allergy Blood Tests',
    category: 'ENT',
    subcategory: 'Allergy',
    price: 3000,
    duration: 15,
    description: 'Blood tests for specific allergens'
  },
  {
    name: 'Anti-Allergy Immunotherapy',
    category: 'ENT',
    subcategory: 'Allergy',
    price: 8000,
    duration: 45,
    description: 'Immunotherapy treatment for allergies'
  },

  // ENT - AUDIOLOGY AND SPEECH
  {
    name: 'Pure Tone Audiometry',
    category: 'ENT',
    subcategory: 'Audiology',
    price: 1500,
    duration: 30,
    description: 'Hearing test using pure tones'
  },
  {
    name: 'Impedance Audiometry',
    category: 'ENT',
    subcategory: 'Audiology',
    price: 2000,
    duration: 30,
    description: 'Test of middle ear function'
  },
  {
    name: 'OAE (Otoacoustic Emissions)',
    category: 'ENT',
    subcategory: 'Audiology',
    price: 2500,
    duration: 30,
    description: 'Test of inner ear hair cell function'
  },
  {
    name: 'BERA (Brainstem Evoked Response)',
    category: 'ENT',
    subcategory: 'Audiology',
    price: 3500,
    duration: 45,
    description: 'Test of auditory nerve and brainstem function'
  },

  // ENT - DIGITAL HEARING AIDS
  {
    name: 'Behind The Ear (BTE) Hearing Aid',
    category: 'ENT',
    subcategory: 'Hearing Aids',
    price: 25000,
    duration: 60,
    description: 'Digital hearing aid worn behind the ear'
  },
  {
    name: 'Receiver In Canal (RIC) Hearing Aid',
    category: 'ENT',
    subcategory: 'Hearing Aids',
    price: 35000,
    duration: 60,
    description: 'Digital hearing aid with receiver in ear canal'
  },
  {
    name: 'Completely In Canal (CIC) Hearing Aid',
    category: 'ENT',
    subcategory: 'Hearing Aids',
    price: 45000,
    duration: 75,
    description: 'Custom hearing aid fitting completely in ear canal'
  },
  {
    name: 'Invisible In Canal (IIC) Hearing Aid',
    category: 'ENT',
    subcategory: 'Hearing Aids',
    price: 55000,
    duration: 75,
    description: 'Nearly invisible custom hearing aid'
  },

  // COSMETIC PROCEDURES
  {
    name: 'Dermaplaning',
    category: 'Cosmetic',
    subcategory: 'Facial',
    price: 3000,
    duration: 45,
    description: 'Exfoliation treatment using surgical scalpel'
  },
  {
    name: 'Microdermabrasion',
    category: 'Cosmetic',
    subcategory: 'Facial',
    price: 4000,
    duration: 60,
    description: 'Mechanical exfoliation of skin surface'
  },
  {
    name: 'Hydrafacial',
    category: 'Cosmetic',
    subcategory: 'Facial',
    price: 6000,
    duration: 75,
    description: 'Multi-step facial treatment with hydration'
  },
  {
    name: 'Medifacial',
    category: 'Cosmetic',
    subcategory: 'Facial',
    price: 5000,
    duration: 60,
    description: 'Medical-grade facial treatment'
  },
  {
    name: 'Chemical Peel',
    category: 'Cosmetic',
    subcategory: 'Facial',
    price: 4500,
    duration: 45,
    description: 'Chemical exfoliation for skin rejuvenation'
  },
  {
    name: 'LLLT/LED Therapy',
    category: 'Cosmetic',
    subcategory: 'Treatment',
    price: 3500,
    duration: 30,
    description: 'Low-level laser/LED light therapy'
  },
  {
    name: 'PRP for Skin and Hair',
    category: 'Cosmetic',
    subcategory: 'Treatment',
    price: 8000,
    duration: 90,
    description: 'Platelet-rich plasma therapy'
  },
  {
    name: 'Laser Hair Reduction (LHR)',
    category: 'Cosmetic',
    subcategory: 'Laser',
    price: 2500,
    duration: 45,
    description: 'Laser treatment for permanent hair reduction'
  },
  {
    name: 'Microneedling with Meso Serums',
    category: 'Cosmetic',
    subcategory: 'Treatment',
    price: 6500,
    duration: 75,
    description: 'Collagen induction therapy with serums'
  },
  {
    name: 'Vampire Facial',
    category: 'Cosmetic',
    subcategory: 'Facial',
    price: 12000,
    duration: 90,
    description: 'Microneedling with PRP application'
  },
  {
    name: 'Hollywood Facial',
    category: 'Cosmetic',
    subcategory: 'Facial',
    price: 8000,
    duration: 75,
    description: 'Carbon laser facial treatment'
  },
  {
    name: 'Laser Resurfacing',
    category: 'Cosmetic',
    subcategory: 'Laser',
    price: 15000,
    duration: 90,
    description: 'Laser treatment for skin texture improvement'
  },
  {
    name: 'Acne/Scar Treatment',
    category: 'Cosmetic',
    subcategory: 'Treatment',
    price: 5000,
    duration: 60,
    description: 'Comprehensive acne and scar treatment'
  },

  // DENTAL - CONSULTATION & BASIC
  {
    name: 'Dental Consultation + X-rays',
    category: 'Dental',
    subcategory: 'Consultation',
    price: 1000,
    duration: 30,
    description: 'Initial dental examination with radiographs'
  },
  {
    name: 'Scaling & Root Planning',
    category: 'Dental',
    subcategory: 'Basic',
    price: 2500,
    duration: 45,
    description: 'Deep cleaning of teeth and gums'
  },
  {
    name: 'Pit & Fissure Sealants',
    category: 'Dental',
    subcategory: 'Preventive',
    price: 1500,
    duration: 30,
    description: 'Protective coating for back teeth'
  },
  {
    name: 'Composite Filling',
    category: 'Dental',
    subcategory: 'Restorative',
    price: 2000,
    duration: 45,
    description: 'Tooth-colored filling material'
  },
  {
    name: 'GIC Filling',
    category: 'Dental',
    subcategory: 'Restorative',
    price: 1500,
    duration: 30,
    description: 'Glass ionomer cement filling'
  },
  {
    name: 'Routine Extraction',
    category: 'Dental',
    subcategory: 'Surgery',
    price: 2000,
    duration: 30,
    description: 'Simple tooth extraction'
  },
  {
    name: 'Crown Cementation',
    category: 'Dental',
    subcategory: 'Restorative',
    price: 1000,
    duration: 30,
    description: 'Permanent crown placement'
  },
  {
    name: 'TMJ Disorders Treatment',
    category: 'Dental',
    subcategory: 'Specialty',
    price: 5000,
    duration: 60,
    description: 'Treatment for jaw joint disorders'
  },
  {
    name: 'Oral Cancer Screening',
    category: 'Dental',
    subcategory: 'Preventive',
    price: 1500,
    duration: 30,
    description: 'Comprehensive oral cancer examination'
  },
  {
    name: 'Oral Biopsy - Dental',
    category: 'Dental',
    subcategory: 'Surgery',
    price: 4000,
    duration: 45,
    description: 'Tissue sample collection from oral cavity'
  },

  // DENTAL - PERIODONTAL
  {
    name: 'Periodontal Scaling & Root Planning',
    category: 'Dental',
    subcategory: 'Periodontal',
    price: 3500,
    duration: 60,
    description: 'Deep cleaning for gum disease'
  },
  {
    name: 'Flap Surgery',
    category: 'Dental',
    subcategory: 'Periodontal',
    price: 8000,
    duration: 90,
    description: 'Gum surgery for advanced periodontal disease'
  },
  {
    name: 'Splint Placement',
    category: 'Dental',
    subcategory: 'Periodontal',
    price: 5000,
    duration: 45,
    description: 'Stabilization of loose teeth'
  },
  {
    name: 'Laser Gum Depigmentation',
    category: 'Dental',
    subcategory: 'Cosmetic',
    price: 6000,
    duration: 60,
    description: 'Laser removal of gum pigmentation'
  },
  {
    name: 'Gum Recontouring/Esthetic Surgery',
    category: 'Dental',
    subcategory: 'Cosmetic',
    price: 8000,
    duration: 75,
    description: 'Cosmetic gum reshaping surgery'
  },
  {
    name: 'Bone Grafting - Dental',
    category: 'Dental',
    subcategory: 'Surgery',
    price: 15000,
    duration: 120,
    description: 'Bone regeneration procedure for implants'
  },

  // DENTAL - ENDODONTIC
  {
    name: 'Root Canal (Simple)',
    category: 'Dental',
    subcategory: 'Endodontic',
    price: 8000,
    duration: 90,
    description: 'Single-visit root canal treatment'
  },
  {
    name: 'Root Canal (Complex)',
    category: 'Dental',
    subcategory: 'Endodontic',
    price: 12000,
    duration: 120,
    description: 'Multi-visit root canal treatment'
  },
  {
    name: 'Re-RCT (Root Canal Retreatment)',
    category: 'Dental',
    subcategory: 'Endodontic',
    price: 15000,
    duration: 150,
    description: 'Retreatment of previously treated tooth'
  },
  {
    name: 'Post & Core (Metal)',
    category: 'Dental',
    subcategory: 'Endodontic',
    price: 3000,
    duration: 60,
    description: 'Metal post and core buildup'
  },
  {
    name: 'Post & Core (Fiber)',
    category: 'Dental',
    subcategory: 'Endodontic',
    price: 5000,
    duration: 60,
    description: 'Fiber post and core buildup'
  },

  // DENTAL - PROSTHODONTIC
  {
    name: 'Full Ceramic Zirconia Crown',
    category: 'Dental',
    subcategory: 'Prosthodontic',
    price: 15000,
    duration: 90,
    description: 'High-strength ceramic crown'
  },
  {
    name: 'Full Ceramic E-max Crown',
    category: 'Dental',
    subcategory: 'Prosthodontic',
    price: 18000,
    duration: 90,
    description: 'Premium lithium disilicate crown'
  },
  {
    name: 'Porcelain Veneer/Laminate',
    category: 'Dental',
    subcategory: 'Cosmetic',
    price: 12000,
    duration: 75,
    description: 'Thin porcelain shell for front teeth'
  },
  {
    name: 'Inlay',
    category: 'Dental',
    subcategory: 'Prosthodontic',
    price: 8000,
    duration: 60,
    description: 'Indirect restoration within tooth cusps'
  },
  {
    name: 'Onlay',
    category: 'Dental',
    subcategory: 'Prosthodontic',
    price: 10000,
    duration: 75,
    description: 'Indirect restoration covering tooth cusps'
  },
  {
    name: 'RPD (Removable Partial Denture)',
    category: 'Dental',
    subcategory: 'Prosthodontic',
    price: 12000,
    duration: 120,
    description: 'Removable appliance for missing teeth'
  },
  {
    name: 'Cast Partial Dentures',
    category: 'Dental',
    subcategory: 'Prosthodontic',
    price: 18000,
    duration: 150,
    description: 'Metal framework partial denture'
  },
  {
    name: 'Complete Denture',
    category: 'Dental',
    subcategory: 'Prosthodontic',
    price: 25000,
    duration: 180,
    description: 'Full mouth denture replacement'
  },
  {
    name: 'Smile Design',
    category: 'Dental',
    subcategory: 'Cosmetic',
    price: 50000,
    duration: 240,
    description: 'Comprehensive cosmetic smile makeover'
  },
  {
    name: 'Occlusal Adjustment',
    category: 'Dental',
    subcategory: 'Prosthodontic',
    price: 3000,
    duration: 45,
    description: 'Bite correction and balancing'
  },

  // DENTAL - IMPLANTOLOGY
  {
    name: 'Single Implant - Osstem',
    category: 'Dental',
    subcategory: 'Implant',
    price: 35000,
    duration: 120,
    description: 'Osstem dental implant placement'
  },
  {
    name: 'Single Implant - Biohorizon',
    category: 'Dental',
    subcategory: 'Implant',
    price: 45000,
    duration: 120,
    description: 'Biohorizon dental implant placement'
  },
  {
    name: 'Single Implant - Nobel Biocare',
    category: 'Dental',
    subcategory: 'Implant',
    price: 55000,
    duration: 120,
    description: 'Nobel Biocare premium implant placement'
  },
  {
    name: 'Single Implant - Straumann',
    category: 'Dental',
    subcategory: 'Implant',
    price: 65000,
    duration: 120,
    description: 'Straumann premium implant placement'
  },

  // DENTAL - ORTHODONTICS
  {
    name: 'Metal Braces',
    category: 'Dental',
    subcategory: 'Orthodontic',
    price: 45000,
    duration: 60,
    description: 'Traditional metal orthodontic braces'
  },
  {
    name: 'Ceramic Braces',
    category: 'Dental',
    subcategory: 'Orthodontic',
    price: 60000,
    duration: 60,
    description: 'Tooth-colored ceramic braces'
  },
  {
    name: 'Invisible Braces',
    category: 'Dental',
    subcategory: 'Orthodontic',
    price: 80000,
    duration: 75,
    description: 'Clear aligner orthodontic treatment'
  },
  {
    name: 'Lingual Braces',
    category: 'Dental',
    subcategory: 'Orthodontic',
    price: 100000,
    duration: 90,
    description: 'Behind-the-teeth orthodontic braces'
  },
  {
    name: 'Night Guard/Sports Guard',
    category: 'Dental',
    subcategory: 'Orthodontic',
    price: 5000,
    duration: 45,
    description: 'Custom protective mouth guard'
  },

  // DENTAL - ORAL SURGERY
  {
    name: 'Simple Dental Extraction',
    category: 'Dental',
    subcategory: 'Surgery',
    price: 2000,
    duration: 30,
    description: 'Routine tooth extraction'
  },
  {
    name: 'Difficult Extraction',
    category: 'Dental',
    subcategory: 'Surgery',
    price: 4000,
    duration: 60,
    description: 'Complex tooth extraction'
  },
  {
    name: 'Surgical Disimpaction',
    category: 'Dental',
    subcategory: 'Surgery',
    price: 8000,
    duration: 90,
    description: 'Surgical removal of impacted teeth'
  },
  {
    name: 'Exposure of Impacted Teeth',
    category: 'Dental',
    subcategory: 'Surgery',
    price: 6000,
    duration: 75,
    description: 'Surgical exposure for orthodontic treatment'
  },
  {
    name: 'Indirect Sinus Lift',
    category: 'Dental',
    subcategory: 'Surgery',
    price: 20000,
    duration: 120,
    description: 'Sinus elevation for implant placement'
  },
  {
    name: 'Ridge Augmentation',
    category: 'Dental',
    subcategory: 'Surgery',
    price: 18000,
    duration: 90,
    description: 'Bone ridge enhancement for implants'
  },
  {
    name: 'Bony Spicule Removal',
    category: 'Dental',
    subcategory: 'Surgery',
    price: 3000,
    duration: 30,
    description: 'Removal of sharp bone fragments'
  },
  {
    name: 'Vestibule Enhancement',
    category: 'Dental',
    subcategory: 'Surgery',
    price: 8000,
    duration: 60,
    description: 'Deepening of oral vestibule'
  },
  {
    name: 'Cyst Removal (Enucleation)',
    category: 'Dental',
    subcategory: 'Surgery',
    price: 12000,
    duration: 90,
    description: 'Surgical removal of oral cysts'
  }
]

async function insertServices() {
  console.log('🏥 Starting comprehensive service insertion...')
  console.log('===========================================\n')
  
  try {
    // Insert services in batches to avoid timeout
    const batchSize = 20
    let insertedCount = 0
    
    for (let i = 0; i < services.length; i += batchSize) {
      const batch = services.slice(i, i + batchSize)
      
      // Add timestamps and active status
      const batchWithTimestamps = batch.map(service => ({
        ...service,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      const { data, error } = await supabase
        .from('services')
        .insert(batchWithTimestamps)
        .select('id, name, category, subcategory')
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.ceil((i + batchSize) / batchSize)}:`, error)
        continue
      }
      
      insertedCount += data.length
      console.log(`✅ Inserted batch ${Math.ceil((i + batchSize) / batchSize)} - Total: ${insertedCount} services`)
    }
    
    // Generate statistics
    await generateServiceStatistics(insertedCount)
    
    console.log('\n🎉 Service insertion completed successfully!')
    
  } catch (error) {
    console.error('💥 Failed to insert services:', error)
    process.exit(1)
  }
}

async function generateServiceStatistics(totalInserted) {
  console.log('\n📊 Generating service statistics...')
  
  // Get category breakdown
  const { data: categoryData } = await supabase
    .from('services')
    .select('category')
  
  const categoryBreakdown = {}
  categoryData?.forEach(service => {
    categoryBreakdown[service.category] = (categoryBreakdown[service.category] || 0) + 1
  })
  
  // Get subcategory breakdown
  const { data: subcategoryData } = await supabase
    .from('services')
    .select('category, subcategory')
  
  const subcategoryBreakdown = {}
  subcategoryData?.forEach(service => {
    const key = `${service.category} - ${service.subcategory}`
    subcategoryBreakdown[key] = (subcategoryBreakdown[key] || 0) + 1
  })
  
  console.log('\n📋 SERVICE INSERTION SUMMARY:')
  console.log('============================')
  console.log(`🏥 Total Services Inserted: ${totalInserted}`)
  console.log(`📦 Total Services in Database: ${categoryData?.length || 0}`)
  
  console.log('\n🏷️ Services by Category:')
  Object.entries(categoryBreakdown).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} services`)
  })
  
  console.log('\n🔍 Services by Subcategory:')
  Object.entries(subcategoryBreakdown).forEach(([subcategory, count]) => {
    console.log(`   ${subcategory}: ${count} services`)
  })
  
  console.log('\n✨ Service Categories Available:')
  console.log('   🦻 ENT Services: Ear, Nose, Throat, Larynx, Head & Neck, Allergy, Audiology, Hearing Aids')
  console.log('   🦷 Dental Services: Consultation, Basic, Preventive, Restorative, Periodontal, Endodontic, Prosthodontic, Implants, Orthodontic, Surgery')
  console.log('   💄 Cosmetic Services: Facial treatments, Laser procedures, Skin treatments')
  
  console.log('\n🎯 Next Steps:')
  console.log('   1. Services are now available in appointment booking')
  console.log('   2. Update appointment forms to include service selection')
  console.log('   3. Create service management interface for admin')
  console.log('   4. Add service pricing and duration to billing system')
  console.log('   5. Enable service-based doctor assignment')
}

// Run the script
insertServices()