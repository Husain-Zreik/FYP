import { useEffect, useState } from 'react'
import {
  RefreshCw, Clock, CheckCircle2, XCircle, Package, CalendarClock,
  Check, X, AlertCircle,
} from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import { Button, Badge, Loader, SlidePanel, Select } from '../../components/ui'
import { getAidDispatches, acceptAidDispatch, rejectAidDispatch } from '../../api/aidDispatches'
import { useUiStore } from '../../store/uiStore'

const STATUS_BADGE = { pending: 'warning', accepted: 'success', rejected: 'danger' }
const STATUS_OPTS  = [
  { value: '',         label: 'All statuses' },
  { value: 'pending',  label: 'Pending'      },
  { value: 'accepted', label: 'Accepted'     },
  { value: 'rejected', label: 'Rejected'     },
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

function AcceptPanel({ dispatch, onClose, onAccepted }) {
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
      setError(err.message ?? 'Failed to confirm receipt.')
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
          <label className="block text-sm font-semibold text-text mb-1.5">
            Date Received
            <span className="block text-xs text-text-subtle font-normal mt-0.5">
              When did your shelter physically receive this aid?
            </span>
          </label>
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
          <Button loading={saving} disabled={!receivedAt} onClick={handleSave}>
            Confirm Receipt
          </Button>
        </div>
      </div>
    </SlidePanel>
  )
}

function DeclinePanel({ dispatch, onClose, onDeclined }) {
  const [reason,  setReason]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const res = await rejectAidDispatch(dispatch.id, { rejection_reason: reason || null })
      onDeclined(res.data)
      onClose()
    } catch (err) {
      setError(err.message ?? 'Failed to decline delivery.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SlidePanel
      title="Decline Aid Delivery"
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
          <Button loading={saving} variant="danger" onClick={handleSave}>
            Decline
          </Button>
        </div>
      </div>
    </SlidePanel>
  )
}

function DispatchCard({ dispatch, onAccept, onDecline }) {
  const category = dispatch.aid_category ?? {}

  return (
    <div className="bg-background border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-semibold text-text">{category.name ?? '—'}</p>
          <p className="text-secondary font-medium text-sm">{dispatch.quantity} {category.unit ?? 'units'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={STATUS_BADGE[dispatch.status] ?? 'muted'}>{dispatch.status}</Badge>
          <p className="text-xs text-text-muted">{formatDate(dispatch.created_at)}</p>
        </div>
      </div>

      {dispatch.dispatcher && (
        <p className="text-xs text-text-muted mb-1">Dispatched by {dispatch.dispatcher.name ?? dispatch.dispatcher_name ?? '—'}</p>
      )}

      {dispatch.notes && (
        <p className="text-sm text-text-muted italic mb-1">{dispatch.notes}</p>
      )}

      {dispatch.aid_schedule_id && (
        <div className="flex items-center gap-1 text-xs text-text-subtle mb-1">
          <CalendarClock size={12} />
          Part of recurring schedule
        </div>
      )}

      {dispatch.status === 'accepted' && (
        <p className="text-xs text-success">Received: {formatDate(dispatch.received_at)}</p>
      )}

      {dispatch.status === 'rejected' && dispatch.rejection_reason && (
        <p className="text-xs text-danger">{dispatch.rejection_reason}</p>
      )}

      {dispatch.status === 'pending' && (
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={() => onAccept(dispatch)}>
            <Check size={13} /> Accept & Confirm Receipt
          </Button>
          <Button size="sm" variant="danger" onClick={() => onDecline(dispatch)}>
            <X size={13} /> Decline
          </Button>
        </div>
      )}
    </div>
  )
}

export default function IncomingAidPage() {
  const setShelterPendingIncomingAidCount = useUiStore((s) => s.setShelterPendingIncomingAidCount)

  const [dispatches,    setDispatches]    = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [statusFilter,  setStatusFilter]  = useState('')
  const [acceptTarget,  setAcceptTarget]  = useState(null)
  const [declineTarget, setDeclineTarget] = useState(null)

  function loadDispatches() {
    setLoading(true)
    setError(null)
    getAidDispatches({ direction: 'incoming' })
      .then(res => {
        const data = res.data ?? []
        setDispatches(data)
        setShelterPendingIncomingAidCount(data.filter(d => d.status === 'pending').length)
      })
      .catch(err => setError(err.message ?? 'Failed to load incoming aid.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDispatches()
  }, [setShelterPendingIncomingAidCount])

  function handleUpdated(updated) {
    setDispatches(prev => {
      const next = prev.map(d => d.id === updated.id ? updated : d)
      setShelterPendingIncomingAidCount(next.filter(d => d.status === 'pending').length)
      return next
    })
  }

  const pendingCount  = dispatches.filter(d => d.status === 'pending').length
  const acceptedCount = dispatches.filter(d => d.status === 'accepted').length
  const rejectedCount = dispatches.filter(d => d.status === 'rejected').length

  const filtered = dispatches.filter(d => !statusFilter || d.status === statusFilter)

  return (
    <ShelterLayout
      title="Incoming Aid"
      subtitle="Aid dispatched to your shelter by the government"
      actions={
        <Button variant="secondary" size="sm" onClick={loadDispatches}>
          <RefreshCw size={14} /> Refresh
        </Button>
      }
    >
      {error && (
        <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending Acceptance" value={pendingCount}  icon={Clock}        iconColor="text-warning" iconBg="bg-warning-surface" />
        <StatCard label="Accepted"           value={acceptedCount} icon={CheckCircle2} iconColor="text-success" iconBg="bg-success-surface" />
        <StatCard label="Rejected"           value={rejectedCount} icon={XCircle}      iconColor="text-danger"  iconBg="bg-danger-surface"  />
      </div>

      <div className="mb-5">
        <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTS} className="w-40" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center bg-background border border-border rounded-2xl" style={{ minHeight: 'clamp(280px, 50vh, 480px)' }}>
          <Loader size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-background border border-border rounded-2xl" style={{ minHeight: 'clamp(280px, 50vh, 480px)' }}>
          <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-3">
            <Package size={20} className="text-text-subtle" />
          </div>
          <p className="text-sm font-medium text-text mb-1">No aid has been dispatched to your shelter yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <DispatchCard
              key={d.id}
              dispatch={d}
              onAccept={setAcceptTarget}
              onDecline={setDeclineTarget}
            />
          ))}
        </div>
      )}

      {acceptTarget && (
        <AcceptPanel
          dispatch={acceptTarget}
          onClose={() => setAcceptTarget(null)}
          onAccepted={updated => { handleUpdated(updated); setAcceptTarget(null) }}
        />
      )}

      {declineTarget && (
        <DeclinePanel
          dispatch={declineTarget}
          onClose={() => setDeclineTarget(null)}
          onDeclined={updated => { handleUpdated(updated); setDeclineTarget(null) }}
        />
      )}
    </ShelterLayout>
  )
}
