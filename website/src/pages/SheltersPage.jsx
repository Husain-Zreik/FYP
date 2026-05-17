import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, LayoutGrid, List, Building2, Users, UserCheck, RefreshCw } from 'lucide-react'
import DashboardLayout  from '../components/layouts/DashboardLayout'
import ShelterPanel     from '../components/shelters/ShelterPanel'
import { Button, Table, Badge, SearchInput, Select, ConfirmDialog } from '../components/ui'
import { createShelter, updateShelter, deleteShelter } from '../api/shelters'
import { useSheltersStore } from '../store/dataStore'

const GOVERNORATES_OPTS = [
  { value: '', label: 'All governorates' },
  ...['Beirut','Mount Lebanon','North Lebanon','South Lebanon','Bekaa','Nabatieh','Akkar','Baalbek-Hermel']
    .map(g => ({ value: g, label: g })),
]

const STATUS_OPTS = [
  { value: '',                    label: 'All statuses'       },
  { value: 'active',              label: 'Active'             },
  { value: 'inactive',            label: 'Inactive'           },
  { value: 'full',                label: 'Full'               },
  { value: 'under_maintenance',   label: 'Under Maintenance'  },
]

const STATUS_BADGE = {
  active:            'success',
  inactive:          'muted',
  full:              'warning',
  under_maintenance: 'danger',
}

const STATUS_LABEL = {
  active:            'Active',
  inactive:          'Inactive',
  full:              'Full',
  under_maintenance: 'Maintenance',
}

