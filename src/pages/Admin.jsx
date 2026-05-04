import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const adminCards = [
  {
    title: 'Add Stock',
    desc: 'Add vehicles, parts, images, categories, stock numbers and labels.',
    link: '/admin/add-stock',
  },
  {
    title: 'Inventory',
    desc: 'Edit vehicles, parts, prices, locations, images and sold status.',
    link: '/admin/inventory',
  },
  {
    title: 'Invoices',
    desc: 'Create A4 landscape invoices and mark inventory sold.',
    link: '/admin/invoices',
  },
  {
    title: 'Invoice History',
    desc: 'Search old invoices, reprint, delete tests, and track payments.',
    link: '/admin/invoices/history',
  },
  {
    title: 'Blog Manager',
    desc: 'Create SEO blog posts for your 90 day Google ranking plan.',
    link: '/admin/blog',
  },
  {
  title: 'eBay Listings',
  desc: 'Prepare eBay titles, descriptions, prices and listing copy from inventory.',
  link: '/admin/ebay',
},
]

export default function Admin() {
  const [invoices, setInvoices] = useState([])
  const [invoiceItems, setInvoiceItems] = useState([])
  const [parts, setParts] = useState([])
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: invoiceItemData } = await supabase
      .from('invoice_items')
      .select('*')

    const { data: partData } = await supabase.from('parts').select('*')
    const { data: vehicleData } = await supabase.from('vehicles').select('*')

    setInvoices(invoiceData || [])
    setInvoiceItems(invoiceItemData || [])
    setParts(partData || [])
    setVehicles(vehicleData || [])
  }

  const stats = useMemo(() => {
    const now = new Date()

    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const totalFor = (startDate) =>
      invoices
        .filter((invoice) => new Date(invoice.created_at) >= startDate)
        .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0)

    const invoicesToday = invoices.filter(
      (invoice) => new Date(invoice.created_at) >= startOfToday
    )

    const paidTotal = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.amount_paid || 0),
      0
    )

    const unpaidBalance = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.balance_due || 0),
      0
    )

    const soldParts = parts.filter(
      (part) => (part.status || '').toLowerCase() === 'sold'
    )

    const availableParts = parts.filter(
      (part) => (part.status || '').toLowerCase() !== 'sold'
    )

    const walkInInvoices = invoices.filter((invoice) => {
      const name = (invoice.customer_name || '').toLowerCase()
      return name.includes('walk') || name.includes('cash sale')
    })

    return {
      revenueToday: totalFor(startOfToday),
      revenueWeek: totalFor(startOfWeek),
      revenueMonth: totalFor(startOfMonth),
      invoicesToday: invoicesToday.length,
      paidTotal,
      unpaidBalance,
      soldParts: soldParts.length,
      availableParts: availableParts.length,
      activeVehicles: vehicles.length,
      walkInSales: walkInInvoices.length,
    }
  }, [invoices, parts, vehicles])

  const topItems = useMemo(() => {
    const map = {}

    invoiceItems.forEach((item) => {
      const key = item.description || item.part_number || 'Unknown Item'

      if (!map[key]) {
        map[key] = {
          name: key,
          quantity: 0,
          revenue: 0,
        }
      }

      map[key].quantity += Number(item.quantity || 1)
      map[key].revenue += Number(item.total || 0)
    })

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
  }, [invoiceItems])

  const topCategories = useMemo(() => {
    const map = {}

    parts.forEach((part) => {
      const category = part.main_category || part.category || 'Other'

      if (!map[category]) {
        map[category] = {
          name: category,
          available: 0,
          sold: 0,
        }
      }

      if ((part.status || '').toLowerCase() === 'sold') {
        map[category].sold += 1
      } else {
        map[category].available += 1
      }
    })

    return Object.values(map)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 8)
  }, [parts])

  const recentInvoices = invoices.slice(0, 8)
  const recentSoldItems = invoiceItems.slice(-8).reverse()

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="mb-8 rounded-3xl border border-white/10 bg-[#1a1d26] p-8">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
          BlackCrow Wrecker Module 1.0
        </p>

        <h1 className="mt-3 text-4xl font-black">Operations Dashboard</h1>

        <p className="mt-3 max-w-3xl text-gray-400">
          Sales, invoices, stock, payments, vehicles and SEO content from one command centre.
        </p>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat title="Revenue Today" value={`$${stats.revenueToday.toFixed(2)}`} />
        <Stat title="Revenue 7 Days" value={`$${stats.revenueWeek.toFixed(2)}`} />
        <Stat title="Revenue This Month" value={`$${stats.revenueMonth.toFixed(2)}`} />
        <Stat title="Invoices Today" value={stats.invoicesToday} />
        <Stat title="Total Paid Collected" value={`$${stats.paidTotal.toFixed(2)}`} />
        <Stat title="Unpaid Balance" value={`$${stats.unpaidBalance.toFixed(2)}`} />
        <Stat title="Sold Parts" value={stats.soldParts} />
        <Stat title="Available Parts" value={stats.availableParts} />
        <Stat title="Vehicles in System" value={stats.activeVehicles} />
        <Stat title="Walk-in / Cash Sales" value={stats.walkInSales} />
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="rounded-2xl border border-white/10 bg-[#1a1d26] p-6">
          <h2 className="mb-4 text-2xl font-black">Quick Actions</h2>

          <section className="grid gap-5 md:grid-cols-2">
            {adminCards.map((card) => (
              <Link
                key={card.title}
                to={card.link}
                className="rounded-2xl border border-white/10 bg-[#0f1219] p-5 transition hover:border-yellow-400/60 hover:bg-[#202532]"
              >
                <h3 className="text-xl font-black text-yellow-400">{card.title}</h3>

                <p className="mt-3 text-sm leading-6 text-gray-400">{card.desc}</p>

                <div className="mt-5 font-bold text-white">Open →</div>
              </Link>
            ))}
          </section>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#1a1d26] p-6">
          <h2 className="mb-4 text-2xl font-black">Recent Invoices</h2>

          <div className="space-y-3">
            {recentInvoices.length > 0 ? (
              recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="rounded-xl border border-white/10 bg-[#0f1219] p-4"
                >
                  <p className="font-bold text-yellow-400">{invoice.invoice_number}</p>
                  <p className="text-sm text-gray-300">
                    {invoice.customer_name || 'No customer'} — ${Number(invoice.total || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {invoice.payment_status || 'Unpaid'} • Paid ${Number(invoice.amount_paid || 0).toFixed(2)} • Balance ${Number(invoice.balance_due || 0).toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No invoices yet.</p>
            )}
          </div>

          <Link
            to="/admin/invoices/history"
            className="mt-5 block rounded-xl bg-blue-500 px-4 py-3 text-center font-bold text-white"
          >
            View Invoice History
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="Top Selling Items">
          {topItems.length > 0 ? (
            <div className="space-y-3">
              {topItems.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-white/10 bg-[#0f1219] p-4"
                >
                  <p className="font-bold">{item.name}</p>
                  <p className="text-sm text-gray-400">
                    Qty {item.quantity} • ${item.revenue.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No sold items yet.</p>
          )}
        </Panel>

        <Panel title="Category Performance">
          {topCategories.length > 0 ? (
            <div className="space-y-3">
              {topCategories.map((category) => (
                <div
                  key={category.name}
                  className="rounded-xl border border-white/10 bg-[#0f1219] p-4"
                >
                  <p className="font-bold text-yellow-400">{category.name}</p>
                  <p className="text-sm text-gray-400">
                    Sold {category.sold} • Available {category.available}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No categories yet.</p>
          )}
        </Panel>

        <Panel title="Recent Sold Items">
          {recentSoldItems.length > 0 ? (
            <div className="space-y-3">
              {recentSoldItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-[#0f1219] p-4"
                >
                  <p className="font-bold">{item.description || item.part_number}</p>
                  <p className="text-sm text-gray-400">
                    {item.part_number || 'No part #'} • ${Number(item.total || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No sold items yet.</p>
          )}
        </Panel>
      </section>
    </main>
  )
}

function Stat({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1a1d26] p-5">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="mt-2 text-3xl font-black text-yellow-400">{value}</p>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1a1d26] p-6">
      <h2 className="mb-4 text-2xl font-black">{title}</h2>
      {children}
    </div>
  )
}