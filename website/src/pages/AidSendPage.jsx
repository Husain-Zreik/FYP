import { useEffect, useState } from 'react'
import {
  RefreshCw, Plus, Clock, CheckCircle2, XCircle, Building2, Package,
  Send, CalendarClock, AlertCircle,
} from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import { Button, Badge, Loader, SlidePanel, Select, Input } from '../components/ui'
import { getAidDispatches, createAidDispatch } from '../api/aidDispatches'
import { getAidSchedules, createAidSchedule, updateAidSchedule, deleteAidSchedule, dispatchSchedule } from '../api/aidSchedules'
import { getShelters } from '../api/shelters'
import { getAidCategories } from '../api/aidCategories'

const STATUS_BADGE  = { pending: 'warning', accepted: 'success', rejected: 'danger' }
const URGENCY_BADGE = { critical: 'danger', high: 'warning', medium: 'info', low: 'muted' }
const FREQ_OPTS = [
  { value: 'weekly',     label: 'Weekly'     },
  { value: 'biweekly',   label: 'Bi-weekly'  },
  { value: 'monthly',    label: 'Monthly'    },
  { value: 'quarterly',  label: 'Quarterly'  },
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

function SendDispatchPanel({ onClose, onCreated }) {
  const [shelters,    setShelters]    = useState([])
  const [categories,  setCategories]  = useState([])
  const [shelterId,   setShelterId]   = useState('')
  const [categoryId,  setCategoryId]  = useState('')
  const [quantity,    setQuantity]    = useState('')
  const [notes,       setNotes]       = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState(null)

  useEffect(() => {
    Promise.all([getShelters(), getAidCategories()])
      .then(([s, c]) => {
        setShelters(s.data ?? [])
        setCategories(c.data ?? [])
      })
      .catch(() => {})
  }, [])

  const shelterOpts  = [{ value: '', label: '— Select shelter —' }, ...shelters.map(s => ({ value: String(s.id), label: s.name }))]
  const categoryOpts = [{ value: '', label: '— Select category —' }, ...categories.map(c => ({ value: String(c.id), label: c.name }))]
  const selectedCat  = categories.find(c => String(c.id) === categoryId)

  async function handleSave() {
    setError(null)
    setSaving(true)
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
      subtitle="Dispatch aid directly without a prior request"
      onClose={onClose}
      width="max-w-md"
    >
      <div className="space-y-4">
        {error && (
          <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}
        <Select label="Shelter" value={shelterId} onChange={setShelterId} options={shelterOpts} />
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
            disabled={!shelterId || !categoryId || !quantity}
            onClick={handleSave}
          >
            Send Aid
          </Button>
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
      .then(([s, c]) => {
        setShelters(s.data ?? [])
        setCategories(c.data ?? [])
      })
      .catch(() => {})
  }, [])

  const shelterOpts  = [{ value: '', label: '— Select shelter —' }, ...shelters.map(s => ({ value: String(s.id), label: s.name }))]
  const categoryOpts = [{ value: '', label: '— Select category —' }, ...categories.map(c => ({ value: String(c.id), label: c.name }))]
  const freqOpts     = [{ value: '', label: '— Select frequency —' }, ...FREQ_OPTS]

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const res = await createAidSchedule({
        shelter_id:      Number(shelterId),
        aid_category_id: Number(categoryId),
        quantity:        Number(quantity),
        frequency,
        start_date: startDate,
        end_date:   endDate   || null,
        notes:      notes     || null,
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
      subtitle="Set up recurring aid deliveries to a shelter"
      onClose={onClose}
      width="max-w-md"
    >
      <div className="space-y-4">
        {error && (
          <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}
        <Select label="Shelter" value={shelterId} onChange={setShelterId} options={shelterOpts} />
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
            disabled={!shelterId || !categoryId || !quantity || !frequency || !startDate}
            onClick={handleSave}
          >
            Create Schedule
          </Button>
        </div>
      </div>
    </SlidePanel>
  )
}

function DispatchCard({ dispatch }) {
  const shelter  = dispatch.shelter ?? {}
  const category = dispatch.aid_category ?? {}

  return (
    <div className="bg-background border border-border rounded-2xl p-5 hover:border-border-2 transition-all">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={15} className="text-text-muted shrink-0" />
          <p className="font-semibold text-text truncate">{shelter.name ?? '—'}</p>
          {shelter.governorate && (
            <p className="text-xs text-text-muted shrink-0">{shelter.governorate}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={STATUS_BADGE[dispatch.status] ?? 'muted'}>{dispatch.status}</Badge>
          <p className="text-xs text-text-muted">{formatDate(dispatch.created_at)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Package size={13} className="text-text-muted" />
        <p className="text-sm text-text">{category.name ?? '—'}</p>
        <p className="text-sm text-text-muted">{dispatch.quantity} {category.unit ?? 'units'}</p>
        {dispatch.urgency && (
          <Badge variant={URGENCY_BADGE[dispatch.urgency] ?? 'muted'}>{dispatch.urgency}</Badge>
        )}
      </div>

      {dispatch.notes && (
        <p className="text-sm text-text-muted italic mt-1">{dispatch.notes}</p>
      )}

      {dispatch.status === 'accepted' && (
        <p className="text-xs text-success mt-2">
          Received: {formatDate(dispatch.received_at)}
          {dispatch.responder?.name ? ` · ${dispatch.responder.name}` : ''}
        </p>
      )}

      {dispatch.status === 'rejected' && dispatch.rejection_reason && (
        <p className="text-xs text-danger mt-2">{dispatch.rejection_reason}</p>
      )}
    </div>
  )
}

function ScheduleCard({ schedule, onToggle, onDelete, onDispatched }) {
  const category = schedule.aid_category ?? {}
  const shelter  = schedule.shelter ?? {}
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

      <div className="flex items-center gap-1.5 mb-2">
        <Building2 size={13} className="text-text-muted" />
        <p className="text-sm text-text-muted">{shelter.name ?? '—'}</p>
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

export default function AidSendPage() {
  const [activeTab,       setActiveTab]       = useState('dispatches')
  const [dispatches,      setDispatches]      = useState([])
  const [schedules,       setSchedules]       = useState([])
  const [loadingD,        setLoadingD]        = useState(true)
  const [loadingS,        setLoadingS]        = useState(true)
  const [errorD,          setErrorD]          = useState(null)
  const [errorS,          setErrorS]          = useState(null)
  const [showDispPanel,   setShowDispPanel]   = useState(false)
  const [showSchedPanel,  setShowSchedPanel]  = useState(false)

  function loadDispatches() {
    setLoadingD(true)
    setErrorD(null)
    getAidDispatches({ direction: 'outgoing' })
      .then(res => setDispatches(res.data ?? []))
      .catch(err => setErrorD(err.message ?? 'Failed to load dispatches.'))
      .finally(() => setLoadingD(false))
  }

  function loadSchedules() {
    setLoadingS(true)
    setErrorS(null)
    getAidSchedules({ level: 'government_shelter' })
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

  const pendingDispatches  = dispatches.filter(d => d.status === 'pending').length
  const acceptedDispatches = dispatches.filter(d => d.status === 'accepted').length
  const rejectedDispatches = dispatches.filter(d => d.status === 'rejected').length

  return (
    <DashboardLayout
      title="Send Aid"
      subtitle="Dispatch aid to shelters or set up recurring schedules"
      actions={
        <Button variant="secondary" size="sm" onClick={handleRefresh}>
          <RefreshCw size={14} /> Refresh
        </Button>
      }
    >
      <div className="flex border border-border rounded-xl overflow-hidden mb-6">
        {[{ key: 'dispatches', label: 'Direct Dispatches' }, { key: 'schedules', label: 'Schedules' }].map(tab => (
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
              <Plus size={15} /> Send Aid to Shelter
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard label="Pending"  value={pendingDispatches}  icon={Clock}        iconColor="text-warning" iconBg="bg-warning-surface" />
            <StatCard label="Accepted" value={acceptedDispatches} icon={CheckCircle2} iconColor="text-success" iconBg="bg-success-surface" />
            <StatCard label="Rejected" value={rejectedDispatches} icon={XCircle}      iconColor="text-danger"  iconBg="bg-danger-surface"  />
          </div>

          {loadingD ? (
            <div className="flex items-center justify-center bg-background border border-border rounded-2xl" style={{ minHeight: 'clamp(280px, 50vh, 480px)' }}>
              <Loader size="lg" />
            </div>
          ) : dispatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center bg-background border border-border rounded-2xl" style={{ minHeight: 'clamp(280px, 50vh, 480px)' }}>
              <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-3">
                <Send size={20} className="text-text-subtle" />
              </div>
              <p className="text-sm font-medium text-text mb-1">No dispatches sent yet.</p>
              <p className="text-xs text-text-muted">Use &ldquo;Send Aid to Shelter&rdquo; to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dispatches.map(d => <DispatchCard key={d.id} dispatch={d} />)}
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
