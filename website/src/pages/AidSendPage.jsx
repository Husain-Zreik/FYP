import { useEffect, useState } from 'react'
import {
  RefreshCw, Plus, Clock, CheckCircle2, XCircle,
  Package, Send, CalendarClock, AlertCircle, Building2,
} from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import { Table, Button, Badge, Loader, SlidePanel, Select } from '../components/ui'
import { getAidDispatches, createAidDispatch } from '../api/aidDispatches'
import { getAidSchedules, createAidSchedule, updateAidSchedule, deleteAidSchedule, dispatchSchedule } from '../api/aidSchedules'
import { getShelters } from '../api/shelters'
import { getAidCategories } from '../api/aidCategories'

const STATUS_BADGE = { pending: 'warning', accepted: 'success', rejected: 'danger' }
const STATUS_LABEL = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' }

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

const FREQ_OPTS = [
  { value: 'weekly',    label: 'Weekly'    },
  { value: 'biweekly',  label: 'Bi-weekly' },
  { value: 'monthly',   label: 'Monthly'   },
  { value: 'quarterly', label: 'Quarterly' },
]
const FREQ_LABEL = Object.fromEntries(FREQ_OPTS.map(f => [f.value, f.label]))

const STATUS_FILTER_OPTS = [
  { value: '',         label: 'All statuses' },
  { value: 'pending',  label: 'Pending'      },
  { value: 'accepted', label: 'Accepted'     },
  { value: 'rejected', label: 'Rejected'     },
]

const inputCls = 'w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all'

function FieldLabel({ children, optional }) {
  return (
    <label className="block text-sm font-semibold text-text mb-1.5">
      {children}
      {optional && <span className="text-text-subtle font-normal ms-1">(optional)</span>}
    </label>
  )
}

function StatCard({ label, value, icon: Icon, iconColor, iconBg }) {
  return (
    <div className="bg-background border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon size={15} className={iconColor} />
        </div>
      </div>
      <p className="text-2xl font-bold font-heading text-text">{value}</p>
    </div>
  )
}

