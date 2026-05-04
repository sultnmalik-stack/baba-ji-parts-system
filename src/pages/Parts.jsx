import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const CATALOGUE = {
  'Body Parts': {
    'Front End Parts': [
      'Bonnet',
      'Guard',
      'Front bumper',
      'Grille',
      'Front Bar Reinforcement',
      'Headlight Left',
      'Headlight Right',
      'Radiator Support',
    ],
    'Rear End Parts': [
      'Bootlid / Tailgate',
      'Tail light Left',
      'Tail light Right',
      'Rear Bumper',
      'Rear Bar Reinforcement',
    ],
    Doors: [
      'Door',
      'Door Mirror',
      'Door Glass',
      'Window Regulator / Motor',
      'Door Lock Mechanism',
      'Door Handle',
      'Door Trim',
    ],
    Others: [
      'Fuel Flap',
      'Bonnet Hinges',
      'Wheel Arch Flare',
      'Bootlid / Tailgate Struts',
    ],
  },
  Wheels: {
    Wheels: ['Alloy Wheel', 'Steel Wheel', 'Tyre', 'Wheel Set'],
  },
  Lights: {
    Lights: [
      'Headlight Left',
      'Headlight Right',
      'Tail light Left',
      'Tail light Right',
      'Fog Light',
      'Indicator',
      'Brake Light',
    ],
  },
  'Suspension & Steering': {
    'Suspension & Steering': [
      'Lower Control Arm',
      'Wheel Hub',
      'Power Steering Pump',
      'Power Steering Rack',
      'Struts / Shockers',
      'Sway Bar Links / Stabilisers',
    ],
  },
  Electrical: {
    Modules: ['ECU', 'ABS Module', 'Airbag Module', 'BCM', 'Fuse Box'],
    Switches: ['Window Switch', 'Combination Switch', 'Ignition Switch'],
    Wiring: ['Wiring Loom', 'Engine Harness', 'Door Loom'],
    Charging: ['Alternator', 'Starter Motor'],
  },
  Mechanical: {
    Engine: ['Engine', 'Turbo', 'Throttle Body', 'Injector', 'Fuel Pump'],
    Transmission: ['Transmission', 'Transfer Case', 'Differential'],
    Drivetrain: ['Driveshaft', 'Tailshaft', 'CV Shaft'],
  },
}

export default function Parts() {
  const [parts, setParts] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState('')
  const [activeMain, setActiveMain] = useState('Body Parts')
  const [activeSub, setActiveSub] = useState('Front End Parts')
  const [activeType, setActiveType] = useState('Front bumper')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: partData, error: partError } = await supabase
      .from('parts')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: vehicleData, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')

    if (partError) console.error(partError)
    if (vehicleError) console.error(vehicleError)

    setParts(partData || [])
    setVehicles(vehicleData || [])
  }

  function getVehicle(vehicleId) {
    return vehicles.find((v) => v.id === vehicleId)
  }

  function getMainImage(item) {
    return item?.image_urls?.[0] || item?.image_url || ''
  }

  function getImageCount(item) {
    if (item?.image_urls?.length) return item.image_urls.length
    if (item?.image_url) return 1
    return 0
  }

  function chooseMain(main) {
    const firstSub = Object.keys(CATALOGUE[main])[0]
    const firstType = CATALOGUE[main][firstSub][0]

    setActiveMain(main)
    setActiveSub(firstSub)
    setActiveType(firstType)
  }

  function chooseSub(sub) {
    const firstType = CATALOGUE[activeMain][sub][0]

    setActiveSub(sub)
    setActiveType(firstType)
  }

  const filteredParts = useMemo(() => {
    return parts
      .filter((part) => (part.status || '').toLowerCase() !== 'sold')
      .filter((part) => {
        const vehicle = getVehicle(part.vehicle_id)

        const text = `
          ${part.part_name}
          ${part.part_type}
          ${part.main_category}
          ${part.sub_category}
          ${part.stock_number}
          ${part.price}
          ${part.condition}
          ${part.status}
          ${vehicle?.year}
          ${vehicle?.make}
          ${vehicle?.model}
          ${vehicle?.chassis_code}
          ${vehicle?.engine_code}
          ${vehicle?.paint_code}
        `.toLowerCase()

        const matchesSearch = text.includes(search.toLowerCase())

        const matchesCategory =
          !activeType ||
          part.part_type?.toLowerCase() === activeType.toLowerCase() ||
          part.part_name?.toLowerCase() === activeType.toLowerCase()

        return matchesSearch && matchesCategory
      })
  }, [parts, vehicles, search, activeType])

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="mb-8 rounded-3xl border border-white/10 bg-[#1a1d26] p-8">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
          Baba Ji Parts Catalogue
        </p>

        <h1 className="mt-3 text-4xl font-black">
          Search Used Auto Parts by Category
        </h1>

        <p className="mt-3 max-w-3xl text-gray-400">
          Find body parts, lights, mechanical parts, electrical parts, wheels,
          suspension and steering parts from real vehicles currently being dismantled.
        </p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Camry bumper, AXVH70 headlight, 1F7 door..."
          className="mt-6 w-full rounded-xl border border-white/10 bg-[#0f1219] px-4 py-4 text-white"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-[#1a1d26] p-5">
          <h2 className="mb-4 text-xl font-black">Categories</h2>

          <div className="space-y-3">
            {Object.keys(CATALOGUE).map((main) => (
              <button
                key={main}
                onClick={() => chooseMain(main)}
                className={`w-full rounded-xl px-4 py-3 text-left font-bold ${
                  activeMain === main
                    ? 'bg-yellow-400 text-black'
                    : 'bg-[#0f1219] text-white'
                }`}
              >
                {main}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
              Sub Categories
            </h3>

            <div className="space-y-2">
              {Object.keys(CATALOGUE[activeMain]).map((sub) => (
                <button
                  key={sub}
                  onClick={() => chooseSub(sub)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-bold ${
                    activeSub === sub
                      ? 'bg-white text-black'
                      : 'bg-[#0f1219] text-gray-300'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
              Part Types
            </h3>

            <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
              {CATALOGUE[activeMain][activeSub].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    activeType === type
                      ? 'bg-green-500 font-bold text-white'
                      : 'bg-[#0f1219] text-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-sm text-yellow-400">{activeMain} / {activeSub}</p>
              <h2 className="text-3xl font-black">{activeType}</h2>
            </div>

            <p className="text-sm text-gray-400">
              {filteredParts.length} matching parts
            </p>
          </div>

          {filteredParts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredParts.map((part) => {
                const vehicle = getVehicle(part.vehicle_id)
                const partImage = getMainImage(part)
                const imageCount = getImageCount(part)

                return (
                  <article
                    key={part.id}
                    className="rounded-2xl border border-white/10 bg-[#1a1d26] p-5"
                  >
                    <div className="relative mb-4 flex h-44 items-center justify-center rounded-xl bg-black/30">
                      {partImage ? (
                        <>
                          <img
                            src={partImage}
                            alt={part.part_name || part.part_type}
                            className="h-full w-full rounded-xl object-cover"
                          />

                          {imageCount > 1 && (
                            <span className="absolute right-2 top-2 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">
                              {imageCount} photos
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-500">No Part Image Yet</span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-yellow-400">
                      {part.stock_number || 'NO PART NUMBER'}
                    </p>

                    <h3 className="mt-1 text-xl font-black">
                      {part.part_name || part.part_type}
                    </h3>

                    <p className="mt-2 text-sm text-gray-400">
                      From: {vehicle?.year} {vehicle?.make} {vehicle?.model}{' '}
                      {vehicle?.chassis_code}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <Info label="Condition" value={part.condition} />
                      <Info label="Price" value={part.price ? `$${part.price}` : 'Call'} />
                      <Info label="Paint" value={vehicle?.paint_code} />
                      <Info label="Status" value={part.status || 'Available'} />
                    </div>

                    <div className="mt-5 flex gap-3">
                      <a
                        href="tel:0400000000"
                        className="flex-1 rounded-xl bg-yellow-400 px-4 py-3 text-center font-bold text-black"
                      >
                        Call
                      </a>

                      <a
                        href={`https://wa.me/61400000000?text=Hi Baba Ji Parts, I need ${part.part_name || part.part_type}. Part number: ${part.stock_number || ''}`}
                        className="flex-1 rounded-xl bg-green-500 px-4 py-3 text-center font-bold text-white"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#1a1d26] p-10 text-center">
              <h3 className="text-2xl font-black">Need this part?</h3>
              <p className="mt-2 text-gray-400">
                We may have it in the yard but not uploaded yet. Send us a message.
              </p>

              <a
                href={`https://wa.me/61400000000?text=Hi Baba Ji Parts, I am looking for ${activeType}`}
                className="mt-5 inline-block rounded-xl bg-green-500 px-6 py-3 font-bold text-white"
              >
                Request This Part
              </a>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-black/30 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-bold">{value || 'N/A'}</p>
    </div>
  )
}