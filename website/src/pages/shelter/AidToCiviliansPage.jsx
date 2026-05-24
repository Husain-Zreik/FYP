import { useEffect, useState } from 'react'
import {
  RefreshCw, Plus, Clock, CheckCircle2, XCircle, Package,
  Send, CalendarClock, AlertCircle, Check, X,
} from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import { Button, Badge, Loader, SlidePanel, Select, Table, StatCard } from '../../components/ui'
import { fmt } from '../../utils/format'
import { getAidDispatches, createAidDispatch, acceptAidDispatch, rejectAidDispatch } from '../../api/aidDispatches'
import { getAidSchedules, createAidSchedule, updateAidSchedule, deleteAidSchedule, dispatchSchedule } from '../../api/aidSchedules'
import { getAidCategories } from '../../api/aidCategories'
import { getUsers } from '../../api/users'
import { useAuthStore } from '../../store/authStore'

const STATUS_BADGE  = { pending: 'warning', accepted: 'success', rejected: 'danger' }
const STATUS_LABEL  = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' }
const FREQ_OPTS = [
  { value: 'weekly',    label: 'Weekly'    },
  { value: 'biweekly',  label: 'Bi-weekly' },
  { value: 'monthly',   label: 'Monthly'   },
  { value: 'quarterly', label: 'Quarterly' },
]

function CivilianAvatar({ name }) {
  const initial = (name ?? '?').charAt(0).toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-warning-surface flex items-center justify-center text-xs font-bold text-warning shrink-0">
      {initial}
    </div>
  )
}

