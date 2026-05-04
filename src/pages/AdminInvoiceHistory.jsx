import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminInvoiceHistory() {
  const [invoices, setInvoices] = useState([])
  const [items, setItems] = useState([])
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null)
  const [editingPaymentId, setEditingPaymentId] = useState(null)
  const [paymentEdit, setPaymentEdit] = useState({
    payment_status: 'Unpaid',
    payment_method: '',
    amount_paid: '0',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: itemData } = await supabase
      .from('invoice_items')
      .select('*')

    const { data: customerData } = await supabase
      .from('customers')
      .select('*')

    setInvoices(invoiceData || [])
    setItems(itemData || [])
    setCustomers(customerData || [])
  }

  function getCustomer(customerId) {
    return customers.find((c) => c.id === customerId)
  }

  function getInvoiceItems(invoiceId) {
    return items.filter((item) => item.invoice_id === invoiceId)
  }

  function startPaymentEdit(invoice) {
    setEditingPaymentId(invoice.id)
    setPaymentEdit({
      payment_status: invoice.payment_status || 'Unpaid',
      payment_method: invoice.payment_method || '',
      amount_paid: String(invoice.amount_paid || 0),
    })
  }

  async function savePayment(invoiceId) {
    const invoice = invoices.find((i) => i.id === invoiceId)
    const total = Number(invoice?.total || 0)

    const amountPaid =
      paymentEdit.payment_status === 'Paid'
        ? total
        : Number(paymentEdit.amount_paid || 0)

    const balanceDue = Math.max(total - amountPaid, 0)

    const finalStatus =
      amountPaid >= total ? 'Paid' : amountPaid > 0 ? 'Deposit' : 'Unpaid'

    const { error } = await supabase
      .from('invoices')
      .update({
        payment_status: finalStatus,
        payment_method: paymentEdit.payment_method,
        amount_paid: amountPaid,
        balance_due: balanceDue,
      })
      .eq('id', invoiceId)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Payment updated.')
    setEditingPaymentId(null)
    fetchData()
  }

  async function deleteInvoice(invoiceId, invoiceNumber) {
    const confirmed = confirm(
      `Delete invoice ${invoiceNumber}? This will also delete its invoice items.`
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage(`Invoice ${invoiceNumber} deleted.`)
    fetchData()
  }

  function reprintInvoice(invoice) {
    const customer = getCustomer(invoice.customer_id)
    const invoiceItems = getInvoiceItems(invoice.id)

    const rows = invoiceItems
      .map((item, index) => {
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
            <td>$${Number(item.total || 0).toFixed(2)}</td>
          </tr>
        `
      })
      .join('')

    const w = window.open('', '_blank')

    w.document.write(`
      <html>
        <head>
          <title>${invoice.invoice_number}</title>
          <style>
            @page { size: A4 landscape; margin: 7mm; }
            body { font-family: Arial, sans-serif; color: #000; font-size: 10px; }
            .top { display: flex; justify-content: space-between; align-items: flex-start; }
            .logo { font-size: 42px; font-weight: 900; line-height: 0.85; letter-spacing: 2px; }
            .company { text-align: right; font-size: 10px; font-weight: 700; }
            .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 10px; }
            .wide { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
            .box { border: 1px solid #000; min-height: 55px; padding: 6px; position: relative; }
            .label { position: absolute; top: -9px; left: 0; background: white; border: 1px solid #000; padding: 0 5px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #000; padding: 4px; vertical-align: top; }
            th { font-weight: 800; text-align: center; }
            .bottom { display: grid; grid-template-columns: 1.3fr 1fr; gap: 8px; margin-top: 8px; }
            .terms { border: 1px solid #000; padding: 5px; font-size: 7px; line-height: 1.15; }
            .totals { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
            .totalBox { border: 1px solid #000; text-align: center; font-weight: 900; font-size: 14px; }
            .totalBox div:first-child { background: #eee; border-bottom: 1px solid #000; padding: 4px; }
            .totalBox div:last-child { padding: 8px 4px; }
            .sign { margin-top: 22px; text-align: center; font-weight: 700; }
          </style>
        </head>

        <body>
          <div class="top">
            <div class="logo">BABA JI<br/>PARTS</div>
            <div class="company">
              MELBOURNE AUTO WRECKING PTY LTD TRADING AS BABA JI PARTS<br/>
              ABN 30 672 278 063<br/>
              82 HORNE STREET, CAMPBELLFIELD, VIC, 3061<br/>
              TEL: 03 9359 2061 &nbsp; MOB: 0430 099 873<br/>
              sales@babajipartsmelb.com.au<br/>
              www.babajipartsmelb.com.au
            </div>
          </div>

          <div class="grid3">
            <div class="box">
              <div class="label">Customer</div>
              ${customer?.name || invoice.customer_name || ''}<br/>
              ${customer?.phone || invoice.customer_phone || ''}<br/>
              ${customer?.email || invoice.customer_email || ''}<br/>
              ${customer?.address || invoice.customer_address || ''}
            </div>

            <div class="box">
              <div class="label">Deliver To</div>
              ${invoice.delivery_address || 'Pickup / Delivery TBC'}
            </div>

            <div class="box">
              <div class="label">Invoice Info</div>
              Inv No: ${invoice.invoice_number}<br/>
              Date: ${new Date(invoice.created_at).toLocaleDateString()}<br/>
              Payment: ${invoice.payment_status || 'Unpaid'}<br/>
              Method: ${invoice.payment_method || 'TBC'}
            </div>
          </div>

          <div class="wide">
            <div class="box">
              <div class="label">Note</div>
              ${invoice.note || ''}
            </div>
            <div class="box">
              <div class="label">Payment</div>
              Paid: $${Number(invoice.amount_paid || 0).toFixed(2)}<br/>
              Balance: $${Number(invoice.balance_due || 0).toFixed(2)}
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
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="bottom">
            <div class="terms">
              <b>Please Note:</b> No return on electrical parts. No return on special orders.
              Engines and gearboxes must be checked before fitting. No labour claims accepted.
              Parts must be inspected before installation. Warranty applies only where expressly stated.
            </div>

            <div>
              <div class="totals">
                <div class="totalBox"><div>Sub-Total</div><div>$${Number(invoice.subtotal || 0).toFixed(2)}</div></div>
                <div class="totalBox"><div>Freight</div><div>$${Number(invoice.freight || 0).toFixed(2)}</div></div>
                <div class="totalBox"><div>Rounding</div><div>$${Number(invoice.rounding || 0).toFixed(2)}</div></div>
                <div class="totalBox"><div>GST</div><div>$${Number(invoice.gst || 0).toFixed(2)}</div></div>
                <div class="totalBox"><div>TOTAL</div><div>$${Number(invoice.total || 0).toFixed(2)}</div></div>
              </div>

              <div class="sign">
                Please sign here ____________________________________________
              </div>
            </div>
          </div>

          <script>window.onload = () => window.print()</script>
        </body>
      </html>
    `)

    w.document.close()
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const customer = getCustomer(invoice.customer_id)
    const invoiceItems = getInvoiceItems(invoice.id)

    const text = `
      ${invoice.invoice_number}
      ${invoice.customer_name}
      ${invoice.customer_phone}
      ${customer?.name}
      ${customer?.phone}
      ${customer?.email}
      ${invoice.payment_status}
      ${invoice.payment_method}
      ${invoice.total}
      ${invoiceItems.map((i) => `${i.part_number} ${i.description}`).join(' ')}
    `.toLowerCase()

    return text.includes(search.toLowerCase())
  })

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="mb-6 text-4xl font-black">Invoice History</h1>

      {message && (
        <div className="mb-6 rounded-xl bg-yellow-400/10 p-4 text-yellow-300">
          {message}
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search invoice, customer, phone, part number..."
        className="mb-6 w-full rounded-xl bg-[#1a1d26] p-4 text-white"
      />

      <div className="overflow-auto rounded-2xl bg-[#1a1d26] p-6">
        <table className="w-full min-w-[1250px] text-left text-sm">
          <thead className="bg-black/30 text-gray-400">
            <tr>
              <th className="p-3">Invoice #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Date</th>
              <th className="p-3">Total</th>
              <th className="p-3">Paid</th>
              <th className="p-3">Balance</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredInvoices.map((invoice) => {
              const customer = getCustomer(invoice.customer_id)
              const invoiceItems = getInvoiceItems(invoice.id)
              const isExpanded = expandedInvoiceId === invoice.id
              const isEditingPayment = editingPaymentId === invoice.id

              return (
                <>
                  <tr key={invoice.id} className="border-t border-white/10">
                    <td className="p-3 font-bold text-yellow-400">
                      {invoice.invoice_number}
                    </td>

                    <td className="p-3">
                      {customer?.name || invoice.customer_name || 'No customer'}
                      <br />
                      <span className="text-xs text-gray-400">
                        {customer?.phone || invoice.customer_phone}
                      </span>
                    </td>

                    <td className="p-3">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </td>

                    <td className="p-3 font-bold">
                      ${Number(invoice.total || 0).toFixed(2)}
                    </td>

                    <td className="p-3">
                      {isEditingPayment ? (
                        <input
                          value={paymentEdit.amount_paid}
                          onChange={(e) =>
                            setPaymentEdit({
                              ...paymentEdit,
                              amount_paid: e.target.value,
                            })
                          }
                          className="w-24 rounded bg-[#0f1219] p-2 text-white"
                        />
                      ) : (
                        `$${Number(invoice.amount_paid || 0).toFixed(2)}`
                      )}
                    </td>

                    <td className="p-3">
                      ${Number(invoice.balance_due || 0).toFixed(2)}
                    </td>

                    <td className="p-3">
                      {isEditingPayment ? (
                        <div className="space-y-2">
                          <select
                            value={paymentEdit.payment_status}
                            onChange={(e) =>
                              setPaymentEdit({
                                ...paymentEdit,
                                payment_status: e.target.value,
                              })
                            }
                            className="w-full rounded bg-[#0f1219] p-2 text-white"
                          >
                            <option>Unpaid</option>
                            <option>Paid</option>
                            <option>Deposit</option>
                          </select>

                          <input
                            value={paymentEdit.payment_method}
                            onChange={(e) =>
                              setPaymentEdit({
                                ...paymentEdit,
                                payment_method: e.target.value,
                              })
                            }
                            placeholder="Payment method"
                            className="w-full rounded bg-[#0f1219] p-2 text-white"
                          />
                        </div>
                      ) : (
                        <span className="rounded bg-black/30 px-3 py-1 text-xs font-bold">
                          {invoice.payment_status || 'Unpaid'}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            setExpandedInvoiceId(isExpanded ? null : invoice.id)
                          }
                          className="rounded bg-blue-500 px-3 py-2 font-bold text-white"
                        >
                          {isExpanded ? 'Hide' : 'View'}
                        </button>

                        <button
                          onClick={() => reprintInvoice(invoice)}
                          className="rounded bg-green-500 px-3 py-2 font-bold text-white"
                        >
                          Reprint
                        </button>

                        {isEditingPayment ? (
                          <button
                            onClick={() => savePayment(invoice.id)}
                            className="rounded bg-yellow-400 px-3 py-2 font-bold text-black"
                          >
                            Save Pay
                          </button>
                        ) : (
                          <button
                            onClick={() => startPaymentEdit(invoice)}
                            className="rounded bg-purple-500 px-3 py-2 font-bold text-white"
                          >
                            Edit Pay
                          </button>
                        )}

                        <button
                          onClick={() =>
                            deleteInvoice(invoice.id, invoice.invoice_number)
                          }
                          className="rounded bg-red-500 px-3 py-2 font-bold text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="border-t border-white/10 bg-black/20">
                      <td colSpan="8" className="p-4">
                        <h3 className="mb-3 text-lg font-bold text-yellow-400">
                          Invoice Items
                        </h3>

                        <div className="overflow-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-black/30 text-gray-400">
                              <tr>
                                <th className="p-2">Line</th>
                                <th className="p-2">Location</th>
                                <th className="p-2">Part #</th>
                                <th className="p-2">Description</th>
                                <th className="p-2">Qty</th>
                                <th className="p-2">Unit</th>
                                <th className="p-2">Total</th>
                              </tr>
                            </thead>

                            <tbody>
                              {invoiceItems.map((item) => (
                                <tr key={item.id} className="border-t border-white/10">
                                  <td className="p-2">{item.line_no}</td>
                                  <td className="p-2">{item.location}</td>
                                  <td className="p-2">{item.part_number}</td>
                                  <td className="p-2">{item.description}</td>
                                  <td className="p-2">{item.quantity}</td>
                                  <td className="p-2">
                                    ${Number(item.unit_price || 0).toFixed(2)}
                                  </td>
                                  <td className="p-2 font-bold">
                                    ${Number(item.total || 0).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </main>
  )
}