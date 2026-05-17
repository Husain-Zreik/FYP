import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, MapPin, Phone, Mail, Users, UserCheck, AlertCircle, Eye, UploadCloud, Building2, Package, CheckCircle2, Clock, FileText, ChevronDown } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import ShelterPanel    from '../components/shelters/ShelterPanel'
import { Button, Badge, Loader, Table, FilterBar } from '../components/ui'
import { getShelter, updateShelter, uploadShelterImage } from '../api/shelters'
import { getAidDispatches } from '../api/aidDispatches'
import { getAidRequests } from '../api/aidRequests'

const STATUS_BADGE = {
  active:           'success',
  inactive:         'muted',
  full:             'warning',
  under_maintenance:'danger',
}
const STATUS_LABEL = {
  active:           'Active',
  inactive:         'Inactive',
  full:             'Full',
  under_maintenance:'Maintenance',
}
const ROLE_BADGE = {
  shelter_admin: 'success',
  shelter_staff: 'muted',
}
const ROLE_LABEL = {
  shelter_admin: 'Shelter Admin',
  shelter_staff: 'Shelter Staff',
}

function ShelterImageCard({ shelter, onUpdated }) {
  const inputRef     = useRef()
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState(null)

  async function handleFile(file) {
    if (!file) return
    setUploading(true); setError(null)
    try {
      const res = await uploadShelterImage(shelter.id, file)
      onUpdated?.(res.data.url)
    } catch (err) {
      setError(err.message ?? 'Upload failed.')
    } finally { setUploading(false) }
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border mb-5 bg-surface-2" style={{ height: 220 }}>
      {shelter.image_url ? (
        <img src={shelter.image_url} alt={shelter.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
          <Building2 size={40} className="text-border-2" />
          <p className="text-xs text-text-subtle">No cover image</p>
        </div>
      )}

      {error && <p className="absolute bottom-2 inset-s-2 text-xs text-danger bg-danger-surface rounded px-2 py-1">{error}</p>}

      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => handleFile(e.target.files[0])} />

      <div className="absolute bottom-3 inset-e-3">
        <Button size="sm" variant="secondary" loading={uploading}
          className="bg-background/90 backdrop-blur-sm"
          onClick={() => inputRef.current.click()}>
          <UploadCloud size={13} /> {shelter.image_url ? 'Change' : 'Add image'}
        </Button>
      </div>
    </div>
  )
}

