/**
 * Simplified Service Insertion Script
 * Uses existing database schema
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Simplified services using existing schema: name, category, department, price, duration, description
const services = [
  // ENT Services
  { name: 'Endoscopy With Suction Irrigation', category: 'procedure', department: 'ENT', price: 2500, duration: 45, description: 'Ear endoscopy with suction and irrigation' },
  { name: 'Foreign Body Removal - Ear', category: 'procedure', department: 'ENT', price: 3000, duration: 30, description: 'Safe removal of foreign objects from ear' },
  { name: 'Ear Biopsy', category: 'procedure', department: 'ENT', price: 4000, duration: 60, description: 'Tissue sample collection from ear' },
  { name: 'Ear Microscopy', category: 'consultation', department: 'ENT', price: 2000, duration: 30, description: 'Microscopic examination of ear' },
  { name: 'Myringotomy', category: 'procedure', department: 'ENT', price: 8000, duration: 45, description: 'Surgical incision in eardrum' },
  { name: 'Myringotomy with Grommet', category: 'procedure', department: 'ENT', price: 12000, duration: 60, description: 'Myringotomy with ventilation tube' },
  { name: 'Pinnaplasty', category: 'procedure', department: 'ENT', price: 25000, duration: 120, description: 'Cosmetic ear surgery' },
  { name: 'Myringoplasty', category: 'procedure', department: 'ENT', price: 18000, duration: 90, description: 'Eardrum repair surgery' },
  { name: 'Tympanoplasty', category: 'procedure', department: 'ENT', price: 35000, duration: 150, description: 'Eardrum reconstruction' },
  { name: 'Mastoidectomy', category: 'procedure', department: 'ENT', price: 45000, duration: 180, description: 'Mastoid bone surgery' },
  { name: 'Stapedotomy', category: 'procedure', department: 'ENT', price: 55000, duration: 120, description: 'Stapes bone surgery for hearing' },
  { name: 'Cochlear Implant', category: 'procedure', department: 'ENT', price: 0, duration: 240, description: 'Government scheme cochlear implant' },
  
  { name: 'Nasal Cautery', category: 'procedure', department: 'ENT', price: 3500, duration: 30, description: 'Nasal cauterization for allergies' },
  { name: 'Septoplasty', category: 'procedure', department: 'ENT', price: 25000, duration: 90, description: 'Nasal septum correction' },
  { name: 'Turbinoplasty', category: 'procedure', department: 'ENT', price: 20000, duration: 75, description: 'Nasal turbinate surgery' },
  { name: 'Conchoplasty', category: 'procedure', department: 'ENT', price: 18000, duration: 60, description: 'Nasal concha surgery' },
  { name: 'Rhinoplasty', category: 'procedure', department: 'ENT', price: 45000, duration: 150, description: 'Nose cosmetic surgery' },
  { name: 'Anterior FESS', category: 'procedure', department: 'ENT', price: 30000, duration: 120, description: 'Anterior sinus surgery' },
  { name: 'Total FESS', category: 'procedure', department: 'ENT', price: 50000, duration: 180, description: 'Complete sinus surgery' },
  { name: 'Foreign Body Removal - Nose', category: 'procedure', department: 'ENT', price: 2500, duration: 30, description: 'Nasal foreign body removal' },
  { name: 'Nasal Bone Fracture Repair', category: 'procedure', department: 'ENT', price: 35000, duration: 120, description: 'Nasal fracture surgery' },
  { name: 'Nasal Polypectomy', category: 'procedure', department: 'ENT', price: 15000, duration: 60, description: 'Nasal polyp removal' },
  { name: 'Nasal Hemangioma Removal', category: 'procedure', department: 'ENT', price: 20000, duration: 90, description: 'Nasal tumor removal' },
  { name: 'Nasopharyngeal Angiofibroma Surgery', category: 'procedure', department: 'ENT', price: 60000, duration: 240, description: 'Complex nasal tumor surgery' },
  { name: 'Nasal Biopsy', category: 'procedure', department: 'ENT', price: 3500, duration: 45, description: 'Nasal tissue biopsy' },
  
  { name: 'Oral Biopsy', category: 'procedure', department: 'ENT', price: 4000, duration: 45, description: 'Oral tissue biopsy' },
  { name: 'Tonsillectomy', category: 'procedure', department: 'ENT', price: 20000, duration: 75, description: 'Tonsil removal surgery' },
  { name: 'Adenoidectomy', category: 'procedure', department: 'ENT', price: 18000, duration: 60, description: 'Adenoid removal' },
  { name: 'Tonsil & Adenoid Surgery', category: 'procedure', department: 'ENT', price: 30000, duration: 90, description: 'Combined tonsil adenoid surgery' },
  { name: 'Peritonsillar Abscess Drainage', category: 'procedure', department: 'ENT', price: 8000, duration: 45, description: 'Throat abscess drainage' },
  { name: 'Uvuloplasty', category: 'procedure', department: 'ENT', price: 15000, duration: 60, description: 'Uvula surgery for sleep apnea' },
  { name: 'Uvulopalatoplasty', category: 'procedure', department: 'ENT', price: 25000, duration: 90, description: 'Soft palate surgery' },
  { name: 'Tongue Tie Release', category: 'procedure', department: 'ENT', price: 5000, duration: 30, description: 'Tongue tie correction' },
  { name: 'Laryngoscopy', category: 'consultation', department: 'ENT', price: 2000, duration: 30, description: 'Larynx examination' },
  { name: 'Direct Laryngoscopy', category: 'procedure', department: 'ENT', price: 4000, duration: 45, description: 'Direct larynx visualization' },
  { name: 'Microlaryngoscopy with Biopsy', category: 'procedure', department: 'ENT', price: 12000, duration: 75, description: 'Microscopic larynx biopsy' },
  { name: 'Vocal Cord Surgery', category: 'procedure', department: 'ENT', price: 25000, duration: 120, description: 'Vocal cord microsurgery' },
  
  { name: 'Neck Node Biopsy', category: 'procedure', department: 'ENT', price: 8000, duration: 60, description: 'Lymph node biopsy' },
  { name: 'Superficial Parotidectomy', category: 'procedure', department: 'ENT', price: 40000, duration: 150, description: 'Parotid gland surgery' },
  { name: 'Total Parotidectomy', category: 'procedure', department: 'ENT', price: 60000, duration: 210, description: 'Complete parotid removal' },
  { name: 'Submandibular Gland Excision', category: 'procedure', department: 'ENT', price: 25000, duration: 90, description: 'Salivary gland removal' },
  { name: 'Hemithyroidectomy', category: 'procedure', department: 'ENT', price: 35000, duration: 120, description: 'Half thyroid removal' },
  { name: 'Total Thyroidectomy', category: 'procedure', department: 'ENT', price: 50000, duration: 180, description: 'Complete thyroid removal' },
  { name: 'Thyroglossal Cyst Excision', category: 'procedure', department: 'ENT', price: 20000, duration: 75, description: 'Thyroglossal cyst surgery' },
  { name: 'Cyst Excision - Head & Neck', category: 'procedure', department: 'ENT', price: 8000, duration: 45, description: 'Head neck cyst removal' },
  { name: 'Ludwig\'s Angina Treatment', category: 'procedure', department: 'ENT', price: 15000, duration: 90, description: 'Neck infection treatment' },
  { name: 'Neck Abscess Drainage', category: 'procedure', department: 'ENT', price: 10000, duration: 60, description: 'Neck infection drainage' },
  { name: 'Ranula Excision', category: 'procedure', department: 'ENT', price: 12000, duration: 60, description: 'Floor of mouth cyst removal' },
  
  { name: 'Allergy Profile Test', category: 'test', department: 'ENT', price: 5000, duration: 30, description: 'Comprehensive allergy testing' },
  { name: 'Allergy Blood Tests', category: 'test', department: 'ENT', price: 3000, duration: 15, description: 'Blood allergy tests' },
  { name: 'Anti-Allergy Immunotherapy', category: 'therapy', department: 'ENT', price: 8000, duration: 45, description: 'Allergy immunotherapy' },
  
  { name: 'Pure Tone Audiometry', category: 'test', department: 'ENT', price: 1500, duration: 30, description: 'Hearing test' },
  { name: 'Impedance Audiometry', category: 'test', department: 'ENT', price: 2000, duration: 30, description: 'Middle ear test' },
  { name: 'OAE Test', category: 'test', department: 'ENT', price: 2500, duration: 30, description: 'Inner ear test' },
  { name: 'BERA Test', category: 'test', department: 'ENT', price: 3500, duration: 45, description: 'Brainstem hearing test' },
  
  { name: 'BTE Hearing Aid', category: 'therapy', department: 'ENT', price: 25000, duration: 60, description: 'Behind ear hearing aid' },
  { name: 'RIC Hearing Aid', category: 'therapy', department: 'ENT', price: 35000, duration: 60, description: 'Receiver in canal hearing aid' },
  { name: 'CIC Hearing Aid', category: 'therapy', department: 'ENT', price: 45000, duration: 75, description: 'Completely in canal hearing aid' },
  { name: 'IIC Hearing Aid', category: 'therapy', department: 'ENT', price: 55000, duration: 75, description: 'Invisible hearing aid' },
  
  // Cosmetic Services
  { name: 'Dermaplaning', category: 'therapy', department: 'Cosmetic', price: 3000, duration: 45, description: 'Facial exfoliation treatment' },
  { name: 'Microdermabrasion', category: 'therapy', department: 'Cosmetic', price: 4000, duration: 60, description: 'Skin resurfacing treatment' },
  { name: 'Hydrafacial', category: 'therapy', department: 'Cosmetic', price: 6000, duration: 75, description: 'Hydrating facial treatment' },
  { name: 'Medifacial', category: 'therapy', department: 'Cosmetic', price: 5000, duration: 60, description: 'Medical grade facial' },
  { name: 'Chemical Peel', category: 'therapy', department: 'Cosmetic', price: 4500, duration: 45, description: 'Chemical skin exfoliation' },
  { name: 'LED Therapy', category: 'therapy', department: 'Cosmetic', price: 3500, duration: 30, description: 'Light therapy treatment' },
  { name: 'PRP for Skin and Hair', category: 'therapy', department: 'Cosmetic', price: 8000, duration: 90, description: 'Platelet rich plasma therapy' },
  { name: 'Laser Hair Reduction', category: 'procedure', department: 'Cosmetic', price: 2500, duration: 45, description: 'Permanent hair reduction' },
  { name: 'Microneedling with Serums', category: 'therapy', department: 'Cosmetic', price: 6500, duration: 75, description: 'Collagen induction therapy' },
  { name: 'Vampire Facial', category: 'therapy', department: 'Cosmetic', price: 12000, duration: 90, description: 'PRP facial treatment' },
  { name: 'Hollywood Facial', category: 'therapy', department: 'Cosmetic', price: 8000, duration: 75, description: 'Carbon laser facial' },
  { name: 'Laser Resurfacing', category: 'procedure', department: 'Cosmetic', price: 15000, duration: 90, description: 'Laser skin resurfacing' },
  { name: 'Acne Scar Treatment', category: 'therapy', department: 'Cosmetic', price: 5000, duration: 60, description: 'Acne and scar treatment' },
  
  // Dental Services
  { name: 'Dental Consultation', category: 'consultation', department: 'Dental', price: 1000, duration: 30, description: 'Dental examination with X-rays' },
  { name: 'Scaling & Root Planning', category: 'therapy', department: 'Dental', price: 2500, duration: 45, description: 'Deep teeth cleaning' },
  { name: 'Pit & Fissure Sealants', category: 'procedure', department: 'Dental', price: 1500, duration: 30, description: 'Tooth protection sealants' },
  { name: 'Composite Filling', category: 'procedure', department: 'Dental', price: 2000, duration: 45, description: 'Tooth colored filling' },
  { name: 'GIC Filling', category: 'procedure', department: 'Dental', price: 1500, duration: 30, description: 'Glass ionomer filling' },
  { name: 'Tooth Extraction', category: 'procedure', department: 'Dental', price: 2000, duration: 30, description: 'Simple tooth removal' },
  { name: 'Crown Cementation', category: 'procedure', department: 'Dental', price: 1000, duration: 30, description: 'Crown placement' },
  { name: 'TMJ Treatment', category: 'therapy', department: 'Dental', price: 5000, duration: 60, description: 'Jaw joint disorder treatment' },
  { name: 'Oral Cancer Screening', category: 'consultation', department: 'Dental', price: 1500, duration: 30, description: 'Oral cancer examination' },
  { name: 'Oral Biopsy - Dental', category: 'procedure', department: 'Dental', price: 4000, duration: 45, description: 'Oral tissue biopsy' },
  
  { name: 'Periodontal Surgery', category: 'procedure', department: 'Dental', price: 8000, duration: 90, description: 'Gum disease surgery' },
  { name: 'Dental Splinting', category: 'procedure', department: 'Dental', price: 5000, duration: 45, description: 'Tooth stabilization' },
  { name: 'Laser Gum Treatment', category: 'procedure', department: 'Dental', price: 6000, duration: 60, description: 'Laser gum therapy' },
  { name: 'Gum Contouring', category: 'procedure', department: 'Dental', price: 8000, duration: 75, description: 'Cosmetic gum surgery' },
  { name: 'Bone Grafting', category: 'procedure', department: 'Dental', price: 15000, duration: 120, description: 'Dental bone regeneration' },
  
  { name: 'Root Canal Treatment', category: 'procedure', department: 'Dental', price: 8000, duration: 90, description: 'Root canal therapy' },
  { name: 'Root Canal Retreatment', category: 'procedure', department: 'Dental', price: 15000, duration: 150, description: 'Re-root canal treatment' },
  { name: 'Post & Core', category: 'procedure', department: 'Dental', price: 3000, duration: 60, description: 'Post and core buildup' },
  
  { name: 'Zirconia Crown', category: 'procedure', department: 'Dental', price: 15000, duration: 90, description: 'Ceramic crown' },
  { name: 'E-max Crown', category: 'procedure', department: 'Dental', price: 18000, duration: 90, description: 'Premium ceramic crown' },
  { name: 'Porcelain Veneer', category: 'procedure', department: 'Dental', price: 12000, duration: 75, description: 'Cosmetic veneer' },
  { name: 'Dental Inlay', category: 'procedure', department: 'Dental', price: 8000, duration: 60, description: 'Indirect restoration' },
  { name: 'Dental Onlay', category: 'procedure', department: 'Dental', price: 10000, duration: 75, description: 'Large indirect restoration' },
  { name: 'Partial Denture', category: 'procedure', department: 'Dental', price: 12000, duration: 120, description: 'Removable partial denture' },
  { name: 'Complete Denture', category: 'procedure', department: 'Dental', price: 25000, duration: 180, description: 'Full denture' },
  { name: 'Smile Design', category: 'procedure', department: 'Dental', price: 50000, duration: 240, description: 'Complete smile makeover' },
  
  { name: 'Dental Implant - Basic', category: 'procedure', department: 'Dental', price: 35000, duration: 120, description: 'Basic dental implant' },
  { name: 'Dental Implant - Premium', category: 'procedure', department: 'Dental', price: 55000, duration: 120, description: 'Premium dental implant' },
  
  { name: 'Metal Braces', category: 'procedure', department: 'Dental', price: 45000, duration: 60, description: 'Traditional braces' },
  { name: 'Ceramic Braces', category: 'procedure', department: 'Dental', price: 60000, duration: 60, description: 'Tooth colored braces' },
  { name: 'Invisible Braces', category: 'procedure', department: 'Dental', price: 80000, duration: 75, description: 'Clear aligner treatment' },
  { name: 'Night Guard', category: 'procedure', department: 'Dental', price: 5000, duration: 45, description: 'Protective mouth guard' },
  
  { name: 'Surgical Extraction', category: 'procedure', department: 'Dental', price: 4000, duration: 60, description: 'Complex tooth extraction' },
  { name: 'Wisdom Tooth Surgery', category: 'procedure', department: 'Dental', price: 8000, duration: 90, description: 'Impacted tooth surgery' },
  { name: 'Sinus Lift', category: 'procedure', department: 'Dental', price: 20000, duration: 120, description: 'Sinus elevation surgery' },
  { name: 'Ridge Augmentation', category: 'procedure', department: 'Dental', price: 18000, duration: 90, description: 'Bone ridge enhancement' },
  { name: 'Oral Cyst Removal', category: 'procedure', department: 'Dental', price: 12000, duration: 90, description: 'Cyst enucleation surgery' }
]

async function insertServices() {
  console.log('🏥 Inserting comprehensive clinic services...')
  console.log('===========================================\n')
  
  try {
    const batchSize = 25
    let insertedCount = 0
    
    for (let i = 0; i < services.length; i += batchSize) {
      const batch = services.slice(i, i + batchSize)
      
      const batchWithTimestamps = batch.map(service => ({
        ...service,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      const { data, error } = await supabase
        .from('services')
        .insert(batchWithTimestamps)
        .select('id, name, department')
      
      if (error) {
        console.error(`❌ Batch ${Math.ceil((i + batchSize) / batchSize)} error:`, error.message)
        continue
      }
      
      insertedCount += data.length
      console.log(`✅ Batch ${Math.ceil((i + batchSize) / batchSize)} - Inserted ${data.length} services (Total: ${insertedCount})`)
    }
    
    await generateStats(insertedCount)
    console.log('\n🎉 All services inserted successfully!')
    
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

async function generateStats(inserted) {
  const { data } = await supabase.from('services').select('department, category')
  
  const deptCount = {}
  const catCount = {}
  
  data?.forEach(s => {
    deptCount[s.department] = (deptCount[s.department] || 0) + 1
    catCount[s.category] = (catCount[s.category] || 0) + 1
  })
  
  console.log('\n📊 SERVICE SUMMARY:')
  console.log(`Total Inserted: ${inserted}`)
  console.log(`Total Services: ${data?.length || 0}`)
  console.log('\nBy Department:')
  Object.entries(deptCount).forEach(([dept, count]) => 
    console.log(`  ${dept}: ${count} services`))
  console.log('\nBy Category:')
  Object.entries(catCount).forEach(([cat, count]) => 
    console.log(`  ${cat}: ${count} services`))
}

insertServices()