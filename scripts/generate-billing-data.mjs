#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Generate realistic invoice data
async function generateBillingData() {
  console.log('🏥 GENERATING COMPREHENSIVE BILLING DATA')
  console.log('======================================')
  
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

    if (!visits || visits.length === 0) {
      console.log('❌ No visits found. Cannot generate invoices.')
      return
    }

    console.log(`📊 Found ${visits.length} visits, ${prescriptions?.length || 0} prescriptions, ${services?.length || 0} services`)

    const invoicesToCreate = []
    const invoiceItemsToCreate = []
    
    // Generate invoices for recent visits
    for (let i = 0; i < Math.min(visits.length, 20); i++) {
      const visit = visits[i]
      if (!visit.patients) continue

      // Generate invoice number
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now() + i).slice(-6)}`
      
      // Random invoice date (within last 30 days)
      const invoiceDate = new Date()
      invoiceDate.setDate(invoiceDate.getDate() - Math.floor(Math.random() * 30))
      const invoiceDateStr = invoiceDate.toISOString().split('T')[0]
      
      // Due date (15 days from invoice date)
      const dueDate = new Date(invoiceDate)
      dueDate.setDate(dueDate.getDate() + 15)
      const dueDateStr = dueDate.toISOString().split('T')[0]

      let subtotal = 0
      const invoiceItemsForThisInvoice = []

      // Add consultation fee
      const consultationFee = 500 + Math.floor(Math.random() * 1500) // ₹500-2000
      subtotal += consultationFee
      invoiceItemsForThisInvoice.push({
        item_type: 'consultation',
        description: `Medical consultation with ${visit.diagnosis || 'General consultation'}`,
        quantity: 1,
        unit_price: consultationFee,
        total_price: consultationFee
      })

      // Add prescriptions for this visit
      const visitPrescriptions = prescriptions?.filter(p => p.visit_id === visit.id) || []
      visitPrescriptions.forEach(prescription => {
        if (prescription.medicines) {
          const totalPrice = prescription.quantity * prescription.medicines.unit_price
          subtotal += totalPrice
          invoiceItemsForThisInvoice.push({
            item_type: 'prescription',
            description: `Medicine: ${prescription.medicines.name}`,
            quantity: prescription.quantity,
            unit_price: prescription.medicines.unit_price,
            total_price: totalPrice
          })
        }
      })

      // Randomly add some services (30% chance per invoice)
      if (services && Math.random() < 0.3) {
        const randomService = services[Math.floor(Math.random() * services.length)]
        const serviceQuantity = Math.random() < 0.8 ? 1 : 2 // Usually 1, sometimes 2
        const serviceTotalPrice = randomService.price * serviceQuantity
        subtotal += serviceTotalPrice
        invoiceItemsForThisInvoice.push({
          item_type: 'service',
          description: `Medical service: ${randomService.name}`,
          quantity: serviceQuantity,
          unit_price: randomService.price,
          total_price: serviceTotalPrice
        })
      }

      // Calculate tax and discount
      const taxRate = 0.18 // 18% GST
      const taxAmount = subtotal * taxRate
      const discountAmount = Math.random() < 0.2 ? subtotal * 0.1 : 0 // 10% discount on 20% of invoices
      const totalAmount = subtotal + taxAmount - discountAmount

      // Determine payment status and method
      const statusRand = Math.random()
      let paymentStatus, paymentMethod
      
      if (statusRand < 0.6) { // 60% paid
        paymentStatus = 'paid'
        paymentMethod = ['cash', 'card', 'upi', 'bank_transfer'][Math.floor(Math.random() * 4)]
      } else if (statusRand < 0.8) { // 20% pending
        paymentStatus = 'pending'
        paymentMethod = null
      } else if (statusRand < 0.9) { // 10% overdue (set due date in past)
        paymentStatus = 'pending'
        paymentMethod = null
        // Make it overdue by setting due date in past
        const pastDueDate = new Date()
        pastDueDate.setDate(pastDueDate.getDate() - Math.floor(Math.random() * 10 + 5))
        dueDate.setTime(pastDueDate.getTime())
      } else { // 10% partially paid
        paymentStatus = 'partially_paid'
        paymentMethod = ['cash', 'card', 'upi'][Math.floor(Math.random() * 3)]
      }

      const invoice = {
        patient_id: visit.patient_id,
        visit_id: visit.id,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDateStr,
        due_date: dueDateStr,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_amount: Math.round(taxAmount * 100) / 100,
        discount_amount: Math.round(discountAmount * 100) / 100,
        total_amount: Math.round(totalAmount * 100) / 100,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        notes: Math.random() < 0.3 ? generateRandomNote() : null
      }

      invoicesToCreate.push(invoice)
      
      // Store items to be created after invoices are created
      invoiceItemsForThisInvoice.forEach(item => {
        invoiceItemsToCreate.push({
          ...item,
          invoiceIndex: i // We'll use this to link to the created invoice
        })
      })
    }

    console.log(`📝 Creating ${invoicesToCreate.length} invoices...`)

    // Insert invoices
    const { data: createdInvoices, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoicesToCreate)
      .select('id')

    if (invoiceError) {
      console.error('❌ Error creating invoices:', invoiceError)
      return
    }

    console.log(`✅ Created ${createdInvoices.length} invoices`)

    // Now create invoice items
    const finalInvoiceItems = invoiceItemsToCreate.map((item, index) => {
      const invoiceIndex = item.invoiceIndex
      const invoiceId = createdInvoices[invoiceIndex]?.id
      
      const { invoiceIndex: _, ...itemData } = item // Remove invoiceIndex field
      return {
        ...itemData,
        invoice_id: invoiceId
      }
    }).filter(item => item.invoice_id) // Filter out any without valid invoice_id

    if (finalInvoiceItems.length > 0) {
      console.log(`📋 Creating ${finalInvoiceItems.length} invoice items...`)
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(finalInvoiceItems)

      if (itemsError) {
        console.error('❌ Error creating invoice items:', itemsError)
      } else {
        console.log(`✅ Created ${finalInvoiceItems.length} invoice items`)
      }
    }

    // Generate summary
    const totalRevenue = invoicesToCreate
      .filter(inv => inv.payment_status === 'paid')
      .reduce((sum, inv) => sum + inv.total_amount, 0)

    const pendingRevenue = invoicesToCreate
      .filter(inv => ['pending', 'partially_paid'].includes(inv.payment_status))
      .reduce((sum, inv) => sum + inv.total_amount, 0)

    console.log('\n💰 BILLING DATA SUMMARY:')
    console.log('========================')
    console.log(`📊 Total Invoices Created: ${invoicesToCreate.length}`)
    console.log(`💵 Total Revenue (Paid): ₹${totalRevenue.toFixed(2)}`)
    console.log(`⏳ Pending Revenue: ₹${pendingRevenue.toFixed(2)}`)
    console.log(`📈 Revenue Distribution:`)
    console.log(`   • Paid: ${invoicesToCreate.filter(i => i.payment_status === 'paid').length} invoices`)
    console.log(`   • Pending: ${invoicesToCreate.filter(i => i.payment_status === 'pending').length} invoices`)
    console.log(`   • Partially Paid: ${invoicesToCreate.filter(i => i.payment_status === 'partially_paid').length} invoices`)
    console.log('\n🎉 Billing data generation completed successfully!')

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
    'Package deal - diabetes management',
    'Family discount applied',
    'Senior citizen discount',
    'Payment plan arranged - 3 installments',
    'Referred by Dr. Sharma'
  ]
  return notes[Math.floor(Math.random() * notes.length)]
}

// Run the generation
generateBillingData().catch(console.error)