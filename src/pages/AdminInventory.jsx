import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const MAX_IMAGES = 10

export default function AdminInventory() {
  const [vehicles, setVehicles] = useState([])
  const [parts, setParts] = useState([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [editingVehicleId, setEditingVehicleId] = useState(null)
  const [editingPartId, setEditingPartId] = useState(null)
  const [vehicleEdit, setVehicleEdit] = useState({})
  const [partEdit, setPartEdit] = useState({})
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: vehicleData, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: partData, error: partError } = await supabase
      .from('parts')
      .select('*')
      .order('created_at', { ascending: false })

    if (vehicleError) setMessage(vehicleError.message)
    if (partError) setMessage(partError.message)

    setVehicles(vehicleData || [])
    setParts(partData || [])
  }

  function getVehicle(vehicleId) {
    return vehicles.find((v) => v.id === vehicleId)
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
    const urls = []

    for (const file of fileList) {
      const url = await uploadImage(file, folder)
      urls.push(url)
    }

    return urls
  }

  async function handleVehicleImagesUpload(e) {
    try {
      const currentImages = vehicleEdit.image_urls || []
      const remainingSlots = MAX_IMAGES - currentImages.length
      const selectedFiles = Array.from(e.target.files || []).slice(0, remainingSlots)

      if (selectedFiles.length === 0) {
        setMessage(`Maximum ${MAX_IMAGES} vehicle images allowed.`)
        return
      }

      setUploading(true)
      setMessage('Uploading vehicle images...')

      const newUrls = await uploadMultipleImages(selectedFiles, 'vehicles')
      const updatedImages = [...currentImages, ...newUrls].slice(0, MAX_IMAGES)

      setVehicleEdit({
        ...vehicleEdit,
        image_urls: updatedImages,
        image_url: updatedImages[0] || '',
      })

      setMessage('Vehicle images uploaded. Click Save to apply.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handlePartImagesUpload(e) {
    try {
      const currentImages = partEdit.image_urls || []
      const remainingSlots = MAX_IMAGES - currentImages.length
      const selectedFiles = Array.from(e.target.files || []).slice(0, remainingSlots)

      if (selectedFiles.length === 0) {
        setMessage(`Maximum ${MAX_IMAGES} part images allowed.`)
        return
      }

      setUploading(true)
      setMessage('Uploading part images...')

      const newUrls = await uploadMultipleImages(selectedFiles, 'parts')
      const updatedImages = [...currentImages, ...newUrls].slice(0, MAX_IMAGES)

      setPartEdit({
        ...partEdit,
        image_urls: updatedImages,
        image_url: updatedImages[0] || '',
      })

      setMessage('Part images uploaded. Click Save to apply.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function removeVehicleImage(index) {
    const updatedImages = (vehicleEdit.image_urls || []).filter((_, i) => i !== index)

    setVehicleEdit({
      ...vehicleEdit,
      image_urls: updatedImages,
      image_url: updatedImages[0] || '',
    })
  }

  function removePartImage(index) {
    const updatedImages = (partEdit.image_urls || []).filter((_, i) => i !== index)

    setPartEdit({
      ...partEdit,
      image_urls: updatedImages,
      image_url: updatedImages[0] || '',
    })
  }

  function startVehicleEdit(vehicle) {
    const existingImages =
      vehicle.image_urls && vehicle.image_urls.length > 0
        ? vehicle.image_urls
        : vehicle.image_url
          ? [vehicle.image_url]
          : []

    setEditingVehicleId(vehicle.id)
    setVehicleEdit({
      stock_number: vehicle.stock_number || '',
      status: vehicle.status || '',
      paint_code: vehicle.paint_code || '',
      image_url: existingImages[0] || '',
      image_urls: existingImages,
    })
  }

  function startPartEdit(part) {
    const existingImages =
      part.image_urls && part.image_urls.length > 0
        ? part.image_urls
        : part.image_url
          ? [part.image_url]
          : []

    setEditingPartId(part.id)
    setPartEdit({
      price: part.price || '',
      status: part.status || '',
      location: part.location || '',
      condition: part.condition || '',
      notes: part.notes || '',
      image_url: existingImages[0] || '',
      image_urls: existingImages,
    })
  }

  async function saveVehicle(vehicleId) {
    setMessage('')

    const cleanedImages = vehicleEdit.image_urls || []

    const payload = {
      ...vehicleEdit,
      image_urls: cleanedImages,
      image_url: cleanedImages[0] || '',
    }

    const { error } = await supabase
      .from('vehicles')
      .update(payload)
      .eq('id', vehicleId)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Vehicle updated successfully.')
    setEditingVehicleId(null)
    fetchData()
  }

  async function savePart(partId) {
    setMessage('')

    const cleanedImages = partEdit.image_urls || []

    const payload = {
      ...partEdit,
      image_urls: cleanedImages,
      image_url: cleanedImages[0] || '',
    }

    const { error } = await supabase
      .from('parts')
      .update(payload)
      .eq('id', partId)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Part updated successfully.')
    setEditingPartId(null)
    fetchData()
  }

  async function markPartSold(partId) {
    const { error } = await supabase
      .from('parts')
      .update({ status: 'Sold' })
      .eq('id', partId)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Part marked as sold.')
    fetchData()
  }

  async function markPartAvailable(partId) {
    const { error } = await supabase
      .from('parts')
      .update({ status: 'Available' })
      .eq('id', partId)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Part marked as available.')
    fetchData()
  }

  async function deletePart(partId) {
    const confirmed = confirm('Delete this part permanently?')
    if (!confirmed) return

    const { error } = await supabase.from('parts').delete().eq('id', partId)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Part deleted.')
    fetchData()
  }

  async function deleteVehicle(vehicleId) {
    const confirmed = confirm('Delete this vehicle permanently?')
    if (!confirmed) return

    const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Vehicle deleted.')
    fetchData()
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
      ${vehicle.status}
    `.toLowerCase()

    return text.includes(search.toLowerCase())
  })

  const filteredParts = parts.filter((part) => {
    const vehicle = getVehicle(part.vehicle_id)

    const text = `
      ${part.stock_number}
      ${part.part_name}
      ${part.part_type}
      ${part.main_category}
      ${part.sub_category}
      ${part.status}
      ${part.location}
      ${part.price}
      ${part.condition}
      ${vehicle?.stock_number}
      ${vehicle?.year}
      ${vehicle?.make}
      ${vehicle?.model}
      ${vehicle?.chassis_code}
      ${vehicle?.paint_code}
    `.toLowerCase()

    return text.includes(search.toLowerCase())
  })

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-yellow-400">
          Internal Inventory
        </p>
        <h1 className="mt-2 text-4xl font-black">Admin Inventory Control</h1>
        <p className="mt-2 text-gray-400">
          Edit stock, add images later, remove images, update prices, locations and statuses.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-yellow-300">
          {message}
        </div>
      )}

      {uploading && (
        <div className="mb-6 rounded-xl border border-blue-400/30 bg-blue-400/10 p-4 text-blue-300">
          Uploading images...
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search part number, vehicle, rack location, AXVH70..."
        className="mb-6 w-full rounded-xl border border-white/10 bg-[#1a1d26] px-4 py-4 text-white"
      />

      <section className="mb-10 rounded-2xl bg-[#1a1d26] p-6">
        <h2 className="mb-4 text-2xl font-bold">Vehicles</h2>

        <div className="overflow-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-black/30 text-gray-400">
              <tr>
                <th className="p-3">Images</th>
                <th className="p-3">Stock #</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Chassis</th>
                <th className="p-3">Engine</th>
                <th className="p-3">Paint</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredVehicles.map((v) => {
                const vehicleImages =
                  v.image_urls && v.image_urls.length > 0
                    ? v.image_urls
                    : v.image_url
                      ? [v.image_url]
                      : []

                return (
                  <tr key={v.id} className="border-t border-white/10 align-top">
                    <td className="p-3">
                      {editingVehicleId === v.id ? (
                        <div className="w-64">
                          <p className="mb-2 text-xs text-gray-400">
                            Images: {(vehicleEdit.image_urls || []).length}/{MAX_IMAGES}
                          </p>

                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleVehicleImagesUpload}
                            className="mb-3 w-full text-xs text-gray-300"
                          />

                          <div className="grid grid-cols-2 gap-2">
                            {(vehicleEdit.image_urls || []).map((url, index) => (
                              <div key={url} className="relative">
                                <img
                                  src={url}
                                  alt={`Vehicle ${index + 1}`}
                                  className="h-20 w-full rounded object-cover"
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
                      ) : vehicleImages.length > 0 ? (
                        <div>
                          <img
                            src={vehicleImages[0]}
                            alt="Vehicle"
                            className="h-20 w-32 rounded object-cover"
                          />
                          <p className="mt-1 text-xs text-gray-400">
                            {vehicleImages.length} image(s)
                          </p>
                        </div>
                      ) : (
                        <div className="flex h-20 w-32 items-center justify-center rounded bg-black/30 text-xs text-gray-500">
                          No image
                        </div>
                      )}
                    </td>

                    <td className="p-3 font-bold text-yellow-400">
                      {editingVehicleId === v.id ? (
                        <input
                          value={vehicleEdit.stock_number}
                          onChange={(e) =>
                            setVehicleEdit({
                              ...vehicleEdit,
                              stock_number: e.target.value,
                            })
                          }
                          className="w-28 rounded bg-[#0f1219] p-2 text-white"
                        />
                      ) : (
                        v.stock_number || 'N/A'
                      )}
                    </td>

                    <td className="p-3">
                      {v.year} {v.make} {v.model}
                    </td>

                    <td className="p-3">{v.chassis_code || 'N/A'}</td>
                    <td className="p-3">{v.engine_code || 'N/A'}</td>

                    <td className="p-3">
                      {editingVehicleId === v.id ? (
                        <input
                          value={vehicleEdit.paint_code}
                          onChange={(e) =>
                            setVehicleEdit({
                              ...vehicleEdit,
                              paint_code: e.target.value,
                            })
                          }
                          className="w-28 rounded bg-[#0f1219] p-2 text-white"
                        />
                      ) : (
                        v.paint_code || 'N/A'
                      )}
                    </td>

                    <td className="p-3">
                      {editingVehicleId === v.id ? (
                        <select
                          value={vehicleEdit.status}
                          onChange={(e) =>
                            setVehicleEdit({
                              ...vehicleEdit,
                              status: e.target.value,
                            })
                          }
                          className="rounded bg-[#0f1219] p-2 text-white"
                        >
                          <option>Wrecking</option>
                          <option>Parts Available</option>
                          <option>Shell Gone</option>
                          <option>Sold</option>
                        </select>
                      ) : (
                        v.status || 'N/A'
                      )}
                    </td>

                    <td className="p-3">
                      {editingVehicleId === v.id ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => saveVehicle(v.id)}
                            className="rounded bg-green-500 px-3 py-2 font-bold text-white"
                          >
                            Save
                          </button>

                          <button
                            onClick={() => setEditingVehicleId(null)}
                            className="rounded bg-gray-600 px-3 py-2 font-bold text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => startVehicleEdit(v)}
                            className="rounded bg-blue-500 px-3 py-2 font-bold text-white"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteVehicle(v.id)}
                            className="rounded bg-red-500 px-3 py-2 font-bold text-white"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-[#1a1d26] p-6">
        <h2 className="mb-4 text-2xl font-bold">All Parts</h2>

        <div className="overflow-auto">
          <table className="w-full min-w-[1500px] text-left text-sm">
            <thead className="bg-black/30 text-gray-400">
              <tr>
                <th className="p-3">Images</th>
                <th className="p-3">Part #</th>
                <th className="p-3">Part</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Condition</th>
                <th className="p-3">Status</th>
                <th className="p-3">Location</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredParts.map((part) => {
                const vehicle = getVehicle(part.vehicle_id)

                const partImages =
                  part.image_urls && part.image_urls.length > 0
                    ? part.image_urls
                    : part.image_url
                      ? [part.image_url]
                      : []

                return (
                  <tr key={part.id} className="border-t border-white/10 align-top">
                    <td className="p-3">
                      {editingPartId === part.id ? (
                        <div className="w-64">
                          <p className="mb-2 text-xs text-gray-400">
                            Images: {(partEdit.image_urls || []).length}/{MAX_IMAGES}
                          </p>

                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePartImagesUpload}
                            className="mb-3 w-full text-xs text-gray-300"
                          />

                          <div className="grid grid-cols-2 gap-2">
                            {(partEdit.image_urls || []).map((url, index) => (
                              <div key={url} className="relative">
                                <img
                                  src={url}
                                  alt={`Part ${index + 1}`}
                                  className="h-20 w-full rounded object-cover"
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
                      ) : partImages.length > 0 ? (
                        <div>
                          <img
                            src={partImages[0]}
                            alt="Part"
                            className="h-20 w-32 rounded object-cover"
                          />
                          <p className="mt-1 text-xs text-gray-400">
                            {partImages.length} image(s)
                          </p>
                        </div>
                      ) : (
                        <div className="flex h-20 w-32 items-center justify-center rounded bg-black/30 text-xs text-gray-500">
                          No image
                        </div>
                      )}
                    </td>

                    <td className="p-3 font-bold text-yellow-400">
                      {part.stock_number || 'N/A'}
                    </td>

                    <td className="p-3 font-bold">
                      {part.part_name || part.part_type}
                    </td>

                    <td className="p-3">
                      {vehicle
                        ? `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.chassis_code || ''}`
                        : 'No vehicle'}
                    </td>

                    <td className="p-3">
                      {part.main_category || 'N/A'} / {part.sub_category || 'N/A'}
                    </td>

                    <td className="p-3">
                      {editingPartId === part.id ? (
                        <input
                          value={partEdit.price}
                          onChange={(e) =>
                            setPartEdit({ ...partEdit, price: e.target.value })
                          }
                          className="w-24 rounded bg-[#0f1219] p-2 text-white"
                        />
                      ) : part.price ? (
                        `$${part.price}`
                      ) : (
                        'Call'
                      )}
                    </td>

                    <td className="p-3">
                      {editingPartId === part.id ? (
                        <input
                          value={partEdit.condition}
                          onChange={(e) =>
                            setPartEdit({
                              ...partEdit,
                              condition: e.target.value,
                            })
                          }
                          className="w-32 rounded bg-[#0f1219] p-2 text-white"
                        />
                      ) : (
                        part.condition || 'N/A'
                      )}
                    </td>

                    <td className="p-3">
                      {editingPartId === part.id ? (
                        <select
                          value={partEdit.status}
                          onChange={(e) =>
                            setPartEdit({ ...partEdit, status: e.target.value })
                          }
                          className="rounded bg-[#0f1219] p-2 text-white"
                        >
                          <option>Available</option>
                          <option>Sold</option>
                          <option>Damaged</option>
                          <option>Hold</option>
                        </select>
                      ) : (
                        part.status || 'N/A'
                      )}
                    </td>

                    <td className="p-3 font-bold text-green-300">
                      {editingPartId === part.id ? (
                        <input
                          value={partEdit.location}
                          onChange={(e) =>
                            setPartEdit({
                              ...partEdit,
                              location: e.target.value,
                            })
                          }
                          className="w-32 rounded bg-[#0f1219] p-2 text-white"
                        />
                      ) : (
                        part.location || 'No location'
                      )}
                    </td>

                    <td className="p-3">
                      {editingPartId === part.id ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => savePart(part.id)}
                            className="rounded bg-green-500 px-3 py-2 font-bold text-white"
                          >
                            Save
                          </button>

                          <button
                            onClick={() => setEditingPartId(null)}
                            className="rounded bg-gray-600 px-3 py-2 font-bold text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => startPartEdit(part)}
                            className="rounded bg-blue-500 px-3 py-2 font-bold text-white"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => markPartSold(part.id)}
                            className="rounded bg-yellow-500 px-3 py-2 font-bold text-black"
                          >
                            Sold
                          </button>

                          <button
                            onClick={() => markPartAvailable(part.id)}
                            className="rounded bg-green-600 px-3 py-2 font-bold text-white"
                          >
                            Available
                          </button>

                          <button
                            onClick={() => deletePart(part.id)}
                            className="rounded bg-red-500 px-3 py-2 font-bold text-white"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}