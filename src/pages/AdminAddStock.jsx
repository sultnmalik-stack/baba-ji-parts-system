import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const MAX_IMAGES = 10

const CATEGORY_MAP = {
  'Body Parts': {
    'Front End Parts': [
      'Bonnet',
      'Guard',
      'Front bumper',
      'Grille',
      'Front Bar Reinforcement',
      'Radiator Support',
      'Headlight Left',
      'Headlight Right',
    ],
    'Rear End Parts': [
      'Bootlid / Tailgate',
      'Rear Bumper',
      'Rear Bar Reinforcement',
      'Tail light Left',
      'Tail light Right',
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
    Suspension: [
      'Lower Control Arm',
      'Wheel Hub',
      'Struts / Shockers',
      'Sway Bar Links / Stabilisers',
    ],
    Steering: ['Power Steering Pump', 'Power Steering Rack', 'Steering Column'],
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

const emptyVehicle = {
  stock_number: '',
  make: '',
  model: '',
  year: '',
  chassis_code: '',
  engine_code: '',
  paint_code: '',
  vin: '',
  status: 'Wrecking',
  image_url: '',
  image_urls: [],
}

const emptyPart = {
  vehicle_id: '',
  stock_number: '',
  main_category: 'Body Parts',
  sub_category: 'Front End Parts',
  part_type: 'Front bumper',
  part_name: 'Front bumper',
  category: 'Body Parts',
  condition: 'Used',
  price: '',
  status: 'Available',
  location: '',
  notes: '',
  image_url: '',
  image_urls: [],
  marketplace_title: '',
  marketplace_description: '',
}

export default function AdminAddStock() {
  const [vehicles, setVehicles] = useState([])
  const [vehicle, setVehicle] = useState(emptyVehicle)
  const [part, setPart] = useState(emptyPart)
  const [message, setMessage] = useState('')
  const [uploadingVehicle, setUploadingVehicle] = useState(false)
  const [uploadingPart, setUploadingPart] = useState(false)
  const [lastVehicle, setLastVehicle] = useState(null)
  const [lastPart, setLastPart] = useState(null)

  useEffect(() => {
    fetchVehicles()
  }, [])

  async function fetchVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setMessage(error.message)
      return
    }

    setVehicles(data || [])
  }

  async function uploadImage(file, folder) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`

    const { error } = await supabase.storage
      .from('inventory-images')
      .upload(fileName, file)

    if (error) throw error

    const { data } = supabase.storage
      .from('inventory-images')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  async function uploadMultipleImages(files, folder) {
    const fileList = Array.from(files || [])

    if (fileList.length === 0) return []

    const urls = []

    for (const file of fileList) {
      const url = await uploadImage(file, folder)
      urls.push(url)
    }

    return urls
  }

  async function handleVehicleImagesUpload(e) {
    try {
      const currentImages = vehicle.image_urls || []
      const remainingSlots = MAX_IMAGES - currentImages.length
      const selectedFiles = Array.from(e.target.files || []).slice(0, remainingSlots)

      if (selectedFiles.length === 0) {
        setMessage(`Maximum ${MAX_IMAGES} vehicle images allowed.`)
        return
      }

      setUploadingVehicle(true)
      setMessage('Uploading vehicle images...')

      const newUrls = await uploadMultipleImages(selectedFiles, 'vehicles')
      const updatedImages = [...currentImages, ...newUrls].slice(0, MAX_IMAGES)

      setVehicle({
        ...vehicle,
        image_urls: updatedImages,
        image_url: updatedImages[0] || '',
      })

      setMessage('Vehicle images uploaded.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setUploadingVehicle(false)
      e.target.value = ''
    }
  }

  async function handlePartImagesUpload(e) {
    try {
      const currentImages = part.image_urls || []
      const remainingSlots = MAX_IMAGES - currentImages.length
      const selectedFiles = Array.from(e.target.files || []).slice(0, remainingSlots)

      if (selectedFiles.length === 0) {
        setMessage(`Maximum ${MAX_IMAGES} part images allowed.`)
        return
      }

      setUploadingPart(true)
      setMessage('Uploading part images...')

      const newUrls = await uploadMultipleImages(selectedFiles, 'parts')
      const updatedImages = [...currentImages, ...newUrls].slice(0, MAX_IMAGES)

      setPart({
        ...part,
        image_urls: updatedImages,
        image_url: updatedImages[0] || '',
      })

      setMessage('Part images uploaded.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setUploadingPart(false)
      e.target.value = ''
    }
  }

  function removeVehicleImage(index) {
    const updatedImages = (vehicle.image_urls || []).filter((_, i) => i !== index)

    setVehicle({
      ...vehicle,
      image_urls: updatedImages,
      image_url: updatedImages[0] || '',
    })
  }

  function removePartImage(index) {
    const updatedImages = (part.image_urls || []).filter((_, i) => i !== index)

    setPart({
      ...part,
      image_urls: updatedImages,
      image_url: updatedImages[0] || '',
    })
  }

  function generateVehicleStockNumber() {
    const nextNumber = String(vehicles.length + 1).padStart(4, '0')
    return `BJP-${nextNumber}`
  }

  function generatePartStockNumber(selectedVehicle, partType) {
    const vehicleStock = selectedVehicle?.stock_number || 'BJP-0000'

    const initials = partType
      .split(' ')
      .map((word) => word[0])
      .join('')
      .replace(/[^A-Z]/gi, '')
      .toUpperCase()
      .slice(0, 4)

    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0')

    return `${vehicleStock}-${initials}-${random}`
  }

  function buildMarketplaceTitle(selectedVehicle, partType) {
    if (!selectedVehicle) return ''
    return `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model} ${selectedVehicle.chassis_code || ''} ${partType}`.trim()
  }

  function buildMarketplaceDescription(selectedVehicle, partType, condition) {
    if (!selectedVehicle) return ''

    return `${partType} for ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}.

Chassis: ${selectedVehicle.chassis_code || 'N/A'}
Engine: ${selectedVehicle.engine_code || 'N/A'}
Paint Code: ${selectedVehicle.paint_code || 'N/A'}
Condition: ${condition || 'Used'}

Please call Baba Ji Parts to confirm fitment and availability before purchase.`
  }

  function printVehicleLabel(vehicleToPrint) {
    const w = window.open('', '_blank')

    w.document.write(`
      <html>
        <head>
          <title>Vehicle Label</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 10px; text-align: center; }
            .label { width: 320px; border: 2px solid #000; padding: 14px; }
            .stock { font-size: 28px; font-weight: 900; margin-bottom: 8px; }
            .title { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
            .line { font-size: 15px; margin: 3px 0; }
            @media print { body { margin: 0; } .label { page-break-after: always; } }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="stock">${vehicleToPrint.stock_number || ''}</div>
            <div class="title">${vehicleToPrint.year || ''} ${vehicleToPrint.make || ''} ${vehicleToPrint.model || ''}</div>
            <div class="line">Chassis: ${vehicleToPrint.chassis_code || 'N/A'}</div>
            <div class="line">Engine: ${vehicleToPrint.engine_code || 'N/A'}</div>
            <div class="line">Paint: ${vehicleToPrint.paint_code || 'N/A'}</div>
          </div>
        </body>
      </html>
    `)

    w.document.close()
    w.focus()
    w.print()
  }

  function printPartLabel(partToPrint, vehicleToPrint) {
    const w = window.open('', '_blank')
    const priceText = partToPrint.price ? `$${partToPrint.price}` : 'Call'

    w.document.write(`
      <html>
        <head>
          <title>Part Label</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 10px; text-align: center; }
            .label { width: 320px; border: 2px solid #000; padding: 14px; }
            .stock { font-size: 22px; font-weight: 900; margin-bottom: 8px; }
            .part { font-size: 20px; font-weight: 800; margin-bottom: 6px; }
            .line { font-size: 15px; margin: 3px 0; }
            .price { font-size: 18px; font-weight: 900; margin-top: 6px; }
            @media print { body { margin: 0; } .label { page-break-after: always; } }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="stock">${partToPrint.stock_number || ''}</div>
            <div class="part">${partToPrint.part_name || partToPrint.part_type || ''}</div>
            <div class="line">${vehicleToPrint?.year || ''} ${vehicleToPrint?.make || ''} ${vehicleToPrint?.model || ''}</div>
            <div class="line">Chassis: ${vehicleToPrint?.chassis_code || 'N/A'}</div>
            <div class="line">Location: ${partToPrint.location || 'N/A'}</div>
            <div class="price">${priceText}</div>
          </div>
        </body>
      </html>
    `)

    w.document.close()
    w.focus()
    w.print()
  }

  async function addVehicle(e) {
    e.preventDefault()
    setMessage('')
    setLastVehicle(null)

    const vehicleImages = vehicle.image_urls || []

    const vehicleToInsert = {
      ...vehicle,
      stock_number: vehicle.stock_number || generateVehicleStockNumber(),
      image_urls: vehicleImages,
      image_url: vehicleImages[0] || vehicle.image_url || '',
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicleToInsert])
      .select()

    if (error) {
      setMessage(error.message)
      return
    }

    const createdVehicle = data?.[0]
    setLastVehicle(createdVehicle)
    setVehicle(emptyVehicle)
    setMessage('Vehicle added successfully. You can now print the vehicle label.')
    fetchVehicles()
  }

  async function addPart(e) {
    e.preventDefault()
    setMessage('')
    setLastPart(null)

    const selectedVehicle = vehicles.find((v) => v.id === part.vehicle_id)
    const finalPartType = part.part_type
    const finalPartName = part.part_name || finalPartType
    const partImages = part.image_urls || []

    const partToInsert = {
      ...part,
      part_name: finalPartName,
      category: part.main_category,
      image_urls: partImages,
      image_url: partImages[0] || part.image_url || '',
      stock_number:
        part.stock_number || generatePartStockNumber(selectedVehicle, finalPartType),
      marketplace_title:
        part.marketplace_title || buildMarketplaceTitle(selectedVehicle, finalPartType),
      marketplace_description:
        part.marketplace_description ||
        buildMarketplaceDescription(selectedVehicle, finalPartType, part.condition),
    }

    const { data, error } = await supabase
      .from('parts')
      .insert([partToInsert])
      .select()

    if (error) {
      setMessage(error.message)
      return
    }

    const createdPart = data?.[0]
    setLastPart(createdPart)
    setPart(emptyPart)
    setMessage('Part added successfully. You can now print the part label.')
  }

  const mainCategories = Object.keys(CATEGORY_MAP)
  const subCategories = Object.keys(CATEGORY_MAP[part.main_category] || {})
  const partTypes = CATEGORY_MAP[part.main_category]?.[part.sub_category] || []

  function handleMainCategoryChange(value) {
    const firstSub = Object.keys(CATEGORY_MAP[value])[0]
    const firstPart = CATEGORY_MAP[value][firstSub][0]

    setPart({
      ...part,
      main_category: value,
      category: value,
      sub_category: firstSub,
      part_type: firstPart,
      part_name: firstPart,
    })
  }

  function handleSubCategoryChange(value) {
    const firstPart = CATEGORY_MAP[part.main_category][value][0]

    setPart({
      ...part,
      sub_category: value,
      part_type: firstPart,
      part_name: firstPart,
    })
  }

  function handlePartTypeChange(value) {
    const selectedVehicle = vehicles.find((v) => v.id === part.vehicle_id)

    setPart({
      ...part,
      part_type: value,
      part_name: value,
      marketplace_title: buildMarketplaceTitle(selectedVehicle, value),
      marketplace_description: buildMarketplaceDescription(
        selectedVehicle,
        value,
        part.condition
      ),
    })
  }

  function handleVehicleForPartChange(vehicleId) {
    const selectedVehicle = vehicles.find((v) => v.id === vehicleId)

    setPart({
      ...part,
      vehicle_id: vehicleId,
      stock_number: generatePartStockNumber(selectedVehicle, part.part_type),
      marketplace_title: buildMarketplaceTitle(selectedVehicle, part.part_type),
      marketplace_description: buildMarketplaceDescription(
        selectedVehicle,
        part.part_type,
        part.condition
      ),
    })
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-yellow-400">
          Baba Ji Parts System
        </p>
        <h1 className="mt-2 text-4xl font-black">Add Stock</h1>
        <p className="mt-2 text-gray-400">
          Add vehicles, upload up to 10 images, categorise parts and prepare marketplace listings.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-yellow-300">
          {message}
        </div>
      )}

      {lastVehicle && (
        <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
          <p className="mb-3 font-bold text-green-300">
            Last vehicle: {lastVehicle.stock_number} — {lastVehicle.year} {lastVehicle.make} {lastVehicle.model}
          </p>

          <button
            type="button"
            onClick={() => printVehicleLabel(lastVehicle)}
            className="rounded-lg bg-green-500 px-4 py-2 font-bold text-white"
          >
            Print Vehicle Label
          </button>
        </div>
      )}

      {lastPart && (
        <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <p className="mb-3 font-bold text-blue-300">
            Last part: {lastPart.stock_number} — {lastPart.part_name}
          </p>

          <button
            type="button"
            onClick={() =>
              printPartLabel(
                lastPart,
                vehicles.find((v) => v.id === lastPart.vehicle_id)
              )
            }
            className="rounded-lg bg-blue-500 px-4 py-2 font-bold text-white"
          >
            Print Part Label
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={addVehicle} className="rounded-2xl bg-[#1a1d26] p-6">
          <h2 className="mb-5 text-2xl font-bold">Add Vehicle</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input className="rounded-xl bg-[#0f1219] p-3" placeholder="Stock Number e.g BJP-0001" value={vehicle.stock_number} onChange={(e) => setVehicle({ ...vehicle, stock_number: e.target.value })} />

            <button type="button" className="rounded-xl bg-white/10 p-3 font-bold" onClick={() => setVehicle({ ...vehicle, stock_number: generateVehicleStockNumber() })}>
              Generate Stock #
            </button>

            <input className="rounded-xl bg-[#0f1219] p-3" placeholder="Make e.g Toyota" value={vehicle.make} onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })} required />
            <input className="rounded-xl bg-[#0f1219] p-3" placeholder="Model e.g Camry Hybrid" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} required />
            <input className="rounded-xl bg-[#0f1219] p-3" placeholder="Year e.g 2022" value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} required />
            <input className="rounded-xl bg-[#0f1219] p-3" placeholder="Chassis e.g AXVH70" value={vehicle.chassis_code} onChange={(e) => setVehicle({ ...vehicle, chassis_code: e.target.value })} />
            <input className="rounded-xl bg-[#0f1219] p-3" placeholder="Engine e.g A25A-FXS" value={vehicle.engine_code} onChange={(e) => setVehicle({ ...vehicle, engine_code: e.target.value })} />
            <input className="rounded-xl bg-[#0f1219] p-3" placeholder="Paint Code e.g 1F7 Silver" value={vehicle.paint_code} onChange={(e) => setVehicle({ ...vehicle, paint_code: e.target.value })} />
            <input className="rounded-xl bg-[#0f1219] p-3 md:col-span-2" placeholder="VIN" value={vehicle.vin} onChange={(e) => setVehicle({ ...vehicle, vin: e.target.value })} />

            <div className="rounded-xl border border-white/10 bg-[#0f1219] p-4 md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Upload Vehicle Images ({vehicle.image_urls.length}/{MAX_IMAGES})
              </label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleVehicleImagesUpload}
                className="w-full text-sm text-gray-300"
              />

              {uploadingVehicle && (
                <p className="mt-2 text-sm text-yellow-400">Uploading...</p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                {vehicle.image_urls.map((url, index) => (
                  <div key={url} className="relative">
                    <img
                      src={url}
                      alt={`Vehicle ${index + 1}`}
                      className="h-24 w-full rounded-xl object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeVehicleImage(index)}
                      className="absolute right-1 top-1 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <select className="rounded-xl bg-[#0f1219] p-3 md:col-span-2" value={vehicle.status} onChange={(e) => setVehicle({ ...vehicle, status: e.target.value })}>
              <option>Wrecking</option>
              <option>Parts Available</option>
              <option>Shell Gone</option>
              <option>Sold</option>
            </select>
          </div>

          <button className="mt-5 w-full rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black">
            Add Vehicle
          </button>
        </form>

        <form onSubmit={addPart} className="rounded-2xl bg-[#1a1d26] p-6">
          <h2 className="mb-5 text-2xl font-bold">Add Part</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <select className="rounded-xl bg-[#0f1219] p-3 md:col-span-2" value={part.vehicle_id} onChange={(e) => handleVehicleForPartChange(e.target.value)} required>
              <option value="">Select Vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.stock_number || 'NO-STOCK'} — {v.year} {v.make} {v.model} {v.chassis_code}
                </option>
              ))}
            </select>

            <input className="rounded-xl bg-[#0f1219] p-3" placeholder="Part Stock Number" value={part.stock_number} onChange={(e) => setPart({ ...part, stock_number: e.target.value })} />

            <button type="button" className="rounded-xl bg-white/10 p-3 font-bold" onClick={() => {
              const selectedVehicle = vehicles.find((v) => v.id === part.vehicle_id)
              setPart({ ...part, stock_number: generatePartStockNumber(selectedVehicle, part.part_type) })
            }}>
              Generate Part #
            </button>

            <select className="rounded-xl bg-[#0f1219] p-3" value={part.main_category} onChange={(e) => handleMainCategoryChange(e.target.value)}>
              {mainCategories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>

            <select className="rounded-xl bg-[#0f1219] p-3" value={part.sub_category} onChange={(e) => handleSubCategoryChange(e.target.value)}>
              {subCategories.map((sub) => (
                <option key={sub}>{sub}</option>
              ))}
            </select>

            <select className="rounded-xl bg-[#0f1219] p-3" value={part.part_type} onChange={(e) => handlePartTypeChange(e.target.value)}>
              {partTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>

            <input className="rounded-xl bg-[#0f1219] p-3" placeholder="Part Name Override" value={part.part_name} onChange={(e) => setPart({ ...part, part_name: e.target.value })} />
            <input className="rounded-xl bg-[#0f1219] p-3" placeholder="Condition e.g Good Used" value={part.condition} onChange={(e) => setPart({ ...part, condition: e.target.value })} />
            <input className="rounded-xl bg-[#0f1219] p-3" placeholder="Price e.g 450" value={part.price} onChange={(e) => setPart({ ...part, price: e.target.value })} />

            <select className="rounded-xl bg-[#0f1219] p-3" value={part.status} onChange={(e) => setPart({ ...part, status: e.target.value })}>
              <option>Available</option>
              <option>Sold</option>
              <option>Damaged</option>
              <option>Hold</option>
            </select>

            <input className="rounded-xl bg-[#0f1219] p-3" placeholder="Location e.g Rack A3" value={part.location} onChange={(e) => setPart({ ...part, location: e.target.value })} />

            <div className="rounded-xl border border-white/10 bg-[#0f1219] p-4 md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Upload Part Images ({part.image_urls.length}/{MAX_IMAGES})
              </label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePartImagesUpload}
                className="w-full text-sm text-gray-300"
              />

              {uploadingPart && (
                <p className="mt-2 text-sm text-yellow-400">Uploading...</p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                {part.image_urls.map((url, index) => (
                  <div key={url} className="relative">
                    <img
                      src={url}
                      alt={`Part ${index + 1}`}
                      className="h-24 w-full rounded-xl object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removePartImage(index)}
                      className="absolute right-1 top-1 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <input className="rounded-xl bg-[#0f1219] p-3 md:col-span-2" placeholder="Marketplace Title" value={part.marketplace_title} onChange={(e) => setPart({ ...part, marketplace_title: e.target.value })} />

            <textarea className="min-h-32 rounded-xl bg-[#0f1219] p-3 md:col-span-2" placeholder="Marketplace Description" value={part.marketplace_description} onChange={(e) => setPart({ ...part, marketplace_description: e.target.value })} />

            <textarea className="rounded-xl bg-[#0f1219] p-3 md:col-span-2" placeholder="Internal Notes" value={part.notes} onChange={(e) => setPart({ ...part, notes: e.target.value })} />
          </div>

          <button className="mt-5 w-full rounded-xl bg-green-500 px-5 py-3 font-bold text-white">
            Add Part
          </button>
        </form>
      </div>
    </main>
  )
}