export default function SheltersPage() {
  const navigate = useNavigate()
  const { items: shelters, loading, error: loadError, load, append, update: storeUpdate, remove } = useSheltersStore()

  const [search,     setSearch]     = useState('')
  const [govFilter,  setGovFilter]  = useState('')
  const [statFilter, setStatFilter] = useState('')
  const [panel,      setPanel]      = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)
  const [delError,   setDelError]   = useState(null)
  const [deleting,   setDeleting]   = useState(false)
  const [viewMode,   setViewMode]   = useState('grid')

  useEffect(() => { load() }, [load])

  const filtered = shelters.filter(s => {
    const q = search.toLowerCase()
    return (
      (!search || s.name.toLowerCase().includes(q) || (s.code ?? '').toLowerCase().includes(q) || s.address.toLowerCase().includes(q)) &&
      (!govFilter  || s.governorate === govFilter) &&
      (!statFilter || s.status      === statFilter)
    )
  })

  async function handleSave(formData) {
    if (panel?.shelter) {
      const res = await updateShelter(panel.shelter.id, formData)
      storeUpdate(panel.shelter.id, res.data)
      return res.data
    } else {
      const res = await createShelter(formData)
      append(res.data)
      return res.data
    }
  }

  async function handleDelete(shelter) {
    setDelError(null)
    setDeleting(true)
    try {
      await deleteShelter(shelter.id)
      remove(shelter.id)
      setDelTarget(null)
    } catch (err) {
      setDelError(err.message ?? 'Failed to delete shelter.')
    } finally { setDeleting(false) }
  }

  // Occupancy bar
  function OccupancyBar({ shelter }) {
    const pct = shelter.capacity > 0
      ? Math.min(100, Math.round(((shelter.civilians_count ?? 0) / shelter.capacity) * 100))
      : 0
    const color = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-success'
    return (
      <div className="flex items-center gap-2 min-w-25">
        <div className="flex-1 bg-surface-2 rounded-full h-1.5 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-text-muted shrink-0">{shelter.civilians_count ?? 0}/{shelter.capacity}</span>
      </div>
    )
  }

  const columns = [
    {
      key: 'name',
      header: 'Shelter',
      render: (_, s) => (
        <div>
          <p className="font-medium text-text">{s.name}</p>
          <p className="text-xs text-text-muted">{s.code ? `${s.code} Â· ` : ''}{s.governorate}</p>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      className: 'hidden lg:table-cell',
      render: addr => <span className="text-sm text-text-muted truncate max-w-xs block">{addr}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: s => <Badge variant={STATUS_BADGE[s] ?? 'muted'}>{STATUS_LABEL[s] ?? s}</Badge>,
    },
    {
      key: 'capacity',
      header: 'Occupancy',
      render: (_, s) => <OccupancyBar shelter={s} />,
    },
    {
      key: 'staff_count',
      header: 'Staff',
      className: 'hidden md:table-cell',
      render: n => <span className="text-sm text-text-muted">{n ?? 0}</span>,
    },
    {
      key: 'id',
      header: '',
      render: (_, s) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="icon-ghost"  onClick={() => navigate(`/shelters/${s.id}`)}      title="View details"><Eye     size={13} /></Button>
          <Button variant="icon-edit"   onClick={() => setPanel({ shelter: s })}            title="Edit"><Pencil size={13} /></Button>
          <Button variant="icon-delete" onClick={() => { setDelTarget(s); setDelError(null) }} title="Delete"><Trash2 size={13} /></Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout
      title="Shelters"
      subtitle="All registered shelter facilities nationwide."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => load(true)} title="Sync"><RefreshCw size={14}/></Button>
          <Button onClick={() => setPanel({})}><Plus size={14}/> Add shelter</Button>
        </div>
      }
    >

      {loadError && (
        <div className="text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          {loadError}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, code or address…" className="flex-1 min-w-40 max-w-xs" />
        <Select value={govFilter}  onChange={setGovFilter}  options={GOVERNORATES_OPTS} className="w-44" />
        <Select value={statFilter} onChange={setStatFilter} options={STATUS_OPTS}        className="w-36" />

        {/* View toggle */}
        <div className="flex items-center border border-border rounded-xl overflow-hidden shrink-0">
          <button onClick={() => setViewMode('table')}
            className={`px-3 py-2 transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-text-muted hover:bg-surface'}`}>
            <List size={15} />
          </button>
          <button onClick={() => setViewMode('grid')}
            className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-text-muted hover:bg-surface'}`}>
            <LayoutGrid size={15} />
          </button>
        </div>

      </div>

      {viewMode === 'table' ? (
        <Table columns={columns} data={filtered} loading={loading} emptyText="No shelters found." />
      ) : (
        /* ── Card grid ── */
        loading ? (
          <div className="flex justify-center py-24"><div className="w-6 h-6 border-2 border-border border-t-secondary rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-background rounded-2xl border border-border flex items-center justify-center text-center px-6" style={{ minHeight: 'clamp(320px, 55vh, 520px)' }}>
            <p className="text-sm text-text-muted">No shelters found.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(s => {
              const pct = s.capacity > 0 ? Math.min(100, Math.round(((s.civilians_count ?? 0) / s.capacity) * 100)) : 0
              const barColor = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-success'
              return (
                <div key={s.id} className="bg-background border border-border rounded-2xl overflow-hidden hover:border-border-2 hover:shadow-sm transition-all group">
                  {/* Cover image */}
                  <div className="h-40 relative overflow-hidden bg-surface-2">
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 size={40} className="text-border-2" />
                      </div>
                    )}
                    <div className="absolute top-3 inset-e-3">
                      <Badge variant={STATUS_BADGE[s.status] ?? 'muted'}>{STATUS_LABEL[s.status] ?? s.status}</Badge>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold font-heading text-text truncate">{s.name}</p>
                      {s.code && <span className="text-[10px] text-text-subtle bg-surface-2 px-1.5 py-0.5 rounded font-mono shrink-0">{s.code}</span>}
                    </div>
                    <p className="text-xs text-text-muted mb-3">{s.governorate}{s.district ? ` · ${s.district}` : ''}</p>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
                      <span className="flex items-center gap-1"><UserCheck size={12} /> {s.civilians_count ?? 0}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {s.staff_count ?? 0}</span>
                    </div>

                    {/* Capacity bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
                        <span>Capacity</span>
                        <span>{s.civilians_count ?? 0} / {s.capacity}</span>
                      </div>
                      <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="flex-1" onClick={() => navigate(`/shelters/${s.id}`)}>
                        <Eye size={13} /> Details
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setPanel({ shelter: s })} title="Edit"><Pencil size={13} /></Button>
                      <Button size="sm" variant="secondary" onClick={() => { setDelTarget(s); setDelError(null) }} title="Delete"><Trash2 size={13} /></Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {panel !== null && (
        <ShelterPanel editingShelter={panel.shelter} onSave={handleSave} onClose={() => setPanel(null)} />
      )}

      {delTarget && (
        <ConfirmDialog
          title="Delete shelter?"
          message={
            <>
              <span className="font-semibold text-text">{delTarget.name}</span> and all its records will be removed.
              {delError && <p className="mt-2 text-danger text-xs">{delError}</p>}
            </>
          }
          loading={deleting}
          onConfirm={() => handleDelete(delTarget)}
          onCancel={() => setDelTarget(null)}
        />
      )}

    </DashboardLayout>
  )
}

