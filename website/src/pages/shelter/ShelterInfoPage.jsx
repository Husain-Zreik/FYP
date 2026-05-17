import { useEffect, useRef, useState } from 'react'
import { MapPin, Phone, Mail, Building2, UploadCloud, Users, UserCheck, Save, AlertCircle } from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import ShelterPanel  from '../../components/shelters/ShelterPanel'
import { Button, Badge, Loader } from '../../components/ui'
import { getShelter, updateShelter, uploadShelterImage } from '../../api/shelters'
import { useAuthStore } from '../../store/authStore'

const STATUS_BADGE = { active:'success', full:'warning', inactive:'muted', under_maintenance:'danger' }
const STATUS_LABEL = { active:'Active', full:'Full', inactive:'Inactive', under_maintenance:'Maintenance' }

export default function ShelterInfoPage() {
  const user = useAuthStore(s => s.user)

  const [shelter,   setShelter]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [showEdit,  setShowEdit]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    if (!user?.shelter_id) return
    getShelter(user.shelter_id)
      .then(res => setShelter(res.data))
      .catch(err => setError(err.message ?? 'Failed to load.'))
      .finally(() => setLoading(false))
  }, [user?.shelter_id])

  async function handleSave(formData) {
    const res = await updateShelter(shelter.id, formData)
    setShelter(res.data)
  }

  async function handleImageUpload(file) {
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadShelterImage(shelter.id, file)
      setShelter(p => ({ ...p, image_url: res.data.url }))
    } catch { /* ignore */ }
    finally { setUploading(false) }
  }

  if (loading) return (
    <ShelterLayout title="My Shelter">
      <div className="flex items-center justify-center" style={{ minHeight: 'clamp(320px,55vh,520px)' }}>
        <Loader size="lg" />
      </div>
    </ShelterLayout>
  )

  if (error || !shelter) return (
    <ShelterLayout title="My Shelter">
      <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
        <AlertCircle size={15} className="shrink-0 mt-0.5" />
        {error ?? 'Shelter not found.'}
      </div>
    </ShelterLayout>
  )

  const civilians = shelter.civilians_count ?? 0
  const capacity  = shelter.capacity        ?? 0
  const staff     = shelter.staff_count     ?? 0
  const pct       = capacity > 0 ? Math.min(100, Math.round((civilians / capacity) * 100)) : 0
  const barColor  = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-success'

  return (
    <ShelterLayout
      title={shelter.name}
      subtitle={[shelter.governorate, shelter.district].filter(Boolean).join(' · ')}
      badge={<Badge variant={STATUS_BADGE[shelter.status] ?? 'muted'}>{STATUS_LABEL[shelter.status] ?? shelter.status}</Badge>}
      actions={
        <Button onClick={() => setShowEdit(true)}>
          <Save size={14} /> Edit details
        </Button>
      }
    >

      {/* Cover image */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-surface-2 mb-5"
        style={{ height: 210 }}>
        {shelter.image_url
          ? <img src={shelter.image_url} alt={shelter.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Building2 size={40} className="text-border-2" />
              <p className="text-xs text-text-subtle">No cover photo</p>
            </div>
        }
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => handleImageUpload(e.target.files[0])} />
        <div className="absolute bottom-3 right-3">
          <Button size="sm" variant="secondary" loading={uploading}
            className="bg-background/90 backdrop-blur-sm"
            onClick={() => fileRef.current?.click()}>
            <UploadCloud size={13} /> {shelter.image_url ? 'Change photo' : 'Add photo'}
          </Button>
        </div>
      </div>

      {/* Occupancy */}
      <div className="bg-background rounded-2xl border border-border p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold font-heading text-text">Occupancy</h2>
          <span className="text-xs text-text-muted">{civilians} / {capacity} people</span>
        </div>
        <div className="w-full bg-surface-2 rounded-full h-2.5 overflow-hidden mb-4">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-surface rounded-xl p-3">
            <UserCheck size={16} className="text-success mx-auto mb-1" />
            <p className="text-lg font-bold font-heading text-text">{civilians}</p>
            <p className="text-[11px] text-text-muted">Civilians</p>
          </div>
          <div className="bg-surface rounded-xl p-3">
            <Users size={16} className="text-secondary mx-auto mb-1" />
            <p className="text-lg font-bold font-heading text-text">{staff}</p>
            <p className="text-[11px] text-text-muted">Staff</p>
          </div>
          <div className="bg-surface rounded-xl p-3">
            <Building2 size={16} className="text-text-muted mx-auto mb-1" />
            <p className="text-lg font-bold font-heading text-text">{shelter.rooms ?? '—'}</p>
            <p className="text-[11px] text-text-muted">Rooms</p>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid lg:grid-cols-2 gap-5">

        <div className="bg-background rounded-2xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold font-heading text-text">Location</h2>
          {shelter.address && (
            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-text-subtle uppercase tracking-wider">Address</p>
                <p className="text-sm text-text mt-0.5">{shelter.address}</p>
              </div>
            </div>
          )}
          {shelter.governorate && (
            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-text-subtle uppercase tracking-wider">Governorate</p>
                <p className="text-sm text-text mt-0.5">
                  {shelter.governorate}{shelter.district ? ` · ${shelter.district}` : ''}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <MapPin size={15} className="text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-text-subtle uppercase tracking-wider">Coordinates</p>
              {shelter.latitude && shelter.longitude
                ? <p className="text-sm font-mono text-text mt-0.5">
                    {parseFloat(shelter.latitude).toFixed(4)}, {parseFloat(shelter.longitude).toFixed(4)}
                  </p>
                : <button onClick={() => setShowEdit(true)}
                    className="text-sm text-secondary hover:underline mt-0.5 cursor-pointer">
                    Not set — click Edit to add
                  </button>
              }
            </div>
          </div>
        </div>

        <div className="bg-background rounded-2xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold font-heading text-text">Contact</h2>
          {shelter.phone && (
            <div className="flex items-start gap-3">
              <Phone size={15} className="text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-text-subtle uppercase tracking-wider">Phone</p>
                <p className="text-sm text-text mt-0.5">{shelter.phone}</p>
              </div>
            </div>
          )}
          {shelter.email && (
            <div className="flex items-start gap-3">
              <Mail size={15} className="text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-text-subtle uppercase tracking-wider">Email</p>
                <p className="text-sm text-text mt-0.5">{shelter.email}</p>
              </div>
            </div>
          )}
          {shelter.code && (
            <div className="flex items-start gap-3">
              <Building2 size={15} className="text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-text-subtle uppercase tracking-wider">Code</p>
                <p className="text-sm font-mono text-text mt-0.5">{shelter.code}</p>
              </div>
            </div>
          )}
        </div>

        {shelter.notes && (
          <div className="bg-background rounded-2xl border border-border p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold font-heading text-text mb-3">Notes</h2>
            <p className="text-sm text-text-muted leading-relaxed">{shelter.notes}</p>
          </div>
        )}

      </div>

      {showEdit && (
        <ShelterPanel
          editingShelter={shelter}
          onSave={handleSave}
          onClose={() => setShowEdit(false)}
        />
      )}

    </ShelterLayout>
  )
}
