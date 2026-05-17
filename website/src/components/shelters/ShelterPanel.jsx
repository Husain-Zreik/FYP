import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, Search, Check, X, MapPin } from 'lucide-react'
import Map, { Marker } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Input, Select, Toggle, SlidePanel, Button } from '../ui'
import client from '../../api/client'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const GOVERNORATES = [
  'Beirut', 'Mount Lebanon', 'North Lebanon',
  'South Lebanon', 'Bekaa', 'Nabatieh', 'Akkar', 'Baalbek-Hermel',
].map(g => ({ value: g, label: g }))

const STATUSES = [
  { value: 'active',             label: 'Active'              },
  { value: 'inactive',           label: 'Inactive'            },
  { value: 'full',               label: 'Full'                },
  { value: 'under_maintenance',  label: 'Under Maintenance'   },
]

const EMPTY_SHELTER = {
  name: '', code: '', governorate: '', district: '',
  address: '', latitude: '', longitude: '',
  capacity: '', rooms: '', status: 'active',
  phone: '', email: '', notes: '',
}

export default function ShelterPanel({ editingShelter, onSave, onClose }) {
  const isEditing = !!editingShelter

  const [form, setForm] = useState(editingShelter
    ? {
        name:         editingShelter.name         ?? '',
        code:         editingShelter.code         ?? '',
        governorate:  editingShelter.governorate   ?? '',
        district:     editingShelter.district      ?? '',
        address:      editingShelter.address       ?? '',
        latitude:     editingShelter.latitude      ?? '',
        longitude:    editingShelter.longitude     ?? '',
        capacity:     editingShelter.capacity      ?? '',
        rooms:        editingShelter.rooms         ?? '',
        status:       editingShelter.status        ?? 'active',
        phone:        editingShelter.phone         ?? '',
        email:        editingShelter.email         ?? '',
        notes:        editingShelter.notes         ?? '',
      }
    : EMPTY_SHELTER
  )

  const [addAdmin,       setAddAdmin]       = useState(false)
  const [adminQuery,     setAdminQuery]     = useState('')
  const [adminResults,   setAdminResults]   = useState([])
  const [adminSearching, setAdminSearching] = useState(false)
  const [selectedAdmin,  setSelectedAdmin]  = useState(null)
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState(null)
  const [fieldErrs,      setFieldErrs]      = useState({})

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setFieldErrs(prev => ({ ...prev, [field]: null }))
  }

  const searchAdmins = useCallback(async (q) => {
    if (!q.trim()) { setAdminResults([]); return }
    setAdminSearching(true)
    try {
      const res = await client.get(`/users?role=shelter_admin&unassigned=true&q=${encodeURIComponent(q)}`)
      setAdminResults(res.data ?? [])
    } catch { setAdminResults([]) }
    finally { setAdminSearching(false) }
  }, [])

  useEffect(() => {
    if (!addAdmin) return
    const t = setTimeout(() => searchAdmins(adminQuery), 350)
    return () => clearTimeout(t)
  }, [adminQuery, addAdmin, searchAdmins])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setFieldErrs({})
    try {
      const payload = { ...form }
      if (!payload.latitude)  delete payload.latitude
      if (!payload.longitude) delete payload.longitude
      if (!payload.rooms)     delete payload.rooms
      if (!payload.code)      delete payload.code

      const shelter = await onSave(payload)

      // Assign selected existing admin to the new shelter
      if (!isEditing && addAdmin && selectedAdmin) {
        await client.patch(`/users/${selectedAdmin.id}`, { shelter_id: shelter.id })
      }

      onClose()
    } catch (err) {
      if (err.errors) setFieldErrs(err.errors)
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const footer = (
    <div className="flex gap-3 justify-end">
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button loading={saving} disabled={!form.name || !form.governorate || !form.address || !form.capacity} onClick={handleSave}>
        {isEditing ? 'Save changes' : 'Create shelter'}
      </Button>
    </div>
  )

  return (
    <SlidePanel
      title={isEditing ? 'Edit shelter' : 'New shelter'}
      subtitle={isEditing ? `Editing ${editingShelter.name}` : 'Fill in the shelter details'}
      onClose={onClose}
      footer={footer}
      width="max-w-lg">

      <div className="space-y-5">
        {error && (
          <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {/* Identity */}
        <div className="grid grid-cols-3 gap-3">
          <Input label="Official name" required className="col-span-2"
            value={form.name} onChange={v => set('name', v)}
            placeholder="Shelter Al Arz" error={fieldErrs.name} />
          <Input label="Code"
            value={form.code} onChange={v => set('code', v)}
            placeholder="BEY-001" error={fieldErrs.code} />
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-3">
          <Select label="Governorate" required
            value={form.governorate} onChange={v => set('governorate', v)}
            placeholder="— Select —" options={GOVERNORATES}
            error={fieldErrs.governorate} />
          <Input label="District"
            value={form.district} onChange={v => set('district', v)}
            placeholder="Optional" />
        </div>
        <Input label="Full address" required
          value={form.address} onChange={v => set('address', v)}
          placeholder="Street, area, city" error={fieldErrs.address} />
        {/* Coordinate picker */}
        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">
            Location on map
            <span className="text-text-subtle font-normal ms-1 text-xs">— click to pin</span>
          </label>
          <div className="rounded-xl overflow-hidden border border-border mb-2" style={{ height: 200 }}>
            <Map
              initialViewState={{
                longitude: parseFloat(form.longitude) || 35.85,
                latitude:  parseFloat(form.latitude)  || 33.85,
                zoom: 8,
              }}
              mapStyle={MAP_STYLE}
              style={{ width: '100%', height: '100%' }}
              attributionControl={false}
              onClick={e => {
                set('latitude',  e.lngLat.lat.toFixed(6))
                set('longitude', e.lngLat.lng.toFixed(6))
              }}
            >
              {form.latitude && form.longitude && (
                <Marker
                  longitude={parseFloat(form.longitude)}
                  latitude={parseFloat(form.latitude)}
                  anchor="bottom">
                  <MapPin size={26} className="text-danger drop-shadow-sm" fill="currentColor" fillOpacity={0.8}/>
                </Marker>
              )}
            </Map>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitude" type="number"
              value={form.latitude} onChange={v => set('latitude', v)}
              placeholder="33.8938" hint="Decimal degrees" />
            <Input label="Longitude" type="number"
              value={form.longitude} onChange={v => set('longitude', v)}
              placeholder="35.5018" hint="Decimal degrees" />
          </div>
        </div>

        {/* Capacity */}
        <div className="grid grid-cols-2 gap-3">
          <Input label="People capacity" type="number" required
            value={form.capacity} onChange={v => set('capacity', v)}
            placeholder="200" error={fieldErrs.capacity} />
          <Input label="Rooms / units" type="number"
            value={form.rooms} onChange={v => set('rooms', v)}
            placeholder="50" />
        </div>

        {/* Status & contact */}
        <Select label="Status"
          value={form.status} onChange={v => set('status', v)}
          options={STATUSES} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone" type="tel"
            value={form.phone} onChange={v => set('phone', v)} placeholder="+961 1 000 000" />
          <Input label="Email" type="email"
            value={form.email} onChange={v => set('email', v)} placeholder="shelter@example.com" />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">Notes</label>
          <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
            placeholder="Internal notes about this shelter…"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all resize-none" />
        </div>

        {/* Optional admin assignment — create mode only */}
        {!isEditing && (
          <div className="border-t border-border pt-5">
            <Toggle
              label="Assign a shelter admin"
              description="Link an existing unassigned shelter admin to this shelter"
              value={addAdmin}
              onChange={v => { setAddAdmin(v); setSelectedAdmin(null); setAdminQuery(''); setAdminResults([]) }}
            />
            {addAdmin && (
              <div className="mt-4 space-y-3 bg-surface rounded-xl p-4">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Search shelter admins</p>

                {selectedAdmin ? (
                  <div className="flex items-center gap-3 bg-background border border-border rounded-xl p-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                      {selectedAdmin.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{selectedAdmin.name}</p>
                      <p className="text-xs text-text-muted truncate">{selectedAdmin.email}</p>
                    </div>
                    <Button variant="icon-ghost" onClick={() => setSelectedAdmin(null)} title="Remove">
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <Search size={13} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-text-subtle" />
                      <input
                        value={adminQuery}
                        onChange={e => setAdminQuery(e.target.value)}
                        placeholder="Search by name or email…"
                        className="w-full border border-border rounded-xl ps-9 pe-4 py-2 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all"
                      />
                    </div>

                    {adminSearching && <p className="text-xs text-text-muted mt-2">Searching…</p>}

                    {!adminSearching && adminResults.length > 0 && (
                      <div className="mt-2 space-y-1.5 max-h-44 overflow-y-auto">
                        {adminResults.map(u => (
                          <button key={u.id} type="button" onClick={() => setSelectedAdmin(u)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-background hover:border-border-2 transition-colors text-start">
                            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text truncate">{u.name}</p>
                              <p className="text-xs text-text-muted truncate">{u.email}</p>
                            </div>
                            <Check size={14} className="shrink-0 text-secondary ms-auto opacity-0 group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    )}

                    {!adminSearching && adminQuery && adminResults.length === 0 && (
                      <p className="text-xs text-text-muted mt-2">No unassigned shelter admins found.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </SlidePanel>
  )
}
