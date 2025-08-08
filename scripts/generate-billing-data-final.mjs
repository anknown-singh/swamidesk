#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Generate realistic invoice data using correct enum values
async function generateBillingData() {
  console.log('🏥 GENERATING COMPREHENSIVE BILLING DATA (FINAL)')
  console.log('===============================================')
  
  try {
    // Get existing data
    const { data: visits } = await supabase
      .from('visits')
      .select(`
        id,
        patient_id,
        doctor_id,
        visit_date,
        diagnosis,
        patients (
          id,
          full_name,
          phone,
          email
        )
      `)
      .limit(30)

    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select(`
        id,
        visit_id,
        quantity,
        medicines (
          name,
          unit_price
        )
      `)
      .limit(50)

    const { data: services } = await supabase
      .from('services')
      .select('id, name, price')
      .limit(15)

    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)

    if (!visits || visits.length === 0) {
      console.log('❌ No visits found. Cannot generate invoices.')
      return
    }

    const createdBy = users?.[0]?.id || null

    console.log(`📊 Found ${visits.length} visits, ${prescriptions?.length || 0} prescriptions, ${services?.length || 0} services`)

    // Check existing invoices to avoid duplicates
    const { data: existingInvoices } = await supabase.from('invoices').select('visit_id')
    const existingVisitIds = new Set(existingInvoices?.map(inv => inv.visit_id) || [])

    const invoicesToCreate = []
    
    // Generate invoices for visits without existing invoices
    const visitsToProcess = visits.filter(visit => visit.patients && !existingVisitIds.has(visit.id)).slice(0, 20)
    
    for (const visit of visitsToProcess) {
      let subtotal = 0

      // Add consultation fee (₹400-2000)
      const consultationFee = 400 + Math.floor(Math.random() * 1600)
      subtotal += consultationFee

      // Add prescription costs for this visit
      const visitPrescriptions = prescriptions?.filter(p => p.visit_id === visit.id) || []
      for (const prescription of visitPrescriptions) {
        if (prescription.medicines) {
          const totalPrice = prescription.quantity * prescription.medicines.unit_price
          subtotal += totalPrice
        }
      }

      // Randomly add services (40% chance)
      if (services && Math.random() < 0.4) {
        const randomService = services[Math.floor(Math.random() * services.length)]
        const serviceQuantity = Math.random() < 0.9 ? 1 : 2
        subtotal += randomService.price * serviceQuantity
      }

      // Calculate tax and discount
      const taxAmount = subtotal * 0.18 // 18% GST
      const discountAmount = Math.random() < 0.25 ? subtotal * (0.05 + Math.random() * 0.15) : 0 // 0-20% discount
      const totalAmount = subtotal + taxAmount - discountAmount

      // Determine payment status using correct enum values
      const statusRand = Math.random()
      let paymentStatus, paymentMethod, paymentDate
      
      if (statusRand < 0.65) { // 65% completed
        paymentStatus = 'completed'
        paymentMethod = ['cash', 'card', 'upi', 'bank_transfer'][Math.floor(Math.random() * 4)]
        // Payment date within last 45 days
        const payment = new Date()
        payment.setDate(payment.getDate() - Math.floor(Math.random() * 45))
        paymentDate = payment.toISOString()
      } else if (statusRand < 0.85) { // 20% pending
        paymentStatus = 'pending'
        paymentMethod = null
        paymentDate = null
      } else { // 15% partially_paid
        paymentStatus = 'partially_paid'
        paymentMethod = ['cash', 'card', 'upi'][Math.floor(Math.random() * 3)]
        const payment = new Date()
        payment.setDate(payment.getDate() - Math.floor(Math.random() * 20))
        paymentDate = payment.toISOString()
      }

      const invoice = {
        patient_id: visit.patient_id,
        visit_id: visit.id,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_amount: Math.round(taxAmount * 100) / 100,
        discount_amount: Math.round(discountAmount * 100) / 100,
        total_amount: Math.round(totalAmount * 100) / 100,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        payment_date: paymentDate,
        notes: Math.random() < 0.35 ? generateRandomNote() : null,
        created_by: createdBy
      }

      invoicesToCreate.push(invoice)
    }

    if (invoicesToCreate.length === 0) {
      console.log('✅ All visits already have invoices.')
      // Let's create some additional invoices with different statuses
      console.log('📝 Creating additional diverse invoices...')
      
      // Create 5 more invoices with various statuses for demonstration
      const additionalInvoices = []
      for (let i = 0; i < 5; i++) {
        const randomVisit = visits[Math.floor(Math.random() * visits.length)]
        if (!randomVisit.patients) continue

        const baseAmount = 800 + Math.floor(Math.random() * 2000)
        const taxAmount = baseAmount * 0.18
        const totalAmount = baseAmount + taxAmount

        const statuses = ['completed', 'pending', 'partially_paid']
        const methods = ['cash', 'card', 'upi', 'bank_transfer']
        const status = statuses[Math.floor(Math.random() * statuses.length)]

        additionalInvoices.push({
          patient_id: randomVisit.patient_id,
          visit_id: randomVisit.id,
          subtotal: baseAmount,
          tax_amount: Math.round(taxAmount * 100) / 100,
          discount_amount: 0,
          total_amount: Math.round(totalAmount * 100) / 100,
          payment_status: status,
          payment_method: status === 'pending' ? null : methods[Math.floor(Math.random() * methods.length)],
          payment_date: status === 'pending' ? null : new Date().toISOString(),
          notes: generateRandomNote(),
          created_by: createdBy
        })
      }
      invoicesToCreate.push(...additionalInvoices)
    }

    console.log(`📝 Creating ${invoicesToCreate.length} invoices...`)

    // Insert invoices in batches to avoid conflicts
    const batchSize = 5
    let totalCreated = 0
    
    for (let i = 0; i < invoicesToCreate.length; i += batchSize) {
      const batch = invoicesToCreate.slice(i, i + batchSize)
      
      try {
        const { data: createdBatch, error } = await supabase
          .from('invoices')
          .insert(batch)
          .select('id, total_amount, payment_status')

        if (error) {
          console.log(`⚠️ Batch ${Math.floor(i/batchSize) + 1} had issues:`, error.message)
        } else {
          totalCreated += createdBatch.length
          console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${createdBatch.length} invoices created`)
        }
      } catch (batchError) {
        console.log(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, batchError.message)
      }
    }

    // Get all invoices for summary
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('total_amount, payment_status')

    if (allInvoices) {
      const completedRevenue = allInvoices
        .filter(inv => inv.payment_status === 'completed')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

      const pendingRevenue = allInvoices
        .filter(inv => ['pending', 'partially_paid'].includes(inv.payment_status))
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

      console.log('\n💰 COMPREHENSIVE BILLING SUMMARY:')
      console.log('=================================')
      console.log(`📊 Total Invoices in System: ${allInvoices.length}`)
      console.log(`📝 New Invoices Created: ${totalCreated}`)
      console.log(`💵 Total Revenue (Completed): ₹${completedRevenue.toFixed(2)}`)
      console.log(`⏳ Pending Revenue: ₹${pendingRevenue.toFixed(2)}`)
      console.log(`📈 Payment Status Distribution:`)
      console.log(`   • Completed: ${allInvoices.filter(i => i.payment_status === 'completed').length} invoices`)
      console.log(`   • Pending: ${allInvoices.filter(i => i.payment_status === 'pending').length} invoices`)
      console.log(`   • Partially Paid: ${allInvoices.filter(i => i.payment_status === 'partially_paid').length} invoices`)
    }
    
    console.log('\n🎉 BILLING DATA GENERATION COMPLETED!')
    console.log('✅ Billing dashboard should now display comprehensive invoice data')

  } catch (error) {
    console.error('❌ Error generating billing data:', error)
  }
}

function generateRandomNote() {
  const notes = [
    'Follow-up consultation required in 2 weeks',
    'Patient requested extended payment terms',
    'Insurance claim submitted - reference: INS2025001',
    'Corporate billing - company code: HC001',
    'Emergency consultation - priority billing applied',
    'Diabetes management package - 3 month plan',
    'Family discount applied (15% off total)',
    'Senior citizen discount (10% applied)',
    'Payment plan arranged - 3 monthly installments',
    'Referred by Dr. Sharma - referral bonus applied',
    'Telemedicine consultation - online platform fee',
    'Health checkup package - comprehensive screening',
    'Follow-up visit - previous treatment continuation'
  ]
  return notes[Math.floor(Math.random() * notes.length)]
}

// Run the generation
generateBillingData().catch(console.error)