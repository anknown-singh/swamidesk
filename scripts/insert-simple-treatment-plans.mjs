import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function insertSimpleTreatmentPlans() {
  console.log('🏥 Creating Simple Treatment Plans...');
  
  try {
    // Get some patients
    const { data: patients } = await supabase
      .from('patients')
      .select('id, full_name')
      .limit(15);
    
    if (!patients || patients.length === 0) {
      console.log('❌ No patients found');
      return;
    }

    const treatmentPlans = [];
    const statuses = ['planned', 'active', 'completed', 'paused'];
    const treatmentTypes = [
      'Physical Therapy',
      'Medication Management', 
      'Dietary Plan',
      'Follow-up Care',
      'Wound Care',
      'Diabetes Management',
      'Hypertension Control',
      'Post-Surgical Care',
      'Pain Management',
      'Mental Health Support',
      'Rehabilitation',
      'Preventive Care',
      'Weight Management',
      'Cardiac Care',
      'Respiratory Therapy'
    ];

    // Create minimal treatment plans
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const treatmentType = treatmentTypes[i % treatmentTypes.length];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      treatmentPlans.push({
        patient_id: patient.id,
        title: treatmentType + ' for ' + patient.full_name,
        description: 'Comprehensive ' + treatmentType.toLowerCase() + ' plan tailored for patient needs',
        status: status
      });
    }

    console.log('📋 Inserting ' + treatmentPlans.length + ' treatment plans...');

    const { data, error } = await supabase
      .from('treatment_plans')
      .insert(treatmentPlans)
      .select();

    if (error) {
      console.log('❌ Insert failed:', error.message);
      return;
    }

    console.log('✅ Successfully inserted ' + data.length + ' treatment plans');
    
    // Show summary
    const statusCounts = {};
    treatmentPlans.forEach(plan => {
      statusCounts[plan.status] = (statusCounts[plan.status] || 0) + 1;
    });
    
    console.log('');
    console.log('📊 Treatment Plans Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log('   ' + status + ': ' + count + ' plans');
    });
    
    console.log('');
    console.log('🎉 Treatment Plans table is now populated!');
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

insertSimpleTreatmentPlans();