function SendDispatchPanel({ onClose, onCreated }) {
  const [shelters,   setShelters]   = useState([])
  const [categories, setCategories] = useState([])
  const [shelterId,  setShelterId]  = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [quantity,   setQuantity]   = useState('')
  const [notes,      setNotes]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    Promise.all([getShelters(), getAidCategories()])
      .then(([s, c]) => { setShelters(s.data ?? []); setCategories(c.data ?? []) })
      .catch(() => {})
  }, [])

  const shelterOpts  = [{ value: '', label: '— Select shelter —' },   ...shelters.map(s  => ({ value: String(s.id), label: s.name }))]
  const categoryOpts = [{ value: '', label: '— Select category —' },  ...categories.map(c => ({ value: String(c.id), label: c.name }))]
  const selectedCat  = categories.find(c => String(c.id) === categoryId)

  const availableQty = selectedCat?.total_available ?? 0
  const qtyExceeds   = !!selectedCat && Number(quantity) > availableQty

  async function handleSave() {
    setError(null); setSaving(true)
    try {
      const res = await createAidDispatch({
        shelter_id:      Number(shelterId),
        aid_category_id: Number(categoryId),
        quantity:        Number(quantity),
        notes:           notes || null,
      })
      onCreated(res.data)
      onClose()
    } catch (err) {
      setError(err.message ?? 'Failed to send aid.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SlidePanel
      title="Send Aid to Shelter"
      subtitle="Dispatch aid directly — shelter must confirm receipt"
      onClose={onClose}
      width="max-w-md"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} disabled={!shelterId || !categoryId || !quantity || qtyExceeds} onClick={handleSave}>
            <Send size={14} /> Send Aid
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}
        <Select label="Shelter" required value={shelterId} onChange={setShelterId} options={shelterOpts} />
        <Select label="Aid Category" required value={categoryId} onChange={setCategoryId} options={categoryOpts} />
        {selectedCat && (
          <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm border ${
            availableQty === 0
              ? 'bg-danger-surface border-danger/20'
              : availableQty < 20
                ? 'bg-warning-surface border-warning/20'
                : 'bg-success-surface border-success/20'
          }`}>
            <span className="text-text-muted">Available stock</span>
            <span className={`font-semibold ${
              availableQty === 0 ? 'text-danger' :
              availableQty < 20 ? 'text-warning' : 'text-success'
            }`}>
              {availableQty.toLocaleString()} {selectedCat.unit}
            </span>
          </div>
        )}
        <div>
          <FieldLabel>
            Quantity
            {selectedCat?.unit && <span className="text-text-subtle font-normal ms-1">({selectedCat.unit})</span>}
            <span className="text-danger ms-0.5">*</span>
          </FieldLabel>
          <input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)}
            placeholder="0" className={inputCls} />
          {qtyExceeds && (
            <p className="text-xs text-danger mt-1">Quantity exceeds available stock ({availableQty} {selectedCat?.unit})</p>
          )}
        </div>
        <div>
          <FieldLabel optional>Notes</FieldLabel>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Any instructions or context for the shelter…"
            className={`${inputCls} resize-none`} />
        </div>
      </div>
    </SlidePanel>
  )
}

function NewSchedulePanel({ onClose, onCreated }) {
  const [shelters,   setShelters]   = useState([])
  const [categories, setCategories] = useState([])
  const [shelterId,  setShelterId]  = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [quantity,   setQuantity]   = useState('')
  const [frequency,  setFrequency]  = useState('')
  const [startDate,  setStartDate]  = useState('')
  const [endDate,    setEndDate]    = useState('')
  const [notes,      setNotes]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    Promise.all([getShelters(), getAidCategories()])
      .then(([s, c]) => { setShelters(s.data ?? []); setCategories(c.data ?? []) })
      .catch(() => {})
  }, [])

  const shelterOpts  = [{ value: '', label: '— Select shelter —' },   ...shelters.map(s  => ({ value: String(s.id), label: s.name }))]
  const categoryOpts = [{ value: '', label: '— Select category —' },  ...categories.map(c => ({ value: String(c.id), label: c.name }))]
  const freqOpts     = [{ value: '', label: '— Select frequency —' }, ...FREQ_OPTS]
  const selectedCat  = categories.find(c => String(c.id) === categoryId)
  const availableQty = selectedCat?.total_available ?? 0

  async function handleSave() {
    setError(null); setSaving(true)
    try {
      const res = await createAidSchedule({
        shelter_id:      Number(shelterId),
        aid_category_id: Number(categoryId),
        quantity:        Number(quantity),
        frequency,
        starts_at: startDate,
        ends_at:   endDate || null,
        notes:     notes   || null,
      })
      onCreated(res.data)
      onClose()
    } catch (err) {
      setError(err.message ?? 'Failed to create schedule.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SlidePanel
      title="New Aid Schedule"
      subtitle="Set up a recurring aid delivery to a shelter"
      onClose={onClose}
      width="max-w-md"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} disabled={!shelterId || !categoryId || !quantity || !frequency || !startDate} onClick={handleSave}>
            Create Schedule
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}
        <Select label="Shelter" required value={shelterId} onChange={setShelterId} options={shelterOpts} />
        <Select label="Aid Category" required value={categoryId} onChange={setCategoryId} options={categoryOpts} />
        {selectedCat && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm border bg-surface border-border">
            <span className="text-text-muted">Current available stock</span>
            <span className="font-semibold text-text">
              {availableQty.toLocaleString()} {selectedCat.unit}
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>
              Qty per dispatch
              {selectedCat?.unit && <span className="text-text-subtle font-normal ms-1">({selectedCat.unit})</span>}
              <span className="text-danger ms-0.5">*</span>
            </FieldLabel>
            <input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)}
              placeholder="0" className={inputCls} />
          </div>
          <Select label="Frequency *" required value={frequency} onChange={setFrequency} options={freqOpts} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Start Date <span className="text-danger">*</span></FieldLabel>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <FieldLabel optional>End Date</FieldLabel>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <FieldLabel optional>Notes</FieldLabel>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Any notes about this recurring delivery…"
            className={`${inputCls} resize-none`} />
        </div>
      </div>
    </SlidePanel>
  )
}

function ScheduleCard({ schedule, onToggle, onDelete, onDispatched }) {
  const category = schedule.category ?? {}
  const shelter  = schedule.shelter  ?? {}

  const [dispatching, setDispatching] = useState(false)
  const [toggling,    setToggling]    = useState(false)
  const [deleting,    setDeleting]    = useState(false)

  async function handleDispatch() {
    setDispatching(true)
    try {
      await dispatchSchedule(schedule.id)
      onDispatched(schedule.id)
    } catch {
      // silent
    } finally { setDispatching(false) }
  }

  async function handleToggle() {
    setToggling(true)
    try {
      const res = await updateAidSchedule(schedule.id, { is_active: !schedule.is_active })
      onToggle(res.data)
    } catch {
      // silent
    } finally { setToggling(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteAidSchedule(schedule.id)
      onDelete(schedule.id)
    } catch {
      // silent
    } finally { setDeleting(false) }
  }

  return (
    <div className={`bg-background border rounded-2xl p-5 flex flex-col gap-3 transition-all ${
      schedule.is_active ? 'border-border hover:border-border-2' : 'border-border opacity-70'
    }`}>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-text truncate">{category.name ?? '—'}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Building2 size={12} className="text-text-subtle" />
            <p className="text-xs text-text-muted truncate">{shelter.name ?? '—'}</p>
            {shelter.governorate && (
              <span className="text-text-subtle text-xs">· {shelter.governorate}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="muted">{FREQ_LABEL[schedule.frequency] ?? schedule.frequency}</Badge>
          <Badge variant={schedule.is_active ? 'success' : 'muted'}>
            {schedule.is_active ? 'Active' : 'Paused'}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded-xl">
        <Package size={14} className="text-text-muted shrink-0" />
        <p className="text-sm text-text">
          <span className="font-medium">{schedule.quantity}</span>
          <span className="text-text-muted"> {category.unit ?? 'units'}</span>
          <span className="text-text-subtle"> · per {(FREQ_LABEL[schedule.frequency] ?? schedule.frequency)?.toLowerCase()}</span>
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-text-subtle">
        <span>Started {fmt(schedule.starts_at)}</span>
        <span>Last sent: {schedule.last_sent_at ? fmt(schedule.last_sent_at) : 'Never'}</span>
      </div>

      {schedule.notes && (
        <p className="text-xs text-text-subtle italic leading-relaxed border-t border-border pt-2">
          {schedule.notes}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-border">
        <Button size="sm" onClick={handleDispatch} loading={dispatching} disabled={!schedule.is_active}>
          <Send size={13} /> Send Now
        </Button>
        <Button size="sm" variant="secondary" onClick={handleToggle} loading={toggling}>
          {schedule.is_active ? 'Pause' : 'Resume'}
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="icon-delete" onClick={handleDelete} loading={deleting} />
      </div>
    </div>
  )
}

const DISPATCH_COLUMNS = [
  {
    key: 'shelter',
    header: 'Shelter',
    render: (_, d) => (
      <div>
        <p className="font-medium text-text">{d.shelter?.name ?? '—'}</p>
        <p className="text-xs text-text-muted">{d.shelter?.governorate}</p>
      </div>
    ),
  },
  {
    key: 'category',
    header: 'Aid Type',
    render: (_, d) => <span className="text-sm text-text">{d.category?.name ?? '—'}</span>,
  },
  {
    key: 'quantity',
    header: 'Quantity',
    render: (_, d) => (
      <span className="text-sm font-medium text-text">
        {d.quantity} <span className="font-normal text-text-muted">{d.category?.unit ?? 'units'}</span>
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (_, d) => (
      <Badge variant={STATUS_BADGE[d.status]}>{STATUS_LABEL[d.status]}</Badge>
    ),
  },
  {
    key: 'dispatched_at',
    header: 'Dispatched',
    className: 'hidden md:table-cell',
    render: (_, d) => (
      <span className="text-sm text-text-muted">{fmt(d.dispatched_at ?? d.created_at)}</span>
    ),
  },
  {
    key: 'received_at',
    header: 'Received',
    render: (_, d) => {
      if (d.status === 'accepted') {
        return <span className="text-xs text-success">{fmt(d.received_at)}</span>
      }
      if (d.status === 'rejected') {
        return (
          <div>
            <span className="text-xs text-danger">Declined</span>
            {d.rejection_reason && (
              <p className="text-xs text-text-muted truncate max-w-36">{d.rejection_reason}</p>
            )}
          </div>
        )
      }
      return <span className="text-xs text-text-subtle">Pending</span>
    },
  },
  {
    key: 'notes',
    header: 'Notes',
    className: 'hidden xl:table-cell',
    render: (_, d) => (
      <span className="text-xs text-text-muted italic truncate block max-w-40">{d.notes ?? '—'}</span>
    ),
  },
]

export default function AidSendPage() {
  const [activeTab,      setActiveTab]      = useState('dispatches')
  const [dispatches,     setDispatches]     = useState([])
  const [schedules,      setSchedules]      = useState([])
  const [loadingD,       setLoadingD]       = useState(true)
  const [loadingS,       setLoadingS]       = useState(true)
  const [errorD,         setErrorD]         = useState(null)
  const [errorS,         setErrorS]         = useState(null)
  const [statusFilter,   setStatusFilter]   = useState('')
  const [showDispPanel,  setShowDispPanel]  = useState(false)
  const [showSchedPanel, setShowSchedPanel] = useState(false)

  function loadDispatches() {
    setLoadingD(true); setErrorD(null)
    getAidDispatches({ direction: 'outgoing' })
      .then(res => setDispatches(res.data ?? []))
      .catch(err => setErrorD(err.message ?? 'Failed to load dispatches.'))
      .finally(() => setLoadingD(false))
  }

  function loadSchedules() {
    setLoadingS(true); setErrorS(null)
    getAidSchedules({ level: 'government_shelter' })
      .then(res => setSchedules(res.data ?? []))
      .catch(err => setErrorS(err.message ?? 'Failed to load schedules.'))
      .finally(() => setLoadingS(false))
  }

  useEffect(() => { loadDispatches(); loadSchedules() }, [])

  const pending  = dispatches.filter(d => d.status === 'pending').length
  const accepted = dispatches.filter(d => d.status === 'accepted').length
  const rejected = dispatches.filter(d => d.status === 'rejected').length

  const filtered = statusFilter
    ? dispatches.filter(d => d.status === statusFilter)
    : dispatches

  const activeSchedules = schedules.filter(s => s.is_active).length
  const pausedSchedules = schedules.filter(s => !s.is_active).length

  return (
    <DashboardLayout
      title="Send Aid"
      subtitle="Dispatch aid to shelters or set up recurring schedules"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => activeTab === 'dispatches' ? loadDispatches() : loadSchedules()}>
            <RefreshCw size={14} />
          </Button>
          <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1">
            {[
              { key: 'dispatches', label: 'Direct Dispatches' },
              { key: 'schedules',  label: 'Schedules'         },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-background text-text shadow-sm border border-border'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {/* Always visible stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending"  value={pending}  icon={Clock}        iconColor="text-warning" iconBg="bg-warning-surface" />
        <StatCard label="Accepted" value={accepted} icon={CheckCircle2} iconColor="text-success" iconBg="bg-success-surface" />
        <StatCard label="Rejected" value={rejected} icon={XCircle}      iconColor="text-danger"  iconBg="bg-danger-surface"  />
      </div>

      {/* Dispatches tab */}
      {activeTab === 'dispatches' && (
        <div className="space-y-5">
          {errorD && (
            <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="shrink-0 mt-0.5" /> {errorD}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {dispatches.length > 0 && (
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={STATUS_FILTER_OPTS}
                  className="w-44"
                />
              )}
              {statusFilter && (
                <p className="text-xs text-text-muted">
                  Showing {filtered.length} of {dispatches.length} dispatches
                </p>
              )}
            </div>
            <Button onClick={() => setShowDispPanel(true)} className="shrink-0">
              <Plus size={14} /> Send Aid to Shelter
            </Button>
          </div>

          <Table
            columns={DISPATCH_COLUMNS}
            data={filtered}
            loading={loadingD}
            emptyText="No dispatches sent yet."
            pageSize={10}
          />
        </div>
      )}

      {/* Schedules tab */}
      {activeTab === 'schedules' && (
        <div className="space-y-5">
          {errorS && (
            <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="shrink-0 mt-0.5" /> {errorS}
            </div>
          )}

          <div className="flex items-center justify-between">
            {schedules.length > 0 ? (
              <div className="flex items-center gap-3">
                <Badge variant="success">{activeSchedules} active</Badge>
                {pausedSchedules > 0 && <Badge variant="muted">{pausedSchedules} paused</Badge>}
              </div>
            ) : <div />}
            <Button onClick={() => setShowSchedPanel(true)}>
              <Plus size={14} /> New Schedule
            </Button>
          </div>

          {loadingS ? (
            <div className="flex items-center justify-center bg-background border border-border rounded-2xl" style={{ minHeight: 'clamp(280px,50vh,400px)' }}>
              <Loader size="lg" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center bg-background border border-border rounded-2xl gap-2" style={{ minHeight: 'clamp(280px,50vh,400px)' }}>
              <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center">
                <CalendarClock size={20} className="text-text-subtle" />
              </div>
              <p className="text-sm font-medium text-text">No schedules set up yet</p>
              <p className="text-xs text-text-muted">Create recurring aid deliveries to automate supply distribution.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {schedules.map(s => (
                <ScheduleCard
                  key={s.id}
                  schedule={s}
                  onToggle={updated => setSchedules(prev => prev.map(x => x.id === updated.id ? updated : x))}
                  onDelete={id      => setSchedules(prev => prev.filter(x => x.id !== id))}
                  onDispatched={id  => setSchedules(prev => prev.map(x => x.id === id
                    ? { ...x, last_sent_at: new Date().toISOString().split('T')[0] }
                    : x
                  ))}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showDispPanel && (
        <SendDispatchPanel
          onClose={() => setShowDispPanel(false)}
          onCreated={d => setDispatches(prev => [d, ...prev])}
        />
      )}

      {showSchedPanel && (
        <NewSchedulePanel
          onClose={() => setShowSchedPanel(false)}
          onCreated={s => setSchedules(prev => [s, ...prev])}
        />
      )}
    </DashboardLayout>
  )
}