export default function ShelterDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [shelter,          setShelter]          = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState(null)
  const [showEdit,         setShowEdit]         = useState(false)
  const [aidStats,         setAidStats]         = useState(null)
  const [aidLoading,       setAidLoading]       = useState(true)
  const [staffSearch,      setStaffSearch]      = useState('')
  const [civilianSearch,   setCivilianSearch]   = useState('')
  const [staffExpanded,    setStaffExpanded]    = useState(true)
  const [civilianExpanded, setCivilianExpanded] = useState(true)

  useEffect(() => {
    Promise.all([
      getShelter(id),
      getAidDispatches({ shelter_id: id }),
      getAidRequests({ shelter_id: id }),
    ]).then(([shelterRes, dispatchRes, requestRes]) => {
      setShelter(shelterRes.data)
      const dispatches = dispatchRes.data ?? []
      const requests   = requestRes.data   ?? []
      const accepted   = dispatches.filter(d => d.status === 'accepted')
      const pending    = dispatches.filter(d => d.status === 'pending')
      const byCategory = {}
      accepted.forEach(d => {
        const name = d.category?.name ?? 'Unknown'
        const unit = d.category?.unit ?? 'units'
        byCategory[name] = { qty: (byCategory[name]?.qty ?? 0) + d.quantity, unit }
      })
      setAidStats({
        totalDispatched: dispatches.length,
        accepted:        accepted.length,
        pendingIncoming: pending.length,
        rejected:        dispatches.filter(d => d.status === 'rejected').length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        totalRequests:   requests.length,
        byCategory:      Object.entries(byCategory).map(([name, { qty, unit }]) => ({ name, qty, unit })),
      })
    }).catch(err => setError(err.message ?? 'Failed to load shelter.'))
      .finally(() => { setLoading(false); setAidLoading(false) })
  }, [id])

  async function handleSave(formData) {
    const res = await updateShelter(id, formData)
    setShelter(prev => ({ ...prev, ...res.data }))
    return res.data
  }

  // Occupancy percentage
  const occupancy = shelter
    ? Math.min(100, Math.round(((shelter.civilians_count ?? 0) / (shelter.capacity ?? 1)) * 100))
    : 0
  const occupancyColor = occupancy >= 90 ? 'bg-danger' : occupancy >= 70 ? 'bg-warning' : 'bg-success'

  const staffColumns = [
    {
      key: 'name',
      header: 'Staff member',
      render: (_, u) => (
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-text">{u.name}</p>
            <p className="text-xs text-text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: role => <Badge variant={ROLE_BADGE[role] ?? 'muted'}>{ROLE_LABEL[role] ?? role}</Badge>,
    },
    {
      key: 'phone',
      header: 'Phone',
      className: 'hidden sm:table-cell',
      render: phone => <span className="text-sm text-text-muted">{phone ?? '—'}</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: active => <Badge variant={active ? 'success' : 'danger'}>{active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'id',
      header: '',
      render: (_, u) => (
        <div className="flex justify-end">
          <Button variant="icon-ghost" onClick={() => navigate(`/users/${u.id}`)} title="View profile"><Eye size={13} /></Button>
        </div>
      ),
    },
  ]

  const civilianColumns = [
    {
      key: 'name',
      header: 'Civilian',
      render: (_, u) => (
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-warning-surface flex items-center justify-center text-xs font-bold text-warning shrink-0">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-text">{u.name}</p>
            <p className="text-xs text-text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      className: 'hidden sm:table-cell',
      render: phone => <span className="text-sm text-text-muted">{phone ?? '—'}</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: active => <Badge variant={active ? 'success' : 'danger'}>{active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'id',
      header: '',
      render: (_, u) => (
        <div className="flex justify-end">
          <Button variant="icon-ghost" onClick={() => navigate(`/civilians/${u.id}`)} title="View details"><Eye size={13} /></Button>
        </div>
      ),
    },
  ]

  if (loading) return (
    <DashboardLayout title="Shelter" back="/shelters">
      <div className="flex items-center justify-center" style={{ minHeight: 'clamp(320px, 55vh, 520px)' }}>
        <Loader size="lg" />
      </div>
    </DashboardLayout>
  )

  if (error || !shelter) return (
    <DashboardLayout title="Shelter" back="/shelters">
      <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
        <AlertCircle size={15} className="shrink-0 mt-0.5" />{error ?? 'Shelter not found.'}
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout
      title={shelter.name}
      subtitle={`${shelter.governorate}${shelter.district ? ` · ${shelter.district}` : ''}`}
      back="/shelters"
      badge={
        <>
          {shelter.code && <span className="text-xs text-text-subtle bg-surface-2 px-2 py-0.5 rounded-full font-mono">{shelter.code}</span>}
          <Badge variant={STATUS_BADGE[shelter.status] ?? 'muted'}>{STATUS_LABEL[shelter.status] ?? shelter.status}</Badge>
        </>
      }
      actions={
        <Button onClick={() => setShowEdit(true)}>
          <Save size={14} /> Edit
        </Button>
      }
    >

      <ShelterImageCard shelter={shelter} onUpdated={img => setShelter(p => ({ ...p, image_url: img }))} />

      <div className="grid lg:grid-cols-3 gap-5 mb-6">

        {/* Info card */}
        <div className="lg:col-span-2 bg-background rounded-2xl border border-border p-6 space-y-4">
          <h3 className="text-sm font-semibold font-heading text-text">Details</h3>

          <div className="flex items-start gap-2 text-sm text-text-muted">
            <MapPin size={15} className="shrink-0 mt-0.5 text-secondary" />
            <span>{shelter.address}</span>
          </div>

          {(shelter.latitude && shelter.longitude) && (
            <div className="flex items-start gap-2 text-sm text-text-muted">
              <MapPin size={15} className="shrink-0 mt-0.5 text-text-subtle" />
              <span className="font-mono text-xs">{shelter.latitude}, {shelter.longitude}</span>
            </div>
          )}

          {shelter.phone && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Phone size={15} className="shrink-0 text-secondary" />
              <span>{shelter.phone}</span>
            </div>
          )}

          {shelter.email && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Mail size={15} className="shrink-0 text-secondary" />
              <span>{shelter.email}</span>
            </div>
          )}

          {shelter.notes && (
            <p className="text-sm text-text-muted bg-surface rounded-xl px-4 py-3 leading-relaxed">
              {shelter.notes}
            </p>
          )}
        </div>

        {/* Stats card */}
        <div className="bg-background rounded-2xl border border-border p-6 space-y-5">
          <h3 className="text-sm font-semibold font-heading text-text">Capacity</h3>

          {/* Occupancy bar */}
          <div>
            <div className="flex justify-between text-xs text-text-muted mb-2">
              <span>{shelter.civilians_count ?? 0} civilians</span>
              <span>{occupancy}%</span>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-2.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${occupancyColor}`} style={{ width: `${occupancy}%` }} />
            </div>
            <p className="text-xs text-text-subtle mt-1">Max capacity: {shelter.capacity}</p>
          </div>

          <div className="divide-y divide-border">
            {[
              { icon: Users,      label: 'Civilians', value: shelter.civilians_count ?? 0, color: 'text-warning'   },
              { icon: UserCheck,  label: 'Staff',     value: shelter.staff_count     ?? 0, color: 'text-secondary' },
              { icon: MapPin,     label: 'Rooms',     value: shelter.rooms ?? '—',          color: 'text-text-muted' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Icon size={14} className={color} /> {label}
                </div>
                <span className="text-sm font-semibold text-text">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aid Overview */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold font-heading text-text mb-4">Aid Overview</h3>
        {aidLoading ? (
          <div className="flex items-center justify-center bg-background border border-border rounded-2xl py-8">
            <Loader size="sm" />
          </div>
        ) : aidStats ? (
          <div className="space-y-4">
            {/* Stat cards row */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Total Dispatched', value: aidStats.totalDispatched, color: 'text-text-muted', bg: 'bg-surface-2',      icon: Package     },
                { label: 'Received',         value: aidStats.accepted,        color: 'text-success',    bg: 'bg-success-surface', icon: CheckCircle2 },
                { label: 'Pending Delivery', value: aidStats.pendingIncoming, color: 'text-warning',    bg: 'bg-warning-surface', icon: Clock        },
                { label: 'Aid Requests',     value: aidStats.totalRequests,   color: 'text-secondary',  bg: 'bg-secondary/10',    icon: FileText     },
              ].map(({ label, value, color, bg, icon: Icon }) => (
                <div key={label} className="bg-background border border-border rounded-2xl p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon size={16} className={color} />
                  </div>
                  <div>
                    <p className="text-xl font-bold font-heading text-text leading-none">{value}</p>
                    <p className="text-xs text-text-muted mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Category breakdown */}
            {aidStats.byCategory.length > 0 && (
              <div className="bg-background border border-border rounded-2xl p-5">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Received by Category</h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {aidStats.byCategory.map(c => (
                    <div key={c.name} className="flex items-center justify-between bg-surface rounded-xl px-3 py-2">
                      <span className="text-sm text-text">{c.name}</span>
                      <span className="text-sm font-semibold text-text">{c.qty} <span className="font-normal text-text-muted text-xs">{c.unit}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Staff section — collapsible */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden mb-5">
        <button
          onClick={() => setStaffExpanded(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Users size={15} className="text-secondary" />
            <h3 className="text-sm font-semibold font-heading text-text">Staff</h3>
            <span className="text-xs text-text-subtle bg-surface-2 px-2 py-0.5 rounded-full">
              {shelter.staff?.length ?? 0}
            </span>
          </div>
          <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${staffExpanded ? 'rotate-180' : ''}`} />
        </button>

        {staffExpanded && (
          <div className="border-t border-border">
            <div className="px-5 py-3">
              <FilterBar
                search={staffSearch}
                onSearch={setStaffSearch}
                className="mb-0"
              />
            </div>
            <Table
              columns={staffColumns}
              data={(shelter.staff ?? []).filter(u =>
                !staffSearch ||
                u.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
                u.email?.toLowerCase().includes(staffSearch.toLowerCase())
              )}
              pageSize={8}
              emptyText="No staff assigned to this shelter."
            />
          </div>
        )}
      </div>

      {/* Civilians section — collapsible */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden mb-5">
        <button
          onClick={() => setCivilianExpanded(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Users size={15} className="text-warning" />
            <h3 className="text-sm font-semibold font-heading text-text">Civilians</h3>
            <span className="text-xs text-text-subtle bg-surface-2 px-2 py-0.5 rounded-full">
              {shelter.civilians?.length ?? 0}
            </span>
          </div>
          <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${civilianExpanded ? 'rotate-180' : ''}`} />
        </button>

        {civilianExpanded && (
          <div className="border-t border-border">
            <div className="px-5 py-3">
              <FilterBar
                search={civilianSearch}
                onSearch={setCivilianSearch}
                className="mb-0"
              />
            </div>
            <Table
              columns={civilianColumns}
              data={(shelter.civilians ?? []).filter(u =>
                !civilianSearch ||
                u.name.toLowerCase().includes(civilianSearch.toLowerCase()) ||
                u.email?.toLowerCase().includes(civilianSearch.toLowerCase())
              )}
              pageSize={12}
              emptyText="No civilians admitted to this shelter."
            />
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

    </DashboardLayout>
  )
}
