import { useEffect, useState } from 'react'
import html2pdf from 'html2pdf.js'
import { supabase } from '../lib/supabase'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function generateEmailMessage() {
  return `${getGreeting()},

Please find attached your invoice for today's purchase.

If you require any additional parts, feel free to contact us.

Thank you for choosing Baba Ji Parts.

Kind regards,
Ahmed
Baba Ji Parts`
}

export default function AdminInvoices() {
  const [parts, setParts] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [message, setMessage] = useState('')
  const [markSold, setMarkSold] = useState(true)
  const [emailMessage, setEmailMessage] = useState(generateEmailMessage())
  const [saving, setSaving] = useState(false)

  const [invoice, setInvoice] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    delivery_address: '',
    note: '',
    freight: '0',
    rounding: '0',
    payment_method: '',
    payment_status: 'Unpaid',
    amount_paid: '0',
  })

  const [items, setItems] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!customerSearch.trim()) {
      setFilteredCustomers([])
      return
    }

    const results = customers
      .filter((customer) => {
        const text = `${customer.name} ${customer.phone} ${customer.email} ${customer.address}`.toLowerCase()
        return text.includes(customerSearch.toLowerCase())
      })
      .slice(0, 8)

    setFilteredCustomers(results)
  }, [customerSearch, customers])

  async function fetchData() {
    const { data: partData } = await supabase
      .from('parts')
      .select('*')
      .neq('status', 'Sold')
      .order('created_at', { ascending: false })

    const { data: vehicleData } = await supabase.from('vehicles').select('*')

    const { data: customerData } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    setParts(partData || [])
    setVehicles(vehicleData || [])
    setCustomers(customerData || [])
  }

  function selectCustomer(customer) {
    setInvoice({
      ...invoice,
      customer_name: customer.name || '',
      customer_phone: customer.phone || '',
      customer_email: customer.email || '',
      customer_address: customer.address || '',
    })

    setCustomerSearch('')
    setFilteredCustomers([])
    setMessage(`Customer loaded: ${customer.name}`)
  }

  function clearCustomer() {
    setInvoice({
      ...invoice,
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      customer_address: '',
    })

    setCustomerSearch('')
    setFilteredCustomers([])
  }

  function getVehicle(vehicleId) {
    return vehicles.find((v) => v.id === vehicleId)
  }

  function addInventoryPart(partId) {
    const part = parts.find((p) => p.id === partId)
    if (!part) return

    const vehicle = getVehicle(part.vehicle_id)

    setItems([
      ...items,
      {
        source_type: 'inventory',
        inventory_part_id: part.id,
        location: part.location || '',
        part_number: part.stock_number || '',
        description: `${part.part_name || part.part_type} - ${vehicle?.year || ''} ${vehicle?.make || ''} ${vehicle?.model || ''} ${vehicle?.chassis_code || ''}`,
        quantity: 1,
        qty_bo: 0,
        qty_supplied: 1,
        unit_price: Number(part.price || 0),
        gst_code: 'GST',
      },
    ])
  }

  function addCustomItem() {
    setItems([
      ...items,
      {
        source_type: 'custom',
        inventory_part_id: null,
        location: 'External',
        part_number: '',
        description: '',
        quantity: 1,
        qty_bo: 0,
        qty_supplied: 1,
        unit_price: 0,
        gst_code: 'GST',
      },
    ])
  }

  function updateItem(index, field, value) {
    const updated = [...items]
    updated[index][field] = value
    setItems(updated)
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
    0
  )

  const freight = Number(invoice.freight || 0)
  const rounding = Number(invoice.rounding || 0)
  const total = subtotal + freight + rounding
  const gst = total / 11

  const amountPaid =
    invoice.payment_status === 'Paid' ? total : Number(invoice.amount_paid || 0)

  const balanceDue = Math.max(total - amountPaid, 0)

  function makeInvoiceNumber() {
    const now = new Date()
    return `BJP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(
      now.getMinutes()
    ).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  }

  function buildInvoiceStyles() {
    return `
      @page { size: A4 landscape; margin: 7mm; }

      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      html, body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        color: #000;
        background: #fff;
        font-size: 10px;
      }

      .page {
        width: 282mm;
        min-height: 196mm;
        background: #fff;
        margin: 0 auto;
      }

      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .logo {
        font-size: 42px;
        font-weight: 900;
        line-height: 0.85;
        letter-spacing: 2px;
      }

      .company {
        text-align: right;
        font-size: 10px;
        font-weight: 700;
        line-height: 1.25;
      }

      .grid3 {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
        margin-top: 10px;
      }

      .box {
        border: 1px solid #000;
        min-height: 55px;
        padding: 6px;
        position: relative;
        line-height: 1.25;
      }

      .label {
        position: absolute;
        top: -9px;
        left: 0;
        background: #fff;
        border: 1px solid #000;
        padding: 0 5px;
        font-weight: 700;
      }

      .wide {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 8px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
        table-layout: fixed;
      }

      th, td {
        border: 1px solid #000;
        padding: 4px;
        vertical-align: top;
        word-break: break-word;
        line-height: 1.2;
      }

      th {
        font-weight: 800;
        text-align: center;
      }

      .lines td {
        height: 26px;
      }

      .bottom {
        display: grid;
        grid-template-columns: 1.3fr 1fr;
        gap: 8px;
        margin-top: 8px;
      }

      .terms {
        border: 1px solid #000;
        padding: 5px;
        font-size: 7px;
        line-height: 1.15;
      }

      .totals {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 6px;
        align-items: start;
      }

      .totalBox {
        border: 1px solid #000;
        text-align: center;
        font-weight: 900;
        font-size: 14px;
      }

      .totalBox div:first-child {
        background: #eee;
        border-bottom: 1px solid #000;
        padding: 4px;
      }

      .totalBox div:last-child {
        padding: 8px 4px;
      }

      .sign {
        margin-top: 22px;
        text-align: center;
        font-weight: 700;
      }
    `
  }

  function buildInvoiceBody(invoiceNumber) {
    const rows = items
      .map((item, index) => {
        const itemTotal = Number(item.quantity || 1) * Number(item.unit_price || 0)

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${item.location || ''}</td>
            <td>${item.part_number || ''}</td>
            <td>${item.description || ''}</td>
            <td>${item.quantity || 1}</td>
            <td>${item.qty_bo || 0}</td>
            <td>${item.qty_supplied || 1}</td>
            <td>$${Number(item.unit_price || 0).toFixed(2)}</td>
            <td>$${Number(item.unit_price || 0).toFixed(2)}</td>
            <td>${item.gst_code || 'GST'}</td>
            <td>$${itemTotal.toFixed(2)}</td>
          </tr>
        `
      })
      .join('')

    const emptyRows = Array.from({ length: Math.max(6 - items.length, 0) })
      .map(
        () => `
          <tr>
            <td>&nbsp;</td><td></td><td></td><td></td><td></td>
            <td></td><td></td><td></td><td></td><td></td><td></td>
          </tr>
        `
      )
      .join('')

    return `
      <div class="page">
        <div class="top">
          <div class="logo">BABA JI<br/>PARTS</div>

          <div class="company">
            MELBOURNE AUTO WRECKING PTY LTD TRADING AS BABA JI PARTS<br/>
            ACN 672 278 063 &nbsp; ABN 30 672 278 063<br/>
            82 HORNE STREET, CAMPBELLFIELD, VIC, 3061<br/>
            TEL: 03 9359 2061 &nbsp; MOB: 0430 099 873<br/>
            sales@babajipartsmelb.com.au<br/>
            www.babajipartsmelb.com.au<br/>
            Bank details - BSB: 083004 &nbsp; Account number: 932633780
          </div>
        </div>

        <div class="grid3">
          <div class="box">
            <div class="label">Customer</div>
            ${invoice.customer_name || ''}<br/>
            ${invoice.customer_phone || ''}<br/>
            ${invoice.customer_email || ''}<br/>
            ${invoice.customer_address || ''}
          </div>

          <div class="box">
            <div class="label">Deliver To</div>
            ${invoice.delivery_address || 'Pickup / Delivery TBC'}<br/><br/>
            PLEASE NOTE THAT PRICES ARE SUBJECT TO CHANGE WITHOUT NOTICE.
          </div>

          <div class="box">
            <div class="label">Invoice Info</div>
            Inv No: ${invoiceNumber}<br/>
            Date: ${new Date().toLocaleDateString()}<br/>
            Time: ${new Date().toLocaleTimeString()}<br/>
            Pay Type: ${invoice.payment_method || 'TBC'}<br/>
            Status: ${invoice.payment_status || 'Unpaid'}
          </div>
        </div>

        <div class="wide">
          <div class="box">
            <div class="label">Note</div>
            ${invoice.note || ''}
          </div>

          <div class="box">
            <div class="label">Payment</div>
            Paid: $${Number(amountPaid || 0).toFixed(2)}<br/>
            Balance: $${Number(balanceDue || 0).toFixed(2)}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Line No</th>
              <th>Location</th>
              <th>Part Number</th>
              <th>Description</th>
              <th>Ordered</th>
              <th>B.O.</th>
              <th>Supplied</th>
              <th>Unit List</th>
              <th>Unit Net</th>
              <th>GST Code</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody class="lines">
            ${rows}
            ${emptyRows}
          </tbody>
        </table>

        <div class="bottom">
          <div class="terms">
            <b>Please Note:</b> No return on electrical parts. No return on special orders.
            Engines and gearboxes must be checked before fitting. No labour claims accepted.
            Parts must be inspected before installation. Deposits may be non-refundable.
            Warranty applies only where expressly stated on invoice.
          </div>

          <div>
            <div class="totals">
              <div class="totalBox"><div>Sub-Total</div><div>$${subtotal.toFixed(2)}</div></div>
              <div class="totalBox"><div>Freight</div><div>$${freight.toFixed(2)}</div></div>
              <div class="totalBox"><div>Rounding</div><div>$${rounding.toFixed(2)}</div></div>
              <div class="totalBox"><div>GST</div><div>$${gst.toFixed(2)}</div></div>
              <div class="totalBox"><div>TOTAL</div><div>$${total.toFixed(2)}</div></div>
            </div>

            <div class="sign">
              Please sign here ____________________________________________
            </div>
          </div>
        </div>
      </div>
    `
  }

  function buildInvoiceHtml(invoiceNumber) {
    return `
      <html>
        <head>
          <title>${invoiceNumber}</title>
          <style>${buildInvoiceStyles()}</style>
        </head>
        <body>
          ${buildInvoiceBody(invoiceNumber)}
        </body>
      </html>
    `
  }

  async function generatePdfBase64(invoiceNumber) {
    const element = document.createElement('div')

    element.style.position = 'fixed'
    element.style.left = '0'
    element.style.top = '0'
    element.style.width = '1123px'
    element.style.minHeight = '794px'
    element.style.background = '#ffffff'
    element.style.zIndex = '999999'
    element.style.padding = '26px'
    element.style.boxSizing = 'border-box'
    element.style.pointerEvents = 'none'

    element.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .page {
          width: 1071px !important;
          min-height: 742px !important;
          background: #ffffff !important;
          color: #000000 !important;
          font-family: Arial, sans-serif !important;
          font-size: 10px !important;
          margin: 0 !important;
        }

        .top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .logo {
          font-size: 42px;
          font-weight: 900;
          line-height: 0.85;
          letter-spacing: 2px;
        }

        .company {
          text-align: right;
          font-size: 10px;
          font-weight: 700;
          line-height: 1.25;
        }

        .grid3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          margin-top: 10px;
        }

        .box {
          border: 1px solid #000;
          min-height: 55px;
          padding: 6px;
          position: relative;
          line-height: 1.25;
        }

        .label {
          position: absolute;
          top: -9px;
          left: 0;
          background: #fff;
          border: 1px solid #000;
          padding: 0 5px;
          font-weight: 700;
        }

        .wide {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 8px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          table-layout: fixed;
        }

        th, td {
          border: 1px solid #000;
          padding: 4px;
          vertical-align: top;
          word-break: break-word;
          line-height: 1.2;
        }

        th {
          font-weight: 800;
          text-align: center;
        }

        .lines td {
          height: 26px;
        }

        .bottom {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 8px;
          margin-top: 8px;
        }

        .terms {
          border: 1px solid #000;
          padding: 5px;
          font-size: 7px;
          line-height: 1.15;
        }

        .totals {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
          align-items: start;
        }

        .totalBox {
          border: 1px solid #000;
          text-align: center;
          font-weight: 900;
          font-size: 14px;
        }

        .totalBox div:first-child {
          background: #eee;
          border-bottom: 1px solid #000;
          padding: 4px;
        }

        .totalBox div:last-child {
          padding: 8px 4px;
        }

        .sign {
          margin-top: 22px;
          text-align: center;
          font-weight: 700;
        }
      </style>

      ${buildInvoiceBody(invoiceNumber)}
    `

    document.body.appendChild(element)

    await new Promise((resolve) => requestAnimationFrame(resolve))
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await new Promise((resolve) => setTimeout(resolve, 700))

    const page = element.querySelector('.page')

    const dataUriString = await html2pdf()
      .set({
        margin: 0,
        filename: `${invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1123,
          windowHeight: 794,
        },
        jsPDF: {
          unit: 'px',
          format: [1123, 794],
          orientation: 'landscape',
          compress: true,
        },
      })
      .from(page)
      .outputPdf('datauristring')

    document.body.removeChild(element)

    return dataUriString.split(',')[1]
  }

  async function findOrCreateCustomer() {
    if (!invoice.customer_name.trim()) return null

    const normalizedPhone = invoice.customer_phone.trim()
    const normalizedEmail = invoice.customer_email.trim()

    let query = supabase.from('customers').select('*').limit(1)

    if (normalizedPhone) {
      query = query.eq('phone', normalizedPhone)
    } else if (normalizedEmail) {
      query = query.eq('email', normalizedEmail)
    } else {
      query = query.eq('name', invoice.customer_name.trim())
    }

    const { data: existingCustomers, error: findError } = await query
    if (findError) throw findError

    if (existingCustomers && existingCustomers.length > 0) {
      const existingCustomer = existingCustomers[0]

      await supabase
        .from('customers')
        .update({
          name: invoice.customer_name,
          phone: invoice.customer_phone,
          email: invoice.customer_email,
          address: invoice.customer_address,
        })
        .eq('id', existingCustomer.id)

      return existingCustomer.id
    }

    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert([
        {
          name: invoice.customer_name,
          phone: invoice.customer_phone,
          email: invoice.customer_email,
          address: invoice.customer_address,
        },
      ])
      .select()

    if (createError) throw createError

    return newCustomer?.[0]?.id || null
  }

  // Generates PDF on the client, then sends pdfBase64 + invoice + items to the API
  async function sendInvoiceEmail(createdInvoice, invoiceNumber) {
    if (!invoice.customer_email.trim()) {
      throw new Error('Customer email is missing.')
    }

    // Generate the PDF attachment first
    const pdfBase64 = await generatePdfBase64(invoiceNumber)

    const emailInvoice = {
      ...invoice,
      invoice_number: invoiceNumber,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      freight,
      rounding,
      subtotal,
      gst,
      total,
      amount_paid: amountPaid,
      balance_due: balanceDue,
    }

    const emailItems = items.map((item, index) => ({
      line_no: index + 1,
      source_type: item.source_type,
      inventory_part_id: item.inventory_part_id,
      location: item.location,
      part_number: item.part_number,
      description: item.description,
      quantity: Number(item.quantity || 1),
      qty_bo: Number(item.qty_bo || 0),
      qty_supplied: Number(item.qty_supplied || 1),
      unit_price: Number(item.unit_price || 0),
      gst_code: item.gst_code || 'GST',
      total: Number(item.quantity || 1) * Number(item.unit_price || 0),
    }))

    const response = await fetch('/api/send-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: invoice.customer_email,
        subject: `Invoice ${invoiceNumber}`,
        message: emailMessage,
        invoiceNumber,
        pdfBase64,       // ← PDF attachment for the email
        invoice: emailInvoice, // ← structured data if your API needs it
        items: emailItems,     // ← line items if your API needs it
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error?.message || result.error || 'Email failed.')
    }

    await supabase
      .from('invoices')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('id', createdInvoice.id)
  }

  async function saveInvoice({ shouldPrint = true, shouldEmail = false } = {}) {
    setMessage('')

    if (items.length === 0) {
      setMessage('Add at least one invoice item first.')
      return
    }

    if (shouldEmail && !invoice.customer_email.trim()) {
      setMessage('Customer email is required to send invoice email.')
      return
    }

    setSaving(true)

    try {
      const invoiceNumber = makeInvoiceNumber()
      const customerId = await findOrCreateCustomer()

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert([
          {
            ...invoice,
            customer_id: customerId,
            invoice_number: invoiceNumber,
            freight,
            rounding,
            subtotal,
            gst,
            total,
            payment_status: invoice.payment_status,
            payment_method: invoice.payment_method,
            amount_paid: amountPaid,
            balance_due: balanceDue,
            email_subject: `Invoice ${invoiceNumber}`,
            email_message: emailMessage,
            email_sent: false,
          },
        ])
        .select()

      if (invoiceError) throw invoiceError

      const createdInvoice = invoiceData[0]

      const invoiceItems = items.map((item, index) => ({
        invoice_id: createdInvoice.id,
        line_no: index + 1,
        source_type: item.source_type,
        inventory_part_id: item.inventory_part_id,
        location: item.location,
        part_number: item.part_number,
        description: item.description,
        quantity: Number(item.quantity || 1),
        qty_bo: Number(item.qty_bo || 0),
        qty_supplied: Number(item.qty_supplied || 1),
        unit_price: Number(item.unit_price || 0),
        gst_code: item.gst_code || 'GST',
        total: Number(item.quantity || 1) * Number(item.unit_price || 0),
      }))

      const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems)
      if (itemsError) throw itemsError

      if (markSold) {
        const inventoryIds = items
          .filter((item) => item.source_type === 'inventory' && item.inventory_part_id)
          .map((item) => item.inventory_part_id)

        if (inventoryIds.length > 0) {
          await supabase.from('parts').update({ status: 'Sold' }).in('id', inventoryIds)
        }
      }

      let emailStatus = ''

      if (shouldEmail) {
        await sendInvoiceEmail(createdInvoice, invoiceNumber)
        emailStatus = ' and emailed with PDF'
      }

      setMessage(`Invoice saved${emailStatus}: ${invoiceNumber}`)

      if (shouldPrint) {
        printInvoice(invoiceNumber)
      }

      fetchData()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  function printInvoice(invoiceNumber) {
    const w = window.open('', '_blank')
    w.document.write(`
      ${buildInvoiceHtml(invoiceNumber)}
      <script>
        window.onload = () => window.print()
      </script>
    `)
    w.document.close()
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="mb-6 text-4xl font-black">Create Invoice</h1>

      {message && (
        <div className="mb-6 rounded-xl bg-yellow-400/10 p-4 text-yellow-300">
          {message}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-[#1a1d26] p-6">
          <h2 className="mb-4 text-2xl font-bold">Customer / CRM</h2>

          <input
            placeholder="Search saved customer by name, phone, email..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="mb-3 w-full rounded-xl bg-[#0f1219] p-3 text-white"
          />

          {filteredCustomers.length > 0 && (
            <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-[#0f1219]">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => selectCustomer(customer)}
                  className="block w-full border-b border-white/10 px-4 py-3 text-left hover:bg-[#1a1d26]"
                >
                  <p className="font-bold text-yellow-400">{customer.name}</p>
                  <p className="text-sm text-gray-400">
                    {customer.phone || 'No phone'} • {customer.email || 'No email'}
                  </p>
                </button>
              ))}
            </div>
          )}

          {(invoice.customer_name || invoice.customer_phone) && (
            <button
              type="button"
              onClick={clearCustomer}
              className="mb-3 rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white"
            >
              Clear Customer
            </button>
          )}

          {[
            'customer_name',
            'customer_phone',
            'customer_email',
            'customer_address',
            'delivery_address',
            'note',
          ].map((field) => (
            <input
              key={field}
              placeholder={field.replaceAll('_', ' ')}
              value={invoice[field]}
              onChange={(e) => setInvoice({ ...invoice, [field]: e.target.value })}
              className="mb-3 w-full rounded-xl bg-[#0f1219] p-3 text-white"
            />
          ))}

          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Freight"
              value={invoice.freight}
              onChange={(e) => setInvoice({ ...invoice, freight: e.target.value })}
              className="rounded-xl bg-[#0f1219] p-3 text-white"
            />

            <input
              placeholder="Rounding"
              value={invoice.rounding}
              onChange={(e) => setInvoice({ ...invoice, rounding: e.target.value })}
              className="rounded-xl bg-[#0f1219] p-3 text-white"
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <select
              value={invoice.payment_status}
              onChange={(e) => setInvoice({ ...invoice, payment_status: e.target.value })}
              className="rounded-xl bg-[#0f1219] p-3 text-white"
            >
              <option>Unpaid</option>
              <option>Paid</option>
              <option>Deposit</option>
            </select>

            <input
              placeholder="Payment method"
              value={invoice.payment_method}
              onChange={(e) => setInvoice({ ...invoice, payment_method: e.target.value })}
              className="rounded-xl bg-[#0f1219] p-3 text-white"
            />

            <input
              placeholder="Amount paid"
              value={invoice.amount_paid}
              onChange={(e) => setInvoice({ ...invoice, amount_paid: e.target.value })}
              disabled={invoice.payment_status === 'Paid'}
              className="rounded-xl bg-[#0f1219] p-3 text-white disabled:opacity-50"
            />
          </div>

          <div className="mt-4 rounded-xl bg-[#0f1219] p-4 text-sm">
            <p>Total: ${total.toFixed(2)}</p>
            <p>Amount Paid: ${amountPaid.toFixed(2)}</p>
            <p>Balance Due: ${balanceDue.toFixed(2)}</p>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold text-yellow-400">
              Email Message Preview
            </label>

            <input
              value={`Invoice ${makeInvoiceNumber()}`}
              readOnly
              className="mb-3 w-full rounded-xl bg-[#0f1219] p-3 text-gray-400"
            />

            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              rows={8}
              className="w-full rounded-xl bg-[#0f1219] p-3 text-white"
            />
          </div>

          <label className="mt-4 flex gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={markSold} onChange={(e) => setMarkSold(e.target.checked)} />
            Mark inventory parts as sold after invoice
          </label>
        </div>

        <div className="rounded-2xl bg-[#1a1d26] p-6">
          <h2 className="mb-4 text-2xl font-bold">Add Items</h2>

          <select
            onChange={(e) => {
              addInventoryPart(e.target.value)
              e.target.value = ''
            }}
            className="mb-3 w-full rounded-xl bg-[#0f1219] p-3 text-white"
          >
            <option value="">Select inventory part</option>
            {parts.map((part) => {
              const vehicle = getVehicle(part.vehicle_id)
              return (
                <option key={part.id} value={part.id}>
                  {part.stock_number} — {part.part_name || part.part_type} — {vehicle?.year}{' '}
                  {vehicle?.make} {vehicle?.model} — ${part.price || 0}
                </option>
              )
            })}
          </select>

          <button
            type="button"
            onClick={addCustomItem}
            className="rounded-xl bg-blue-500 px-4 py-3 font-bold text-white"
          >
            Add Custom / External Part
          </button>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-[#1a1d26] p-6">
        <h2 className="mb-4 text-2xl font-bold">Invoice Items</h2>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid gap-2 md:grid-cols-7">
              <input value={item.location} onChange={(e) => updateItem(index, 'location', e.target.value)} placeholder="Location" className="rounded bg-[#0f1219] p-2" />
              <input value={item.part_number} onChange={(e) => updateItem(index, 'part_number', e.target.value)} placeholder="Part #" className="rounded bg-[#0f1219] p-2" />
              <input value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} placeholder="Description" className="rounded bg-[#0f1219] p-2 md:col-span-2" />
              <input value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} placeholder="Qty" className="rounded bg-[#0f1219] p-2" />
              <input value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} placeholder="Price" className="rounded bg-[#0f1219] p-2" />
              <button onClick={() => removeItem(index)} className="rounded bg-red-500 px-3 py-2 font-bold">Remove</button>
            </div>
          ))}
        </div>

        <div className="mt-6 text-right text-xl font-black">
          Total: ${total.toFixed(2)} | GST: ${gst.toFixed(2)}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <button
            onClick={() => saveInvoice({ shouldPrint: true, shouldEmail: false })}
            disabled={saving}
            className="rounded-xl bg-green-500 px-5 py-4 font-black text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save & Print'}
          </button>

          <button
            onClick={() => saveInvoice({ shouldPrint: false, shouldEmail: true })}
            disabled={saving}
            className="rounded-xl bg-blue-500 px-5 py-4 font-black text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save & Email PDF'}
          </button>

          <button
            onClick={() => saveInvoice({ shouldPrint: true, shouldEmail: true })}
            disabled={saving}
            className="rounded-xl bg-yellow-400 px-5 py-4 font-black text-black disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save, Print & Email PDF'}
          </button>
        </div>
      </section>
    </main>
  )
}