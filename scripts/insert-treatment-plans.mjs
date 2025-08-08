import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function insertTreatmentPlans() {
  console.log('🏥 Generating Treatment Plans Data...');
  
  try {
    // First, get some existing visits to link treatment plans to
    const { data: visits } = await supabase
      .from('visits')
      .select('id, patient_id, doctor_id, diagnosis, chief_complaint')
      .limit(20);
    
    if (!visits || visits.length === 0) {
      console.log('❌ No visits found to create treatment plans for');
      return;
    }

    const treatmentPlans = [];
    const statuses = ['planned', 'active', 'completed', 'paused'];
    const treatmentTypes = [
      'Physical Therapy',
      'Medication Management',
      'Dietary Modification',
      'Lifestyle Changes',
      'Follow-up Care',
      'Wound Care',
      'Diabetes Management',
      'Hypertension Control',
      'Post-Surgical Care',
      'Chronic Pain Management',
      'Mental Health Support',
      'Rehabilitation Program',
      'Preventive Care',
      'Weight Management',
      'Cardiac Rehabilitation'
    ];

    const descriptions = {
      'Physical Therapy': 'Comprehensive physiotherapy program to improve mobility and strength',
      'Medication Management': 'Systematic approach to medication adherence and monitoring',
      'Dietary Modification': 'Nutritional counseling and meal planning for optimal health',
      'Lifestyle Changes': 'Behavioral modifications for improved health outcomes',
      'Follow-up Care': 'Regular monitoring and assessment of treatment progress',
      'Wound Care': 'Specialized wound cleaning and dressing protocols',
      'Diabetes Management': 'Blood sugar monitoring and lifestyle modifications',
      'Hypertension Control': 'Blood pressure management through medication and lifestyle',
      'Post-Surgical Care': 'Recovery monitoring and complication prevention',
      'Chronic Pain Management': 'Multi-modal pain relief and function improvement',
      'Mental Health Support': 'Psychological counseling and emotional support',
      'Rehabilitation Program': 'Comprehensive recovery and function restoration',
      'Preventive Care': 'Health maintenance and disease prevention strategies',
      'Weight Management': 'Sustainable weight loss or gain program',
      'Cardiac Rehabilitation': 'Heart health improvement and exercise program'
    };

    // Create 25-30 treatment plans
    for (let i = 0; i < Math.min(visits.length, 25); i++) {
      const visit = visits[i];
      const treatmentType = treatmentTypes[Math.floor(Math.random() * treatmentTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const totalSessions = Math.floor(Math.random() * 20) + 5; // 5-25 sessions
      const completedSessions = status === 'completed' ? totalSessions : 
                                status === 'active' ? Math.floor(Math.random() * totalSessions) :
                                status === 'paused' ? Math.floor(Math.random() * (totalSessions / 2)) : 0;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30)); // Started within last 30 days
      
      const expectedEndDate = new Date(startDate);
      expectedEndDate.setDate(expectedEndDate.getDate() + (totalSessions * 7)); // Weekly sessions
      
      const actualEndDate = status === 'completed' ? 
        new Date(startDate.getTime() + Math.random() * (expectedEndDate.getTime() - startDate.getTime())) : 
        null;

      treatmentPlans.push({
        visit_id: visit.id,
        title: treatmentType,
        description: descriptions[treatmentType] + '. Customized for patient needs.',
        total_sessions: totalSessions,
        completed_sessions: completedSessions,
        estimated_cost: Math.floor(Math.random() * 15000) + 2000, // ₹2000-17000
        status: status,
        start_date: startDate.toISOString().split('T')[0],
        expected_end_date: expectedEndDate.toISOString().split('T')[0],
        actual_end_date: actualEndDate ? actualEndDate.toISOString().split('T')[0] : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    console.log(`📋 Inserting ${treatmentPlans.length} treatment plans...`);

    const { data, error } = await supabase
      .from('treatment_plans')
      .insert(treatmentPlans)
      .select();

    if (error) {
      console.error('❌ Error inserting treatment plans:', error.message);
      return;
    }

    console.log(`✅ Successfully inserted ${data.length} treatment plans`);
    
    // Show summary
    const statusCounts = {};
    treatmentPlans.forEach(plan => {
      statusCounts[plan.status] = (statusCounts[plan.status] || 0) + 1;
    });
    
    console.log('\n📊 Treatment Plans Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} plans`);
    });
    
    const totalCost = treatmentPlans.reduce((sum, plan) => sum + plan.estimated_cost, 0);
    console.log(`   Total estimated cost: ₹${totalCost.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Failed to insert treatment plans:', error.message);
  }
}

insertTreatmentPlans();