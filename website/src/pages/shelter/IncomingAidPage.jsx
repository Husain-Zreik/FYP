import { useEffect, useState } from 'react'
import {
  RefreshCw, Clock, CheckCircle2, XCircle, Package, CalendarClock,
  Check, X, AlertCircle,
} from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import { Button, Badge, SlidePanel, Select, Table, StatCard } from '../../components/ui'
import { fmt } from '../../utils/format'
import { getAidDispatches, acceptAidDispatch, rejectAidDispatch } from '../../api/aidDispatches'
import { useUiStore } from '../../store/uiStore'

const STATUS_BADGE  = { pending: 'warning', accepted: 'success', rejected: 'danger' }
const STATUS_LABEL  = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' }
const STATUS_OPTS   = [
  { value: '',         label: 'All statuses' },
  { value: 'pending',  label: 'Pending'      },
  { value: 'accepted', label: 'Accepted'     },
  { value: 'rejected', label: 'Rejected'     },
]

function AcceptPanel({ dispatch, onClose, onAccepted }) {
  const category  = dispatch.category ?? {}
  const today     = new Date().toISOString().split('T')[0]

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
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} disabled={!receivedAt} onClick={handleSave}>
            Confirm Receipt
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
      </div>
    </SlidePanel>
  )
}

function DeclinePanel({ dispatch, onClose, onDeclined }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

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
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} variant="danger" onClick={handleSave}>
            Decline
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

const EMPTY_NODE = (
  <>
    <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-3">
      <Package size={20} className="text-text-subtle" />
    </div>
    <p className="text-sm font-medium text-text">No aid dispatches yet.</p>
    <p className="text-xs text-text-muted">Aid sent to your shelter will appear here.</p>
  </>
)

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

  const columns = [
    {
      key: 'category',
      header: 'Aid Type',
      render: (_, d) => (
        <div>
          <p className="text-sm font-medium text-text">{d.category?.name ?? '—'}</p>
          {d.aid_schedule_id && (
            <span className="text-[10px] text-text-subtle flex items-center gap-1 mt-0.5">
              <CalendarClock size={10} /> Recurring
            </span>
          )}
          {d.aid_request_id && (
            <span className="text-[10px] text-text-subtle flex items-center gap-1 mt-0.5">
              <Package size={10} /> Fulfills your aid request
            </span>
          )}
        </div>
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
      key: 'dispatcher_name',
      header: 'Sent By',
      className: 'hidden md:table-cell',
      render: (_, d) => (
        <span className="text-sm text-text-muted">{d.dispatcher_name ?? '—'}</span>
      ),
    },
    {
      key: 'dispatched_at',
      header: 'Dispatched',
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
          {d.status === 'accepted' && d.received_at && (
            <p className="text-xs text-success mt-0.5">Received {fmt(d.received_at)}</p>
          )}
          {d.status === 'rejected' && d.rejection_reason && (
            <p className="text-xs text-danger mt-0.5 max-w-40 truncate">{d.rejection_reason}</p>
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
            <Check size={13} /> Accept
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeclineTarget(d)}>
            <X size={13} />
          </Button>
        </div>
      ) : null,
    },
  ]

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
        <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTS} className="w-44" />
      </div>

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        emptyNode={EMPTY_NODE}
        pageSize={10}
      />

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
