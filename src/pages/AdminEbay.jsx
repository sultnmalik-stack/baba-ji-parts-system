import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminEbay() {
  const [parts, setParts] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: partData } = await supabase
      .from('parts')
      .select('*')
      .neq('status', 'Sold')
      .order('created_at', { ascending: false })

    const { data: vehicleData } = await supabase.from('vehicles').select('*')

    setParts(partData || [])
    setVehicles(vehicleData || [])
  }

  function getVehicle(vehicleId) {
    return vehicles.find((v) => v.id === vehicleId)
  }

  function generateTitle(part) {
    const vehicle = getVehicle(part.vehicle_id)

    return `${vehicle?.year || ''} ${vehicle?.make || ''} ${vehicle?.model || ''} ${vehicle?.chassis_code || ''} ${part.part_name || part.part_type || ''}`.trim()
  }

  function generateDescription(part) {
    const vehicle = getVehicle(part.vehicle_id)

    return `${part.part_name || part.part_type || 'Used auto part'} for sale.

Vehicle:
${vehicle?.year || ''} ${vehicle?.make || ''} ${vehicle?.model || ''}
Chassis: ${vehicle?.chassis_code || 'N/A'}
Engine: ${vehicle?.engine_code || 'N/A'}
Paint Code: ${vehicle?.paint_code || 'N/A'}

Part Details:
Part Number: ${part.stock_number || 'N/A'}
Condition: ${part.condition || 'Used'}
Location: Melbourne, VIC

Please confirm fitment before purchase.
Pickup available from Baba Ji Parts.
Freight available Australia-wide.`
  }

  async function prepareForEbay(part) {
    const title = part.ebay_title || generateTitle(part)
    const description = part.ebay_description || generateDescription(part)
    const price = part.ebay_price || part.price || 0

    const { error } = await supabase
      .from('parts')
      .update({
        ebay_title: title,
        ebay_description: description,
        ebay_price: price,
        ebay_status: 'Ready',
        ebay_last_exported_at: new Date().toISOString(),
      })
      .eq('id', part.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Part prepared for eBay.')
    fetchData()
  }

  async function markListed(part) {
    const { error } = await supabase
      .from('parts')
      .update({
        ebay_status: 'Listed',
      })
      .eq('id', part.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Marked as listed.')
    fetchData()
  }

  function copyText(text) {
    navigator.clipboard.writeText(text || '')
    setMessage('Copied.')
  }

  // 🔥 CSV SAFE FORMAT
  function formatCSV(value) {
    if (!value) return ''
    return `"${String(value).replace(/"/g, '""').replace(/\n/g, ' ')}"`
  }

  function exportCSV() {
    const readyParts = parts.filter((p) => p.ebay_status === 'Ready')

    if (readyParts.length === 0) {
      setMessage('No Ready parts.')
      return
    }

    const headers = [
      'Title',
      'Description',
      'Price',
      'Quantity',
      'Condition',
      'SKU',
      'Location',
    ]

    const rows = readyParts.map((part) => {
      return [
        formatCSV(part.ebay_title || generateTitle(part)),
        formatCSV(part.ebay_description || generateDescription(part)),
        part.ebay_price || part.price || 0,
        1,
        'Used',
        formatCSV(part.stock_number),
        'Melbourne VIC',
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `ebay-export-${Date.now()}.csv`
    link.click()

    setMessage(`Exported ${readyParts.length} parts.`)
  }

  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      const vehicle = getVehicle(part.vehicle_id)

      const text = `
        ${part.stock_number}
        ${part.part_name}
        ${part.part_type}
        ${vehicle?.year}
        ${vehicle?.make}
        ${vehicle?.model}
      `.toLowerCase()

      return text.includes(search.toLowerCase())
    })
  }, [parts, vehicles, search])

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-4xl font-black mb-6">eBay Listing System</h1>

      {message && (
        <div className="mb-6 rounded-xl bg-yellow-400/10 p-4 text-yellow-300">
          {message}
        </div>
      )}

      <div className="mb-6 flex gap-3">
        <button
          onClick={exportCSV}
          className="rounded-xl bg-green-500 px-5 py-3 font-bold text-white"
        >
          Export Ready Parts
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search parts..."
        className="mb-6 w-full rounded-xl bg-[#1a1d26] p-4 text-white"
      />

      <div className="space-y-4">
        {filteredParts.map((part) => {
          const vehicle = getVehicle(part.vehicle_id)
          const title = part.ebay_title || generateTitle(part)
          const description = part.ebay_description || generateDescription(part)

          return (
            <div key={part.id} className="rounded-2xl bg-[#1a1d26] p-5">
              <h2 className="text-xl font-bold">{part.part_name}</h2>

              <p className="text-sm text-gray-400">
                {vehicle?.year} {vehicle?.make} {vehicle?.model}
              </p>

              <p className="text-yellow-400 mt-1">
                {part.ebay_status || 'Not Listed'}
              </p>

              <div className="mt-3 flex gap-2">
                <button onClick={() => prepareForEbay(part)} className="bg-yellow-400 px-3 py-2 rounded font-bold">
                  Prepare
                </button>

                <button onClick={() => markListed(part)} className="bg-green-500 px-3 py-2 rounded font-bold text-white">
                  Listed
                </button>

                <button onClick={() => copyText(title)} className="bg-blue-500 px-3 py-2 rounded text-white">
                  Copy Title
                </button>

                <button onClick={() => copyText(description)} className="bg-blue-500 px-3 py-2 rounded text-white">
                  Copy Desc
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}