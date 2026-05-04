import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Inventory() {
  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchVehiclesAndParts()
  }, [])

  async function fetchVehiclesAndParts() {
    const { data: vehicleData } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: partData } = await supabase
      .from('parts')
      .select('*')
      .order('created_at', { ascending: false })

    const vehiclesWithParts = (vehicleData || []).map((vehicle) => ({
      ...vehicle,
      parts: (partData || []).filter(
        (part) =>
          part.vehicle_id === vehicle.id &&
          (part.status || '').toLowerCase() !== 'sold' // ✅ HIDE SOLD
      ),
    }))

    setVehicles(vehiclesWithParts)
  }

  function getMainImage(item) {
    return item?.image_urls?.[0] || item?.image_url || ''
  }

  function getImageCount(item) {
    if (item?.image_urls?.length) return item.image_urls.length
    if (item?.image_url) return 1
    return 0
  }

  function groupParts(parts) {
    const grouped = {}

    ;(parts || []).forEach((part) => {
      const main = part.main_category || part.category || 'Other'
      const sub = part.sub_category || 'General'

      if (!grouped[main]) grouped[main] = {}
      if (!grouped[main][sub]) grouped[main][sub] = []

      grouped[main][sub].push(part)
    })

    return grouped
  }

  const filteredVehicles = vehicles.filter((vehicle) => {
    const text = `
      ${vehicle.stock_number}
      ${vehicle.year}
      ${vehicle.make}
      ${vehicle.model}
      ${vehicle.chassis_code}
      ${vehicle.engine_code}
      ${vehicle.paint_code}
      ${vehicle.vin}
    `.toLowerCase()

    return text.includes(search.toLowerCase())
  })

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-yellow-400">
            Vehicle Stock
          </p>
          <h1 className="mt-2 text-4xl font-black">
            Vehicles Being Wrecked
          </h1>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Camry, AXVH70, 1F7..."
          className="w-full rounded-xl bg-[#1a1d26] px-4 py-3 text-white md:w-96"
        />
      </div>

      <div className="space-y-6">
        {filteredVehicles.map((vehicle) => {
          const groupedParts = groupParts(vehicle.parts)
          const vehicleImage = getMainImage(vehicle)
          const imageCount = getImageCount(vehicle)

          return (
            <div
              key={vehicle.id}
              className="rounded-2xl border border-white/10 bg-[#1a1d26]"
            >
              <div className="grid lg:grid-cols-[340px_1fr]">
                {/* IMAGE */}
                <div className="relative flex h-64 items-center justify-center bg-black/30">
                  {vehicleImage ? (
                    <>
                      <img
                        src={vehicleImage}
                        className="h-full w-full object-cover"
                      />

                      {imageCount > 1 && (
                        <span className="absolute top-2 right-2 bg-black/70 px-3 py-1 text-xs text-white rounded-full">
                          {imageCount} photos
                        </span>
                      )}
                    </>
                  ) : (
                    <span>No Image</span>
                  )}
                </div>

                {/* DETAILS */}
                <div className="p-6">
                  <h2 className="text-2xl font-black">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h2>

                  <p className="text-gray-400 mt-1">
                    {vehicle.chassis_code} • {vehicle.engine_code} • {vehicle.paint_code}
                  </p>

                  <div className="mt-4 space-y-4">
                    {Object.entries(groupedParts).map(([main, subs]) => (
                      <div key={main}>
                        <h3 className="text-yellow-400 font-bold">
                          {main}
                        </h3>

                        {Object.entries(subs).map(([sub, parts]) => (
                          <div key={sub}>
                            <h4 className="text-sm text-gray-400 mt-2">
                              {sub}
                            </h4>

                            <div className="grid md:grid-cols-2 gap-3 mt-2">
                              {parts.map((part) => {
                                const partImage = getMainImage(part)

                                return (
                                  <div
                                    key={part.id}
                                    className="bg-[#0f1219] p-3 rounded-xl"
                                  >
                                    <div className="flex gap-3">
                                      {/* PART IMAGE */}
                                      <div className="w-20 h-20 bg-black/30 rounded overflow-hidden">
                                        {partImage && (
                                          <img
                                            src={partImage}
                                            className="w-full h-full object-cover"
                                          />
                                        )}
                                      </div>

                                      <div>
                                        <p className="text-xs text-yellow-400">
                                          {part.stock_number}
                                        </p>

                                        <p className="font-bold">
                                          {part.part_name}
                                        </p>

                                        <p className="text-sm text-gray-400">
                                          {part.condition}
                                        </p>

                                        <p className="font-bold mt-1">
                                          {part.price
                                            ? `$${part.price}`
                                            : 'Call'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}