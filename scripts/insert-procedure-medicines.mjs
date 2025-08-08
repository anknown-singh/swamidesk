#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Procedure-related medicines categorized by use case
const procedureMedicines = [
  // Pre-procedure medications
  {
    name: 'Diazepam 5mg',
    generic_name: 'Diazepam',
    manufacturer: 'Cipla Ltd',
    category: 'Anxiolytic',
    strength: '5mg',
    dosage_form: 'Tablet',
    unit_price: 2.50,
    stock_quantity: 500,
    minimum_stock: 50,
    is_active: true,
    batch_number: 'DZ001',
    expiry_date: '2026-12-31'
  },
  {
    name: 'Midazolam 1mg/ml',
    generic_name: 'Midazolam',
    manufacturer: 'Sun Pharma',
    category: 'Sedative',
    strength: '1mg/ml',
    dosage_form: 'Injection',
    unit_price: 45.00,
    stock_quantity: 100,
    minimum_stock: 20,
    is_active: true,
    requires_prescription: true,
    storage_conditions: 'Store below 25°C, protect from light',
    description: 'Short-acting sedative for minor procedures'
  },
  {
    name: 'Lignocaine 2% with Adrenaline',
    generic_name: 'Lidocaine + Epinephrine',
    manufacturer: 'Dr. Reddy\'s',
    category: 'Local Anesthetic',
    strength: '2%',
    dosage_form: 'Injection',
    unit_price: 25.00,
    stock_quantity: 200,
    minimum_stock: 30,
    is_active: true,
    requires_prescription: true,
    storage_conditions: 'Store below 25°C',
    description: 'Local anesthesia for minor surgical procedures'
  },
  {
    name: 'Lignocaine 4% Gel',
    generic_name: 'Lidocaine',
    manufacturer: 'IPCA Labs',
    category: 'Topical Anesthetic',
    strength: '4%',
    dosage_form: 'Gel',
    unit_price: 85.00,
    stock_quantity: 150,
    minimum_stock: 25,
    is_active: true,
    requires_prescription: true,
    storage_conditions: 'Store below 25°C',
    description: 'Topical anesthesia for mucosal surfaces'
  },

  // Post-procedure pain management
  {
    name: 'Tramadol 50mg',
    generic_name: 'Tramadol Hydrochloride',
    manufacturer: 'Cadila Healthcare',
    category: 'Opioid Analgesic',
    strength: '50mg',
    dosage_form: 'Tablet',
    unit_price: 4.50,
    stock_quantity: 400,
    minimum_stock: 50,
    is_active: true,
    requires_prescription: true,
    storage_conditions: 'Store in cool, dry place',
    description: 'Moderate to severe post-procedure pain relief'
  },
  {
    name: 'Diclofenac 75mg Injection',
    generic_name: 'Diclofenac Sodium',
    manufacturer: 'Lupin Ltd',
    category: 'NSAID',
    strength: '75mg/3ml',
    dosage_form: 'Injection',
    unit_price: 12.00,
    stock_quantity: 300,
    minimum_stock: 40,
    is_active: true,
    requires_prescription: true,
    storage_conditions: 'Store below 25°C, protect from light',
    description: 'Post-operative pain and inflammation'
  },
  {
    name: 'Ketorolac 10mg',
    generic_name: 'Ketorolac Tromethamine',
    manufacturer: 'Ranbaxy Labs',
    category: 'NSAID',
    strength: '10mg',
    dosage_form: 'Tablet',
    unit_price: 6.50,
    stock_quantity: 250,
    minimum_stock: 35,
    is_active: true,
    requires_prescription: true,
    storage_conditions: 'Store in cool, dry place',
    description: 'Short-term post-operative pain management'
  },

  // Infection prevention/treatment
  {
    name: 'Ceftriaxone 1g',
    generic_name: 'Ceftriaxone Sodium',
    manufacturer: 'Hetero Drugs',
    category: 'Antibiotic',
    strength: '1g',
    dosage_form: 'Injection',
    unit_price: 65.00,
    stock_quantity: 200,
    minimum_stock: 30,
    is_active: true,
    requires_prescription: true,
    storage_conditions: 'Store below 25°C, protect from light',
    description: 'Broad-spectrum antibiotic for procedure prophylaxis'
  },
  {
    name: 'Azithromycin 500mg',
    generic_name: 'Azithromycin',
    manufacturer: 'Cipla Ltd',
    category: 'Antibiotic',
    strength: '500mg',
    dosage_form: 'Tablet',
    unit_price: 25.00,
    stock_quantity: 300,
    minimum_stock: 40,
    is_active: true,
    requires_prescription: true,
    storage_conditions: 'Store in cool, dry place',
    description: 'Post-procedure infection prevention'
  },
  {
    name: 'Metronidazole 400mg',
    generic_name: 'Metronidazole',
    manufacturer: 'Torrent Pharma',
    category: 'Antibiotic',
    strength: '400mg',
    dosage_form: 'Tablet',
    unit_price: 3.50,
    stock_quantity: 500,
    minimum_stock: 60,
    is_active: true,
    requires_prescription: true,
    storage_conditions: 'Store in cool, dry place',
    description: 'Anaerobic infection treatment post-procedure'
  },

  // Wound care and healing
  {
    name: 'Povidone Iodine 10% Solution',
    generic_name: 'Povidone Iodine',
    manufacturer: 'Win-Medicare',
    category: 'Antiseptic',
    strength: '10%',
    dosage_form: 'Solution',
    unit_price: 45.00,
    stock_quantity: 100,
    minimum_stock: 20,
    is_active: true,
    requires_prescription: false,
    storage_conditions: 'Store below 30°C, protect from light',
    description: 'Pre and post-procedure wound disinfection'
  },
  {
    name: 'Silver Sulfadiazine Cream 1%',
    generic_name: 'Silver Sulfadiazine',
    manufacturer: 'Glaxo SmithKline',
    category: 'Topical Antibiotic',
    strength: '1%',
    dosage_form: 'Cream',
    unit_price: 125.00,
    stock_quantity: 80,
    minimum_stock: 15,
    is_active: true,
    requires_prescription: true,
    storage_conditions: 'Store below 25°C',
    description: 'Wound infection prevention and healing'
  },
  {
    name: 'Mupirocin 2% Ointment',
    generic_name: 'Mupirocin',
    manufacturer: 'GlaxoSmithKline',
    category: 'Topical Antibiotic',
    strength: '2%',
    dosage_form: 'Ointment',
    unit_price: 185.00,
    stock_quantity: 60,
    minimum_stock: 12,
    is_active: true,
    requires_prescription: true,
    storage_conditions: 'Store below 25°C',
    description: 'Topical bacterial infection treatment'
  },

  // Emergency/resuscitation medications
  {
    name: 'Adrenaline 1:1000',
    generic_name: 'Epinephrine',
    manufacturer: 'Neon Labs',
    category: 'Emergency Medicine',
    strength: '1mg/ml',
    dosage_form: 'Injection',
    unit_price: 55.00,
    stock_quantity: 50,
    minimum_stock: 10,
    is_active: true,
    requires_prescription: true,
    storage_conditions: 'Store below 25°C, protect from light',
    description: 'Emergency treatment for severe allergic reactions'
  },
  {
    name: 'Atropine 0.6mg/ml',
    generic_name: 'Atropine Sulfate',
    manufacturer: 'Samarth Pharma',
    category: 'Anticholinergic',
    strength: '0.6mg/ml',
    dosage_form: 'Injection',
    unit_price: 8.50,
    stock_quantity: 100,
    minimum_stock: 20,
    is_active: true,
    requires_prescription: true,
    storage_conditions: 'Store below 25°C, protect from light',
    description: 'Pre-procedure secretion reduction'
  },

  // ENT-specific procedure medicines
  {
    name: 'Ofloxacin 0.3% Ear Drops',
    generic_name: 'Ofloxacin',
    manufacturer: 'Cipla Ltd',
    category: 'Otic Antibiotic',
    strength: '0.3%',
    dosage_form: 'Ear Drops',
    unit_price: 65.00,
    stock_quantity: 120,
    minimum_stock: 25,
    is_active: true,
    requires_prescription: true,
    storage_conditions: 'Store below 25°C',
    description: 'Ear infection treatment post-procedure'
  },
  {
    name: 'Hydrogen Peroxide 3% Ear Drops',
    generic_name: 'Hydrogen Peroxide',
    manufacturer: 'Reckitt Benckiser',
    category: 'Ear Cleanser',
    strength: '3%',
    dosage_form: 'Ear Drops',
    unit_price: 35.00,
    stock_quantity: 150,
    minimum_stock: 30,
    is_active: true,
    requires_prescription: false,
    storage_conditions: 'Store in cool place, protect from light',
    description: 'Ear wax removal and cleansing'
  },
  {
    name: 'Beclomethasone Nasal Spray',
    generic_name: 'Beclomethasone Dipropionate',
    manufacturer: 'Glaxo SmithKline',
    category: 'Nasal Corticosteroid',
    strength: '50mcg/dose',
    dosage_form: 'Nasal Spray',
    unit_price: 145.00,
    stock_quantity: 80,
    minimum_stock: 15,
    is_active: true,
    requires_prescription: true,
    storage_conditions: 'Store below 25°C',
    description: 'Post-nasal procedure inflammation control'
  },

  // Dental procedure medicines
  {
    name: 'Chlorhexidine 0.2% Mouthwash',
    generic_name: 'Chlorhexidine Gluconate',
    manufacturer: 'Colgate-Palmolive',
    category: 'Oral Antiseptic',
    strength: '0.2%',
    dosage_form: 'Mouthwash',
    unit_price: 95.00,
    stock_quantity: 100,
    minimum_stock: 20,
    is_active: true,
    requires_prescription: false,
    storage_conditions: 'Store at room temperature',
    description: 'Post-dental procedure oral hygiene'
  },
  {
    name: 'Benzocaine 20% Gel',
    generic_name: 'Benzocaine',
    manufacturer: 'Orajel',
    category: 'Topical Anesthetic',
    strength: '20%',
    dosage_form: 'Oral Gel',
    unit_price: 155.00,
    stock_quantity: 60,
    minimum_stock: 12,
    is_active: true,
    requires_prescription: false,
    storage_conditions: 'Store below 25°C',
    description: 'Topical oral pain relief'
  }
]

