import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function insertTreatmentPlans() {
  console.log('🏥 Generating Treatment Plans Data (Fixed Schema)...');
  
  try {
    // Get some existing visits and patients to link treatment plans to
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
      'Physical Therapy Program',
      'Medication Management Plan',
      'Dietary Modification Plan',
      'Lifestyle Changes Program',
      'Follow-up Care Protocol',
      'Wound Care Management',
      'Diabetes Management Plan',
      'Hypertension Control Program',
      'Post-Surgical Care Plan',
      'Chronic Pain Management',
      'Mental Health Support Plan',
      'Rehabilitation Program',
      'Preventive Care Protocol',
      'Weight Management Plan',
      'Cardiac Rehabilitation'
    ];

    const descriptions = {
      'Physical Therapy Program': 'Comprehensive physiotherapy program to improve mobility and strength',
      'Medication Management Plan': 'Systematic approach to medication adherence and monitoring',
      'Dietary Modification Plan': 'Nutritional counseling and meal planning for optimal health',
      'Lifestyle Changes Program': 'Behavioral modifications for improved health outcomes',
      'Follow-up Care Protocol': 'Regular monitoring and assessment of treatment progress',
      'Wound Care Management': 'Specialized wound cleaning and dressing protocols',
      'Diabetes Management Plan': 'Blood sugar monitoring and lifestyle modifications',
      'Hypertension Control Program': 'Blood pressure management through medication and lifestyle',
      'Post-Surgical Care Plan': 'Recovery monitoring and complication prevention',
      'Chronic Pain Management': 'Multi-modal pain relief and function improvement',
      'Mental Health Support Plan': 'Psychological counseling and emotional support',
      'Rehabilitation Program': 'Comprehensive recovery and function restoration',
      'Preventive Care Protocol': 'Health maintenance and disease prevention strategies',
      'Weight Management Plan': 'Sustainable weight loss or gain program',
      'Cardiac Rehabilitation': 'Heart health improvement and exercise program'
    };

    // Create treatment plans with minimal required fields
    for (let i = 0; i < Math.min(visits.length, 20); i++) {
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

      // Use minimal required fields based on likely schema
      treatmentPlans.push({
        patient_id: visit.patient_id,
        visit_id: visit.id,
        title: treatmentType,
        description: descriptions[treatmentType] + '. Customized for patient specific needs.',
        total_sessions: totalSessions,
        completed_sessions: completedSessions,
        estimated_cost: Math.floor(Math.random() * 15000) + 2000, // ₹2000-17000
        status: status,
        start_date: startDate.toISOString().split('T')[0],
        expected_end_date: expectedEndDate.toISOString().split('T')[0]
      });
    }

    console.log(`📋 Inserting ${treatmentPlans.length} treatment plans...`);

    // Try inserting one record first to test
    const testPlan = treatmentPlans[0];
    const { data: testData, error: testError } = await supabase
      .from('treatment_plans')
      .insert([testPlan])
      .select();

    if (testError) {
      console.log('❌ Test insert failed:', testError.message);
      
      // Try with even more minimal fields
      const minimalPlan = {
        patient_id: testPlan.patient_id,
        title: testPlan.title,
        description: testPlan.description,
        status: testPlan.status
      };
      
      const { data: minData, error: minError } = await supabase
        .from('treatment_plans')
        .insert([minimalPlan])
        .select();
      
      if (minError) {
        console.log('❌ Even minimal insert failed:', minError.message);
        return;
      } else {
        console.log('✅ Minimal insert worked, proceeding with bulk insert...');
        
        // Use minimal schema for all records
        const minimalPlans = treatmentPlans.map(plan => ({
          patient_id: plan.patient_id,
          title: plan.title,
          description: plan.description,
          status: plan.status,
          total_sessions: plan.total_sessions,
          completed_sessions: plan.completed_sessions
        }));
        
        const { data, error } = await supabase
          .from('treatment_plans')
          .insert(minimalPlans.slice(1)) // Skip first one already inserted
          .select();
        
        if (error) {
          console.log('❌ Bulk insert failed:', error.message);
          return;
        }
        
        console.log(`✅ Successfully inserted ${data.length + 1} treatment plans (including test)`);
      }
    } else {
      console.log('✅ Full schema insert worked, proceeding with bulk insert...');
      
      const { data, error } = await supabase
        .from('treatment_plans')
        .insert(treatmentPlans.slice(1)) // Skip first one already inserted
        .select();
      
      if (error) {
        console.log('❌ Bulk insert failed:', error.message);
        return;
      }
      
      console.log(`✅ Successfully inserted ${data.length + 1} treatment plans (including test)`);
    }
    
    // Show summary
    const statusCounts = {};
    treatmentPlans.forEach(plan => {
      statusCounts[plan.status] = (statusCounts[plan.status] || 0) + 1;
    });
    
    console.log('\n📊 Treatment Plans Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} plans`);
    });
    
    console.log(`\n🎉 Treatment Plans table is now populated!`);
    
  } catch (error) {
    console.error('❌ Failed to insert treatment plans:', error.message);
  }
}

insertTreatmentPlans();