function SendDispatchPanel({ onClose, onCreated, shelterId }) {
  const [civilians,    setCivilians]    = useState([])
  const [categories,   setCategories]   = useState([])
  const [civilianId,   setCivilianId]   = useState('')
  const [categoryId,   setCategoryId]   = useState('')
  const [quantity,     setQuantity]     = useState('')
  const [notes,        setNotes]        = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState(null)

  useEffect(() => {
    Promise.all([
      getUsers({ role: 'civilian' }),
      getAidCategories(),
    ])
      .then(([u, c]) => {
        setCivilians(u.data ?? [])
        setCategories(c.data ?? [])
      })
      .catch(() => {})
  }, [shelterId])

  const civilianOpts = [
    { value: '', label: '— Select civilian —' },
    ...civilians.map(c => ({ value: String(c.id), label: c.name })),
  ]
  const categoryOpts = [
    { value: '', label: '— Select category —' },
    ...categories.map(c => ({ value: String(c.id), label: c.name })),
  ]
  const selectedCat = categories.find(c => String(c.id) === categoryId)

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const res = await createAidDispatch({
        civilian_id:            Number(civilianId),
        aid_category_id:        Number(categoryId),
        quantity:               Number(quantity),
        notes:                  notes || null,
        expected_arrival_date:  expectedDate || null,
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
      title="Send Aid to Civilian"
      subtitle="Dispatch supplies to a civilian in your shelter"
      onClose={onClose}
      width="max-w-md"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            loading={saving}
            disabled={!civilianId || !categoryId || !quantity}
            onClick={handleSave}
          >
            Send Aid
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
        <Select label="Civilian" value={civilianId} onChange={setCivilianId} options={civilianOpts} />
        <Select label="Aid Category" value={categoryId} onChange={setCategoryId} options={categoryOpts} />
        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">
            Quantity {selectedCat?.unit && <span className="text-text-subtle font-normal">({selectedCat.unit})</span>}
          </label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">
            Expected Arrival Date <span className="text-text-subtle font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={expectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setExpectedDate(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background focus:outline-none focus:border-secondary hover:border-border-2 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">Notes <span className="text-text-subtle font-normal">(optional)</span></label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all resize-none"
          />
        </div>
      </div>
    </SlidePanel>
  )
}

function NewSchedulePanel({ onClose, onCreated, shelterId }) {
  const [civilians,  setCivilians]  = useState([])
  const [categories, setCategories] = useState([])
  const [civilianId, setCivilianId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [quantity,   setQuantity]   = useState('')
  const [frequency,  setFrequency]  = useState('')
  const [startsAt,   setStartsAt]   = useState('')
  const [endsAt,     setEndsAt]     = useState('')
  const [notes,      setNotes]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    Promise.all([
      getUsers({ role: 'civilian' }),
      getAidCategories(),
    ])
      .then(([u, c]) => {
        setCivilians(u.data ?? [])
        setCategories(c.data ?? [])
      })
      .catch(() => {})
  }, [shelterId])

  const civilianOpts = [
    { value: '', label: '— Select civilian —' },
    ...civilians.map(c => ({ value: String(c.id), label: c.name })),
  ]
  const categoryOpts = [
    { value: '', label: '— Select category —' },
    ...categories.map(c => ({ value: String(c.id), label: c.name })),
  ]
  const freqOpts = [{ value: '', label: '— Select frequency —' }, ...FREQ_OPTS]

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const res = await createAidSchedule({
        civilian_id:     Number(civilianId),
        aid_category_id: Number(categoryId),
        quantity:        Number(quantity),
        frequency,
        starts_at: startsAt,
        ends_at:   endsAt || null,
        notes:     notes  || null,
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
      subtitle="Set up recurring aid deliveries to a civilian"
      onClose={onClose}
      width="max-w-md"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            loading={saving}
            disabled={!civilianId || !categoryId || !quantity || !frequency || !startsAt}
            onClick={handleSave}
          >
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
        <Select label="Civilian" value={civilianId} onChange={setCivilianId} options={civilianOpts} />
        <Select label="Aid Category" value={categoryId} onChange={setCategoryId} options={categoryOpts} />
        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">Quantity per dispatch</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all"
          />
        </div>
        <Select label="Frequency" value={frequency} onChange={setFrequency} options={freqOpts} />
        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">Start Date</label>
          <input
            type="date"
            value={startsAt}
            onChange={e => setStartsAt(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background focus:outline-none focus:border-secondary hover:border-border-2 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">End Date <span className="text-text-subtle font-normal">(optional)</span></label>
          <input
            type="date"
            value={endsAt}
            onChange={e => setEndsAt(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background focus:outline-none focus:border-secondary hover:border-border-2 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">Notes <span className="text-text-subtle font-normal">(optional)</span></label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all resize-none"
          />
        </div>
      </div>
    </SlidePanel>
  )
}

function AcceptDispatchPanel({ dispatch, onClose, onAccepted }) {
  const category = dispatch.category ?? {}
  const today    = new Date().toISOString().split('T')[0]

  const [receivedAt, setReceivedAt] = useState(today)
  const [notes,      setNotes]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const res = await acceptAidDispatch(dispatch.id, {
        received_at: receivedAt,
        notes:       notes || null,
      })
      onAccepted(res.data)
      onClose()
    } catch (err) {
      setError(err.message ?? 'Failed to mark as accepted.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SlidePanel
      title="Confirm Receipt"
      subtitle={`${category.name ?? '—'} — ${dispatch.quantity} ${category.unit ?? 'units'}`}
      onClose={onClose}
      width="max-w-sm"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} disabled={!receivedAt} onClick={handleSave}>Confirm Receipt</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">Date Received</label>
          <input
            type="date"
            value={receivedAt}
            onChange={e => setReceivedAt(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background focus:outline-none focus:border-secondary hover:border-border-2 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">Notes <span className="text-text-subtle font-normal">(optional)</span></label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all resize-none"
          />
        </div>
      </div>
    </SlidePanel>
  )
}

function RejectDispatchPanel({ dispatch, onClose, onRejected }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const res = await rejectAidDispatch(dispatch.id, { rejection_reason: reason || null })
      onRejected(res.data)
      onClose()
    } catch (err) {
      setError(err.message ?? 'Failed to reject dispatch.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SlidePanel
      title="Reject Dispatch"
      onClose={onClose}
      width="max-w-sm"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} variant="danger" onClick={handleSave}>Reject</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">Reason <span className="text-text-subtle font-normal">(optional)</span></label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all resize-none"
          />
        </div>
      </div>
    </SlidePanel>
  )
}

function ScheduleCard({ schedule, onToggle, onDelete, onDispatched }) {
  const category  = schedule.category ?? {}
  const civilian  = schedule.civilian ?? {}
  const freqLabel = FREQ_OPTS.find(f => f.value === schedule.frequency)?.label ?? schedule.frequency

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
    } finally {
      setDispatching(false)
    }
  }

  async function handleToggle() {
    setToggling(true)
    try {
      const res = await updateAidSchedule(schedule.id, { is_active: !schedule.is_active })
      onToggle(res.data)
    } catch {
      // silent
    } finally {
      setToggling(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteAidSchedule(schedule.id)
      onDelete(schedule.id)
    } catch {
      // silent
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-background border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-semibold text-text">{category.name ?? '—'}</p>
        <Badge variant="muted">{freqLabel}</Badge>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <CivilianAvatar name={schedule.civilian?.name} />
        <p className="text-sm text-text-muted">{schedule.civilian?.name ?? '—'}</p>
      </div>

      <p className="text-sm text-text">
        {schedule.quantity} {category.unit ?? 'units'} per {freqLabel?.toLowerCase() ?? schedule.frequency}
      </p>

      <p className="text-xs text-text-subtle mt-1">
        Last sent: {schedule.last_sent_at ? fmt(schedule.last_sent_at) : 'Never sent'}
      </p>

      <div className="mt-1">
        <Badge variant={schedule.is_active ? 'success' : 'muted'}>
          {schedule.is_active ? 'Active' : 'Paused'}
        </Badge>
      </div>

      {schedule.notes && (
        <p className="text-xs text-text-subtle italic mt-2">{schedule.notes}</p>
      )}

      <div className="flex gap-2 mt-3">
        <Button size="sm" variant="secondary" onClick={handleDispatch} loading={dispatching}>
          <Send size={13} /> Send Now
        </Button>
        <Button size="sm" variant={schedule.is_active ? 'ghost' : 'secondary'} onClick={handleToggle} loading={toggling}>
          {schedule.is_active ? 'Pause' : 'Resume'}
        </Button>
        <Button size="sm" variant="icon-delete" onClick={handleDelete} loading={deleting} />
      </div>
    </div>
  )
}

const DISPATCH_EMPTY_NODE = (
  <>
    <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-3">
      <Package size={20} className="text-text-subtle" />
    </div>
    <p className="text-sm font-medium text-text">No dispatches sent to civilians yet.</p>
    <p className="text-xs text-text-muted">Use &ldquo;Send Aid to Civilian&rdquo; to get started.</p>
  </>
)

const SCHEDULE_EMPTY_NODE = (
  <>
    <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-3">
      <CalendarClock size={20} className="text-text-subtle" />
    </div>
    <p className="text-sm font-medium text-text">No schedules set up yet.</p>
  </>
)

export default function AidToCiviliansPage() {
  const user      = useAuthStore((s) => s.user)
  const shelterId = user?.shelter_id ?? null

  const [activeTab,      setActiveTab]      = useState('dispatches')
  const [dispatches,     setDispatches]     = useState([])
  const [schedules,      setSchedules]      = useState([])
  const [loadingD,       setLoadingD]       = useState(true)
  const [loadingS,       setLoadingS]       = useState(true)
  const [errorD,         setErrorD]         = useState(null)
  const [errorS,         setErrorS]         = useState(null)
  const [showDispPanel,  setShowDispPanel]  = useState(false)
  const [showSchedPanel, setShowSchedPanel] = useState(false)
  const [acceptTarget,   setAcceptTarget]   = useState(null)
  const [rejectTarget,   setRejectTarget]   = useState(null)

  function loadDispatches() {
    setLoadingD(true)
    setErrorD(null)
    getAidDispatches({ direction: 'outgoing', level: 'shelter_civilian' })
      .then(res => setDispatches(res.data ?? []))
      .catch(err => setErrorD(err.message ?? 'Failed to load dispatches.'))
      .finally(() => setLoadingD(false))
  }

  function loadSchedules() {
    setLoadingS(true)
    setErrorS(null)
    getAidSchedules({ level: 'shelter_civilian' })
      .then(res => setSchedules(res.data ?? []))
      .catch(err => setErrorS(err.message ?? 'Failed to load schedules.'))
      .finally(() => setLoadingS(false))
  }

  useEffect(() => {
    loadDispatches()
    loadSchedules()
  }, [])

  function handleDispatchUpdated(updated) {
    setDispatches(prev => prev.map(d => d.id === updated.id ? updated : d))
  }

  const pendingCount  = dispatches.filter(d => d.status === 'pending').length
  const acceptedCount = dispatches.filter(d => d.status === 'accepted').length
  const rejectedCount = dispatches.filter(d => d.status === 'rejected').length

  const dispatchColumns = [
    {
      key: 'civilian',
      header: 'Civilian',
      render: (_, d) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-warning-surface flex items-center justify-center text-xs font-bold text-warning shrink-0">
            {(d.civilian?.name ?? '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-text">{d.civilian?.name ?? '—'}</p>
            <p className="text-xs text-text-muted">{d.civilian?.phone ?? d.civilian?.email ?? ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Aid Type',
      render: (_, d) => (
        <span className="text-sm text-text">{d.category?.name ?? '—'}</span>
      ),
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
      key: 'dispatched_at',
      header: 'Date Sent',
      className: 'hidden md:table-cell',
      render: (_, d) => (
        <span className="text-sm text-text-muted">{fmt(d.dispatched_at ?? d.created_at)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, d) => (
        <div>
          <Badge variant={STATUS_BADGE[d.status]}>{STATUS_LABEL[d.status]}</Badge>
          {d.status === 'pending' && d.expected_arrival_date && (
            <p className="text-xs text-text-muted mt-0.5">Expected {fmt(d.expected_arrival_date)}</p>
          )}
          {d.status === 'accepted' && (
            <p className="text-xs text-success mt-0.5">Received {fmt(d.received_at)}</p>
          )}
          {d.status === 'rejected' && d.rejection_reason && (
            <p className="text-xs text-danger mt-0.5 max-w-32 truncate">{d.rejection_reason}</p>
          )}
        </div>
      ),
    },
    {
      key: 'id',
      header: '',
      render: (_, d) => d.status === 'pending' ? (
        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" onClick={() => setAcceptTarget(d)}>
            <Check size={13} /> Confirm
          </Button>
          <Button size="sm" variant="danger" onClick={() => setRejectTarget(d)}>
            <X size={13} />
          </Button>
        </div>
      ) : null,
    },
  ]

  return (
    <ShelterLayout
      title="Aid to Civilians"
      subtitle="Send supplies and manage recurring aid for shelter civilians"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => activeTab === 'dispatches' ? loadDispatches() : loadSchedules()}>
            <RefreshCw size={14} />
          </Button>
          <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1">
            {[
              { key: 'dispatches', label: 'Dispatches to Civilians' },
              { key: 'schedules',  label: 'Schedules'               },
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
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending"  value={pendingCount}  icon={Clock}        iconColor="text-warning" iconBg="bg-warning-surface" />
        <StatCard label="Accepted" value={acceptedCount} icon={CheckCircle2} iconColor="text-success" iconBg="bg-success-surface" />
        <StatCard label="Rejected" value={rejectedCount} icon={XCircle}      iconColor="text-danger"  iconBg="bg-danger-surface"  />
      </div>

      {activeTab === 'dispatches' && (
        <>
          {errorD && (
            <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
              <AlertCircle size={15} className="shrink-0 mt-0.5" /> {errorD}
            </div>
          )}

          <div className="flex items-center justify-end mb-5">
            <Button onClick={() => setShowDispPanel(true)}>
              <Plus size={15} /> Send Aid to Civilian
            </Button>
          </div>

          <Table
            columns={dispatchColumns}
            data={dispatches}
            loading={loadingD}
            emptyNode={DISPATCH_EMPTY_NODE}
            pageSize={10}
          />
        </>
      )}

      {activeTab === 'schedules' && (
        <>
          {errorS && (
            <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
              <AlertCircle size={15} className="shrink-0 mt-0.5" /> {errorS}
            </div>
          )}

          <div className="flex items-center justify-end mb-5">
            <Button onClick={() => setShowSchedPanel(true)}>
              <Plus size={15} /> New Schedule
            </Button>
          </div>

          {loadingS ? (
            <div className="flex items-center justify-center bg-background border border-border rounded-2xl" style={{ minHeight: 'clamp(280px, 50vh, 480px)' }}>
              <Loader size="lg" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center bg-background border border-border rounded-2xl" style={{ minHeight: 'clamp(280px, 50vh, 480px)' }}>
              {SCHEDULE_EMPTY_NODE}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {schedules.map(s => (
                <ScheduleCard
                  key={s.id}
                  schedule={s}
                  onToggle={updated => setSchedules(prev => prev.map(x => x.id === updated.id ? updated : x))}
                  onDelete={id => setSchedules(prev => prev.filter(x => x.id !== id))}
                  onDispatched={id => setSchedules(prev => prev.map(x => x.id === id ? { ...x, last_sent_at: new Date().toISOString() } : x))}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showDispPanel && (
        <SendDispatchPanel
          onClose={() => setShowDispPanel(false)}
          onCreated={d => setDispatches(prev => [d, ...prev])}
          shelterId={shelterId}
        />
      )}

      {showSchedPanel && (
        <NewSchedulePanel
          onClose={() => setShowSchedPanel(false)}
          onCreated={s => setSchedules(prev => [s, ...prev])}
          shelterId={shelterId}
        />
      )}

      {acceptTarget && (
        <AcceptDispatchPanel
          dispatch={acceptTarget}
          onClose={() => setAcceptTarget(null)}
          onAccepted={updated => { handleDispatchUpdated(updated); setAcceptTarget(null) }}
        />
      )}

      {rejectTarget && (
        <RejectDispatchPanel
          dispatch={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={updated => { handleDispatchUpdated(updated); setRejectTarget(null) }}
        />
      )}
    </ShelterLayout>
  )
}