async function insertProcedureMedicines() {
  console.log('🏥 Starting procedure medicines insertion...')
  
  try {
    // Check if medicines already exist to avoid duplicates
    const { data: existingMedicines } = await supabase
      .from('medicines')
      .select('name')
    
    const existingNames = new Set(existingMedicines?.map(m => m.name) || [])
    
    const newMedicines = procedureMedicines.filter(medicine => 
      !existingNames.has(medicine.name)
    )
    
    console.log(`📊 Found ${existingMedicines?.length || 0} existing medicines`)
    console.log(`➕ Adding ${newMedicines.length} new procedure-related medicines`)
    
    if (newMedicines.length === 0) {
      console.log('✅ All procedure medicines already exist in database')
      return
    }

    // Insert medicines in batches
    const batchSize = 10
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < newMedicines.length; i += batchSize) {
      const batch = newMedicines.slice(i, i + batchSize)
      
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(newMedicines.length/batchSize)}...`)
      
      const { data, error } = await supabase
        .from('medicines')
        .insert(batch)
        .select('name')
      
      if (error) {
        console.error(`❌ Error inserting batch:`, error.message)
        errorCount += batch.length
      } else {
        console.log(`✅ Successfully inserted ${data?.length || 0} medicines:`)
        data?.forEach(medicine => {
          console.log(`   - ${medicine.name}`)
        })
        successCount += data?.length || 0
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('\n📋 Summary:')
    console.log(`✅ Successfully inserted: ${successCount} medicines`)
    console.log(`❌ Failed to insert: ${errorCount} medicines`)
    
    if (successCount > 0) {
      console.log('\n🔍 Medicine categories added:')
      const categories = [...new Set(newMedicines.map(m => m.category))]
      categories.forEach(category => {
        const count = newMedicines.filter(m => m.category === category).length
        console.log(`   - ${category}: ${count} medicines`)
      })
      
      console.log('\n💊 Dosage forms added:')
      const forms = [...new Set(newMedicines.map(m => m.dosage_form))]
      forms.forEach(form => {
        const count = newMedicines.filter(m => m.dosage_form === form).length
        console.log(`   - ${form}: ${count} medicines`)
      })
    }
    
  } catch (error) {
    console.error('❌ Fatal error during insertion:', error)
    process.exit(1)
  }
}

// Run the script
insertProcedureMedicines()
  .then(() => {
    console.log('\n🎉 Procedure medicines insertion completed!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })