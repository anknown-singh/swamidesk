#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Generate realistic invoice data using actual schema
async function generateBillingData() {
  console.log('🏥 GENERATING COMPREHENSIVE BILLING DATA (CORRECTED)')
  console.log('==================================================')
  
  try {
    // Get existing data
    const { data: visits } = await supabase
      .from('visits')
      .select(`
        id,
        patient_id,
        doctor_id,
        visit_date,
        visit_time,
        diagnosis,
        status,
        patients (
          id,
          full_name,
          phone,
          email,
          date_of_birth
        )
      `)
      .limit(25)

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
      .limit(30)

    const { data: services } = await supabase
      .from('services')
      .select('id, name, price')
      .limit(10)

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

    const invoicesToCreate = []
    
    // Generate invoices for recent visits (only visits that don't have invoices yet)
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('visit_id')

    const existingVisitIds = new Set(existingInvoices?.map(inv => inv.visit_id) || [])

    for (let i = 0; i < Math.min(visits.length, 15); i++) {
      const visit = visits[i]
      if (!visit.patients || existingVisitIds.has(visit.id)) continue

      let subtotal = 0

      // Add consultation fee
      const consultationFee = 500 + Math.floor(Math.random() * 1500) // ₹500-2000
      subtotal += consultationFee

      // Add prescriptions for this visit
      const visitPrescriptions = prescriptions?.filter(p => p.visit_id === visit.id) || []
      visitPrescriptions.forEach(prescription => {
        if (prescription.medicines) {
          const totalPrice = prescription.quantity * prescription.medicines.unit_price
          subtotal += totalPrice
        }
      })

      // Randomly add some services (30% chance per invoice)
      if (services && Math.random() < 0.3) {
        const randomService = services[Math.floor(Math.random() * services.length)]
        const serviceQuantity = Math.random() < 0.8 ? 1 : 2 // Usually 1, sometimes 2
        const serviceTotalPrice = randomService.price * serviceQuantity
        subtotal += serviceTotalPrice
      }

      // Calculate tax and discount
      const taxRate = 0.18 // 18% GST
      const taxAmount = subtotal * taxRate
      const discountAmount = Math.random() < 0.2 ? subtotal * 0.1 : 0 // 10% discount on 20% of invoices
      const totalAmount = subtotal + taxAmount - discountAmount

      // Determine payment status and method
      const statusRand = Math.random()
      let paymentStatus, paymentMethod, paymentDate
      
      if (statusRand < 0.6) { // 60% paid
        paymentStatus = 'paid'
        paymentMethod = ['cash', 'card', 'upi', 'bank_transfer'][Math.floor(Math.random() * 4)]
        // Payment date within last 30 days
        const payment = new Date()
        payment.setDate(payment.getDate() - Math.floor(Math.random() * 30))
        paymentDate = payment.toISOString()
      } else if (statusRand < 0.8) { // 20% pending
        paymentStatus = 'pending'
        paymentMethod = null
        paymentDate = null
      } else { // 20% partially paid
        paymentStatus = 'partially_paid'
        paymentMethod = ['cash', 'card', 'upi'][Math.floor(Math.random() * 3)]
        // Payment date within last 15 days
        const payment = new Date()
        payment.setDate(payment.getDate() - Math.floor(Math.random() * 15))
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
        notes: Math.random() < 0.3 ? generateRandomNote() : null,
        created_by: createdBy
      }

      invoicesToCreate.push(invoice)
    }

    if (invoicesToCreate.length === 0) {
      console.log('✅ All visits already have invoices. No new invoices to create.')
      return
    }

    console.log(`📝 Creating ${invoicesToCreate.length} new invoices...`)

    // Insert invoices
    const { data: createdInvoices, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoicesToCreate)
      .select('id, visit_id, total_amount, payment_status')

    if (invoiceError) {
      console.error('❌ Error creating invoices:', invoiceError)
      return
    }

    console.log(`✅ Created ${createdInvoices.length} invoices`)

    // Generate summary
    const totalRevenue = createdInvoices
      .filter(inv => inv.payment_status === 'paid')
      .reduce((sum, inv) => sum + inv.total_amount, 0)

    const pendingRevenue = createdInvoices
      .filter(inv => ['pending', 'partially_paid'].includes(inv.payment_status))
      .reduce((sum, inv) => sum + inv.total_amount, 0)

    console.log('\n💰 BILLING DATA SUMMARY:')
    console.log('========================')
    console.log(`📊 New Invoices Created: ${createdInvoices.length}`)
    console.log(`💵 Total Revenue (Paid): ₹${totalRevenue.toFixed(2)}`)
    console.log(`⏳ Pending Revenue: ₹${pendingRevenue.toFixed(2)}`)
    console.log(`📈 Payment Status Distribution:`)
    console.log(`   • Paid: ${createdInvoices.filter(i => i.payment_status === 'paid').length} invoices`)
    console.log(`   • Pending: ${createdInvoices.filter(i => i.payment_status === 'pending').length} invoices`)
    console.log(`   • Partially Paid: ${createdInvoices.filter(i => i.payment_status === 'partially_paid').length} invoices`)
    
    console.log('\n🎉 Billing data generation completed successfully!')
    console.log('💡 Note: Invoice items table not found - invoices created without detailed line items')

  } catch (error) {
    console.error('❌ Error generating billing data:', error)
  }
}

function generateRandomNote() {
  const notes = [
    'Follow-up required in 2 weeks',
    'Patient requested extended payment terms',
    'Insurance claim submitted',
    'Corporate billing - company code: HC001',
    'Emergency consultation - priority billing',
    'Package deal - diabetes management program',
    'Family discount applied (10%)',
    'Senior citizen discount',
    'Payment plan arranged - installments',
    'Referred by Dr. Sharma'
  ]
  return notes[Math.floor(Math.random() * notes.length)]
}

// Run the generation
generateBillingData().catch(console.error)