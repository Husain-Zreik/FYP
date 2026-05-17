import { useEffect, useState } from 'react'
import {
  RefreshCw, Plus, Clock, CheckCircle2, XCircle, Package,
  Send, CalendarClock, AlertCircle, Check, X,
} from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import { Button, Badge, Loader, SlidePanel, Select } from '../../components/ui'
import { getAidDispatches, createAidDispatch, acceptAidDispatch, rejectAidDispatch } from '../../api/aidDispatches'
import { getAidSchedules, createAidSchedule, updateAidSchedule, deleteAidSchedule, dispatchSchedule } from '../../api/aidSchedules'
import { getAidCategories } from '../../api/aidCategories'
import { useAuthStore } from '../../store/authStore'
import client from '../../api/client'

const STATUS_BADGE  = { pending: 'warning', accepted: 'success', rejected: 'danger' }
const FREQ_OPTS = [
  { value: 'weekly',    label: 'Weekly'    },
  { value: 'biweekly',  label: 'Bi-weekly' },
  { value: 'monthly',   label: 'Monthly'   },
  { value: 'quarterly', label: 'Quarterly' },
]

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

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function CivilianAvatar({ name }) {
  const initial = (name ?? '?').charAt(0).toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-warning-surface flex items-center justify-center text-xs font-bold text-warning shrink-0">
      {initial}
    </div>
  )
}

