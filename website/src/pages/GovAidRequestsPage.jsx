import { useEffect, useState } from 'react'
import { RefreshCw, Clock, CheckCircle, XCircle, Package, AlertCircle, Check, X, Pencil, Send } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import { Table, Button, Badge, Loader, SlidePanel, StatCard, FilterBar } from '../components/ui'
import { fmt } from '../utils/format'
import { getAidRequests, reviewAidRequest } from '../api/aidRequests'
import { createAidDispatch } from '../api/aidDispatches'
import { getAidCategories } from '../api/aidCategories'
import { useUiStore } from '../store/uiStore'

const STATUS_BADGE  = { pending: 'muted', approved: 'success', partially_approved: 'warning', rejected: 'danger', fulfilled: 'success' }
const STATUS_LABEL  = { pending: 'Pending', approved: 'Approved', partially_approved: 'Partially Approved', rejected: 'Rejected', fulfilled: 'Fulfilled' }
const URGENCY_BADGE = { critical: 'danger', high: 'warning', medium: 'info', low: 'muted' }
const URGENCY_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }

const URGENCY_OPTS = [
  { value: '',         label: 'All urgency' },
  { value: 'critical', label: 'Critical'    },
  { value: 'high',     label: 'High'        },
  { value: 'medium',   label: 'Medium'      },
  { value: 'low',      label: 'Low'         },
]

const STATUS_OPTS = [
  { value: '',                   label: 'All statuses'       },
  { value: 'pending',            label: 'Pending'            },
  { value: 'approved',           label: 'Approved'           },
  { value: 'partially_approved', label: 'Partially Approved' },
  { value: 'rejected',           label: 'Rejected'           },
  { value: 'fulfilled',          label: 'Fulfilled'          },
]

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-text-muted shrink-0">{label}</span>
      <span className="text-xs font-medium text-text text-right">{value ?? '—'}</span>
    </div>
  )
}