function SendDispatchPanel({ onClose, onCreated, shelterId }) {
  const [civilians,  setCivilians]  = useState([])
  const [categories, setCategories] = useState([])
  const [civilianId, setCivilianId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [quantity,   setQuantity]   = useState('')
  const [notes,      setNotes]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    Promise.all([
      client.get('/users', { params: { role: 'civilian' } }),
      getAidCategories(),
    ])
      .then(([u, c]) => {
        const allCivilians = u.data ?? []
        setCivilians(shelterId ? allCivilians.filter(x => x.shelter_id === shelterId) : allCivilians)
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
        civilian_id:     Number(civilianId),
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
      title="Send Aid to Civilian"
      subtitle="Dispatch supplies to a civilian in your shelter"
      onClose={onClose}
      width="max-w-md"
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
          <label className="block text-sm font-semibold text-text mb-1.5">Notes <span className="text-text-subtle font-normal">(optional)</span></label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all resize-none"
          />
        </div>
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
  const [startDate,  setStartDate]  = useState('')
  const [endDate,    setEndDate]    = useState('')
  const [notes,      setNotes]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    Promise.all([
      client.get('/users', { params: { role: 'civilian' } }),
      getAidCategories(),
    ])
      .then(([u, c]) => {
        const allCivilians = u.data ?? []
        setCivilians(shelterId ? allCivilians.filter(x => x.shelter_id === shelterId) : allCivilians)
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
        start_date: startDate,
        end_date:   endDate || null,
        notes:      notes   || null,
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
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background focus:outline-none focus:border-secondary hover:border-border-2 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">End Date <span className="text-text-subtle font-normal">(optional)</span></label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
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
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            loading={saving}
            disabled={!civilianId || !categoryId || !quantity || !frequency || !startDate}
            onClick={handleSave}
          >
            Create Schedule
          </Button>
        </div>
      </div>
    </SlidePanel>
  )
}

function DispatchCard({ dispatch, onMarkAccepted, onMarkRejected }) {
  const category = dispatch.aid_category ?? {}
  const civilian = dispatch.civilian ?? dispatch.recipient ?? {}

  return (
    <div className="bg-background border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <CivilianAvatar name={civilian.name} />
          <div className="min-w-0">
            <p className="font-semibold text-text truncate">{civilian.name ?? '—'}</p>
            <p className="text-xs text-text-muted truncate">{civilian.phone ?? civilian.email ?? ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={STATUS_BADGE[dispatch.status] ?? 'muted'}>{dispatch.status}</Badge>
          <p className="text-xs text-text-muted">{formatDate(dispatch.created_at)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-1">
        <p className="text-sm text-text">{category.name ?? '—'}</p>
        <p className="text-sm text-text-muted">{dispatch.quantity} {category.unit ?? 'units'}</p>
      </div>

      {dispatch.notes && (
        <p className="text-sm text-text-muted italic">{dispatch.notes}</p>
      )}

      {dispatch.status === 'accepted' && (
        <p className="text-xs text-success mt-1">Received: {formatDate(dispatch.received_at)}</p>
      )}

      {dispatch.status === 'rejected' && dispatch.rejection_reason && (
        <p className="text-xs text-danger mt-1">{dispatch.rejection_reason}</p>
      )}

      {dispatch.status === 'pending' && (
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={() => onMarkAccepted(dispatch)}>
            <Check size={13} /> Mark Accepted
          </Button>
          <Button size="sm" variant="danger" onClick={() => onMarkRejected(dispatch)}>
            <X size={13} /> Reject
          </Button>
        </div>
      )}
    </div>
  )
}

function AcceptDispatchPanel({ dispatch, onClose, onAccepted }) {
  const category = dispatch.aid_category ?? {}
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
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} disabled={!receivedAt} onClick={handleSave}>Confirm Receipt</Button>
        </div>
      </div>
    </SlidePanel>
  )
}

function RejectDispatchPanel({ dispatch, onClose, onRejected }) {
  const [reason,  setReason]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)

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
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} variant="danger" onClick={handleSave}>Reject</Button>
        </div>
      </div>
    </SlidePanel>
  )
}

function ScheduleCard({ schedule, onToggle, onDelete, onDispatched }) {
  const category = schedule.aid_category ?? {}
  const civilian = schedule.civilian ?? schedule.recipient ?? {}
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
        <CivilianAvatar name={civilian.name} />
        <p className="text-sm text-text-muted">{civilian.name ?? '—'}</p>
      </div>

      <p className="text-sm text-text">
        {schedule.quantity} {category.unit ?? 'units'} per {freqLabel?.toLowerCase() ?? schedule.frequency}
      </p>

      <p className="text-xs text-text-subtle mt-1">
        Last sent: {schedule.last_sent_at ? formatDate(schedule.last_sent_at) : 'Never sent'}
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

export default function AidToCiviliansPage() {
  const user     = useAuthStore((s) => s.user)
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

  function handleRefresh() {
    if (activeTab === 'dispatches') loadDispatches()
    else loadSchedules()
  }

  function handleDispatchUpdated(updated) {
    setDispatches(prev => prev.map(d => d.id === updated.id ? updated : d))
  }

  const pendingCount  = dispatches.filter(d => d.status === 'pending').length
  const acceptedCount = dispatches.filter(d => d.status === 'accepted').length
  const rejectedCount = dispatches.filter(d => d.status === 'rejected').length

  return (
    <ShelterLayout
      title="Aid to Civilians"
      subtitle="Send supplies and manage recurring aid for shelter civilians"
      actions={
        <Button variant="secondary" size="sm" onClick={handleRefresh}>
          <RefreshCw size={14} /> Refresh
        </Button>
      }
    >
      <div className="flex border border-border rounded-xl overflow-hidden mb-6">
        {[{ key: 'dispatches', label: 'Dispatches to Civilians' }, { key: 'schedules', label: 'Schedules' }].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface text-text-muted hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dispatches' && (
        <>
          {errorD && (
            <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
              <AlertCircle size={15} className="shrink-0 mt-0.5" /> {errorD}
            </div>
          )}

          <div className="flex items-center justify-between mb-5">
            <div />
            <Button onClick={() => setShowDispPanel(true)}>
              <Plus size={15} /> Send Aid to Civilian
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard label="Pending"  value={pendingCount}  icon={Clock}        iconColor="text-warning" iconBg="bg-warning-surface" />
            <StatCard label="Accepted" value={acceptedCount} icon={CheckCircle2} iconColor="text-success" iconBg="bg-success-surface" />
            <StatCard label="Rejected" value={rejectedCount} icon={XCircle}      iconColor="text-danger"  iconBg="bg-danger-surface"  />
          </div>

          {loadingD ? (
            <div className="flex items-center justify-center bg-background border border-border rounded-2xl" style={{ minHeight: 'clamp(280px, 50vh, 480px)' }}>
              <Loader size="lg" />
            </div>
          ) : dispatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center bg-background border border-border rounded-2xl" style={{ minHeight: 'clamp(280px, 50vh, 480px)' }}>
              <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-3">
                <Package size={20} className="text-text-subtle" />
              </div>
              <p className="text-sm font-medium text-text mb-1">No dispatches sent to civilians yet.</p>
              <p className="text-xs text-text-muted">Use &ldquo;Send Aid to Civilian&rdquo; to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dispatches.map(d => (
                <DispatchCard
                  key={d.id}
                  dispatch={d}
                  onMarkAccepted={setAcceptTarget}
                  onMarkRejected={setRejectTarget}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'schedules' && (
        <>
          {errorS && (
            <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
              <AlertCircle size={15} className="shrink-0 mt-0.5" /> {errorS}
            </div>
          )}

          <div className="flex items-center justify-between mb-5">
            <div />
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
              <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-3">
                <CalendarClock size={20} className="text-text-subtle" />
              </div>
              <p className="text-sm font-medium text-text mb-1">No schedules set up yet.</p>
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