function ReviewPanel({ req, onClose, onReviewed }) {
  const [qty,    setQty]    = useState(String(req.quantity_requested ?? ''))
  const [notes,  setNotes]  = useState('')
  const [saving, setSaving] = useState(null)
  const [error,  setError]  = useState(null)

  const isPending = req.status === 'pending'
  const unit      = req.category?.unit ?? ''

  async function submit(status) {
    setError(null)
    setSaving(status)
    try {
      const payload = {
        status,
        government_notes:  notes || null,
        quantity_approved: status === 'rejected' ? null : Number(qty),
      }
      const res = await reviewAidRequest(req.id, payload)
      onReviewed(res.data)
      onClose()
    } catch (err) {
      setError(err.message ?? 'Failed to submit review.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <SlidePanel
      title={req.shelter?.name ?? 'Request'}
      subtitle={`Submitted ${fmt(req.created_at)}`}
      onClose={onClose}
      width="max-w-lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <div className="bg-surface rounded-2xl p-4 space-y-3">
          <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider">Request Details</p>
          <Row label="Category"  value={req.category?.name} />
          <Row label="Requested" value={`${req.quantity_requested} ${unit}`} />
          <Row label="Urgency"   value={<Badge variant={URGENCY_BADGE[req.urgency] ?? 'muted'}>{req.urgency}</Badge>} />
          <Row label="Status"    value={<Badge variant={STATUS_BADGE[req.status] ?? 'muted'}>{STATUS_LABEL[req.status] ?? req.status}</Badge>} />
          {req.reason && (
            <div className="pt-1">
              <p className="text-xs text-text-muted mb-1">Reason</p>
              <p className="text-sm text-text leading-relaxed">{req.reason}</p>
            </div>
          )}
        </div>

        {req.status !== 'pending' && (
          <div className="bg-surface rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider">Review Details</p>
            <Row label="Reviewed by"  value={req.reviewed_by_name} />
            <Row label="Reviewed on"  value={fmt(req.reviewed_at)} />
            {req.quantity_approved != null && (
              <Row label="Approved qty" value={`${req.quantity_approved} ${unit}`} />
            )}
            {req.quantity_approved != null && (
              <Row label="Dispatched" value={`${req.quantity_dispatched ?? 0} of ${req.quantity_approved} ${unit}`} />
            )}
            {req.government_notes && (
              <div className="pt-1">
                <p className="text-xs text-text-muted mb-1">Notes</p>
                <p className="text-sm text-text leading-relaxed">{req.government_notes}</p>
              </div>
            )}
          </div>
        )}

        {isPending && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">
                Quantity to approve {unit && <span className="text-text-subtle font-normal">({unit})</span>}
              </label>
              <input
                type="number"
                value={qty}
                min={1}
                onChange={e => setQty(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Response notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes for the shelter..."
                rows={3}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all resize-none"
              />
            </div>

            <div className="space-y-2 pt-1">
              <button
                disabled={!!saving}
                onClick={() => submit('approved')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-success-surface text-success hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {saving === 'approved' ? <Loader size="sm" /> : <Check size={15} />}
                Approve
              </button>
              <button
                disabled={!!saving}
                onClick={() => submit('partially_approved')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-warning-surface text-warning hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {saving === 'partially_approved' ? <Loader size="sm" /> : <Pencil size={15} />}
                Partially Approve
              </button>
              <button
                disabled={!!saving}
                onClick={() => submit('rejected')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-danger-surface text-danger hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {saving === 'rejected' ? <Loader size="sm" /> : <X size={15} />}
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </SlidePanel>
  )
}

function DispatchRequestPanel({ req, onClose, onDispatched }) {
  const unit      = req.category?.unit ?? ''
  const remaining = (req.quantity_approved ?? 0) - (req.quantity_dispatched ?? 0)

  const [quantity, setQuantity] = useState(String(remaining))
  const [expectedArrival, setExpectedArrival] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const res = await createAidDispatch({
        shelter_id: req.shelter_id,
        aid_category_id: req.aid_category_id,
        aid_request_id: req.id,
        quantity: Number(quantity),
        notes: notes || null,
        expected_arrival_date: expectedArrival || null,
      })
      onDispatched(res.data, Number(quantity))
      onClose()
    } catch (err) {
      setError(err.message ?? 'Failed to dispatch aid.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SlidePanel
      title="Dispatch Aid"
      subtitle={`${req.shelter?.name ?? 'Shelter'} — ${req.category?.name ?? ''}`}
      onClose={onClose}
      width="max-w-sm"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            loading={saving}
            disabled={!quantity || Number(quantity) < 1 || Number(quantity) > remaining}
            onClick={handleSave}
          >
            <Send size={14} /> Dispatch
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

        <div className="bg-surface rounded-2xl p-4 space-y-3">
          <Row label="Approved qty" value={`${req.quantity_approved} ${unit}`} />
          <Row label="Already dispatched" value={`${req.quantity_dispatched ?? 0} ${unit}`} />
          <Row label="Remaining" value={`${remaining} ${unit}`} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">
            Quantity to dispatch {unit && <span className="text-text-subtle font-normal">({unit})</span>}
          </label>
          <input
            type="number"
            value={quantity}
            min={1}
            max={remaining}
            onChange={e => setQuantity(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all"
          />
          {Number(quantity) > remaining && (
            <p className="text-xs text-danger mt-1">Cannot exceed the remaining approved quantity ({remaining} {unit}).</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">
            Expected arrival <span className="text-text-subtle font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={expectedArrival}
            onChange={e => setExpectedArrival(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background focus:outline-none focus:border-secondary hover:border-border-2 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes for the shelter..."
            rows={3}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all resize-none"
          />
        </div>
      </div>
    </SlidePanel>
  )
}

export default function GovAidRequestsPage() {
  const setGovPendingAidCount = useUiStore((s) => s.setGovPendingAidCount)

  const [requests,      setRequests]      = useState([])
  const [categories,    setCategories]    = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [selected,      setSelected]      = useState(null)
  const [dispatchTarget, setDispatchTarget] = useState(null)
  const [search,        setSearch]        = useState('')
  const [catFilter,     setCatFilter]     = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [statusFilter,  setStatusFilter]  = useState('')

  function loadAll() {
    setError(null)
    setLoading(true)
    Promise.all([getAidRequests(), getAidCategories()])
      .then(([reqRes, catRes]) => {
        const reqs = reqRes.data ?? []
        setRequests(reqs)
        setCategories(catRes.data ?? [])
        setGovPendingAidCount(reqs.filter(r => r.status === 'pending').length)
      })
      .catch(err => setError(err.message ?? 'Failed to load requests.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [setGovPendingAidCount])

  function handleReviewed(updated) {
    setRequests(prev => {
      const next = prev.map(r => r.id === updated.id ? updated : r)
      setGovPendingAidCount(next.filter(r => r.status === 'pending').length)
      return next
    })
  }

  function handleDispatched(reqId, dispatchedQty) {
    setRequests(prev => prev.map(r => r.id === reqId
      ? { ...r, quantity_dispatched: (r.quantity_dispatched ?? 0) + dispatchedQty }
      : r))
  }

  const pending   = requests.filter(r => r.status === 'pending').length
  const approved  = requests.filter(r => r.status === 'approved' || r.status === 'partially_approved').length
  const rejected  = requests.filter(r => r.status === 'rejected').length
  const fulfilled = requests.filter(r => r.status === 'fulfilled').length

  const categoryOpts = [
    { value: '', label: 'All categories' },
    ...categories.map(c => ({ value: String(c.id), label: c.name })),
  ]

  const filtered = requests.filter(r => {
    const q = search.toLowerCase()
    return (
      (!search || (r.shelter?.name ?? '').toLowerCase().includes(q)) &&
      (!catFilter || String(r.aid_category_id) === catFilter) &&
      (!urgencyFilter || r.urgency === urgencyFilter) &&
      (!statusFilter || r.status === statusFilter)
    )
  })

  const columns = [
    {
      key: 'shelter',
      header: 'Shelter',
      render: (_, r) => (
        <div>
          <p className="font-medium text-text">{r.shelter?.name ?? '—'}</p>
          <p className="text-xs text-text-muted">{r.shelter?.governorate ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (_, r) => <span className="text-sm text-text">{r.category?.name ?? '—'}</span>,
    },
    {
      key: 'quantity_requested',
      header: 'Requested',
      render: (_, r) => (
        <span className="text-sm font-medium text-text">
          {r.quantity_requested} <span className="font-normal text-text-muted">{r.category?.unit ?? 'units'}</span>
        </span>
      ),
    },
    {
      key: 'quantity_approved',
      header: 'Approved',
      className: 'hidden md:table-cell',
      render: (_, r) => r.quantity_approved != null ? (
        <span className="text-sm text-success font-medium">
          {r.quantity_approved} <span className="font-normal">{r.category?.unit ?? 'units'}</span>
        </span>
      ) : (
        <span className="text-sm text-text-subtle">—</span>
      ),
    },
    {
      key: 'urgency',
      header: 'Urgency',
      render: (_, r) => (
        <Badge variant={URGENCY_BADGE[r.urgency] ?? 'muted'}>{URGENCY_LABEL[r.urgency] ?? r.urgency}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, r) => (
        <Badge variant={STATUS_BADGE[r.status] ?? 'muted'}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Submitted',
      className: 'hidden lg:table-cell',
      render: (_, r) => <span className="text-sm text-text-muted">{fmt(r.created_at)}</span>,
    },
    {
      key: 'id',
      header: '',
      render: (_, r) => (
        <div className="flex justify-end gap-1.5">
          {['approved', 'partially_approved'].includes(r.status)
            && (r.quantity_approved ?? 0) - (r.quantity_dispatched ?? 0) > 0 && (
            <Button size="sm" onClick={() => setDispatchTarget(r)}>
              <Send size={13} /> Dispatch
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => setSelected(r)}>
            {r.status === 'pending' ? 'Review' : 'View'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout
      title="Aid Requests"
      subtitle="Review and respond to shelter aid requests"
      actions={
        <Button variant="secondary" size="sm" onClick={loadAll}>
          <RefreshCw size={14} /> Refresh
        </Button>
      }
    >
      {error && (
        <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending"   value={pending}   icon={Clock}        iconColor="text-warning"    iconBg="bg-warning-surface" />
        <StatCard label="Approved"  value={approved}  icon={CheckCircle}  iconColor="text-success"    iconBg="bg-success-surface" />
        <StatCard label="Rejected"  value={rejected}  icon={XCircle}      iconColor="text-danger"     iconBg="bg-danger-surface"  />
        <StatCard label="Fulfilled" value={fulfilled} icon={Package}      iconColor="text-text-muted" iconBg="bg-surface-2"       />
      </div>

      <FilterBar
        search={search}
        onSearch={setSearch}
        filters={[
          { value: catFilter,     onChange: setCatFilter,     options: categoryOpts, className: 'w-44' },
          { value: urgencyFilter, onChange: setUrgencyFilter, options: URGENCY_OPTS,  className: 'w-36' },
          { value: statusFilter,  onChange: setStatusFilter,  options: STATUS_OPTS,   className: 'w-44' },
        ]}
      />

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        emptyText="No requests found. Try adjusting your filters."
        pageSize={10}
      />

      {selected && (
        <ReviewPanel
          req={selected}
          onClose={() => setSelected(null)}
          onReviewed={handleReviewed}
        />
      )}

      {dispatchTarget && (
        <DispatchRequestPanel
          req={dispatchTarget}
          onClose={() => setDispatchTarget(null)}
          onDispatched={(_, qty) => { handleDispatched(dispatchTarget.id, qty); setDispatchTarget(null) }}
        />
      )}
    </DashboardLayout>
  )
}
