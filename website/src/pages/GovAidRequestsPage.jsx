import { useEffect, useState } from 'react'
import { RefreshCw, Clock, CheckCircle, XCircle, Package, Building2, AlertCircle, Check, X, Pencil } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import { Button, Badge, Loader, SlidePanel, SearchInput, Select } from '../components/ui'
import { getAidRequests, reviewAidRequest } from '../api/aidRequests'
import { getAidCategories } from '../api/aidCategories'
import { useUiStore } from '../store/uiStore'

const URGENCY_BADGE  = { critical: 'danger', high: 'warning', medium: 'info', low: 'muted' }
const STATUS_BADGE   = { pending: 'muted', approved: 'success', partially_approved: 'warning', rejected: 'danger', fulfilled: 'success' }
const STATUS_LABEL   = { pending: 'Pending', approved: 'Approved', partially_approved: 'Partially Approved', rejected: 'Rejected', fulfilled: 'Fulfilled' }
const URGENCY_BG     = { critical: 'bg-danger-surface text-danger', high: 'bg-warning-surface text-warning', medium: 'bg-secondary/10 text-secondary', low: 'bg-surface-2 text-text-muted' }

const URGENCY_OPTS = [
  { value: '',         label: 'All urgency'   },
  { value: 'critical', label: 'Critical'       },
  { value: 'high',     label: 'High'           },
  { value: 'medium',   label: 'Medium'         },
  { value: 'low',      label: 'Low'            },
]

const STATUS_OPTS = [
  { value: '',                   label: 'All statuses'       },
  { value: 'pending',            label: 'Pending'            },
  { value: 'approved',           label: 'Approved'           },
  { value: 'partially_approved', label: 'Partially Approved' },
  { value: 'rejected',           label: 'Rejected'           },
  { value: 'fulfilled',          label: 'Fulfilled'          },
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

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-text-muted shrink-0">{label}</span>
      <span className="text-xs font-medium text-text text-right">{value ?? '—'}</span>
    </div>
  )
}

function ReviewPanel({ req, onClose, onReviewed }) {
  const [qty,      setQty]      = useState(String(req.quantity_requested ?? ''))
  const [notes,    setNotes]    = useState('')
  const [saving,   setSaving]   = useState(null)
  const [error,    setError]    = useState(null)

  const isPending = req.status === 'pending'
  const unit      = req.aid_category?.unit ?? ''

  async function submit(status) {
    setError(null)
    setSaving(status)
    try {
      const payload = {
        status,
        government_notes: notes || null,
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

  function formatDate(str) {
    if (!str) return '—'
    return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <SlidePanel
      title={req.shelter?.name ?? 'Request'}
      subtitle={`Submitted ${formatDate(req.created_at)}`}
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
          <Row label="Category"   value={req.aid_category?.name} />
          <Row label="Requested"  value={`${req.quantity_requested} ${unit}`} />
          <Row label="Urgency"    value={<Badge variant={URGENCY_BADGE[req.urgency] ?? 'muted'}>{req.urgency}</Badge>} />
          <Row label="Status"     value={<Badge variant={STATUS_BADGE[req.status] ?? 'muted'}>{STATUS_LABEL[req.status] ?? req.status}</Badge>} />
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
            <Row label="Reviewed by"   value={req.reviewer?.name} />
            <Row label="Reviewed on"   value={formatDate(req.reviewed_at)} />
            {req.quantity_approved != null && (
              <Row label="Approved qty" value={`${req.quantity_approved} ${unit}`} />
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

function RequestCard({ req, onReview }) {
  function formatDate(str) {
    if (!str) return '—'
    return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const urgencyBg = URGENCY_BG[req.urgency] ?? 'bg-surface-2 text-text-muted'

  return (
    <div className="bg-background border border-border rounded-2xl p-5 hover:border-border-2 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${urgencyBg}`}>
          <Building2 size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold text-text leading-snug">{req.shelter?.name ?? '—'}</p>
              <p className="text-xs text-text-muted">{req.shelter?.governorate ?? ''}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <p className="text-xs text-text-muted">{formatDate(req.created_at)}</p>
              <Button size="sm" variant="secondary" onClick={() => onReview(req)}>Review</Button>
              {req.status === 'pending' && (
                <Button size="sm" variant="danger" onClick={() => onReview(req)}>Reject</Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <p className="text-sm text-text">{req.aid_category?.name ?? '—'}</p>
            <p className="text-xs text-text-muted">· {req.quantity_requested} {req.aid_category?.unit ?? 'units'} requested</p>
            <Badge variant={URGENCY_BADGE[req.urgency] ?? 'muted'}>{req.urgency}</Badge>
            <Badge variant={STATUS_BADGE[req.status] ?? 'muted'}>{STATUS_LABEL[req.status] ?? req.status}</Badge>
          </div>

          {req.reason && (
            <p className="text-sm text-text-muted mt-2 line-clamp-1">{req.reason}</p>
          )}

          {req.quantity_approved != null && (
            <p className="text-xs text-success mt-1">Approved: {req.quantity_approved} {req.aid_category?.unit ?? 'units'}</p>
          )}

          {req.government_notes && (
            <p className="text-xs text-text-muted mt-1">{req.government_notes}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GovAidRequestsPage() {
  const setGovPendingAidCount = useUiStore((s) => s.setGovPendingAidCount)

  const [requests,       setRequests]       = useState([])
  const [categories,     setCategories]     = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [selected,       setSelected]       = useState(null)
  const [search,         setSearch]         = useState('')
  const [catFilter,      setCatFilter]      = useState('')
  const [urgencyFilter,  setUrgencyFilter]  = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')

  function loadAll() {
    setError(null)
    setLoading(true)

    Promise.all([
      getAidRequests(),
      getAidCategories(),
    ])
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

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by shelter name…"
          className="flex-1 min-w-48 max-w-xs"
        />
        <Select value={catFilter}     onChange={setCatFilter}     options={categoryOpts} className="w-44" />
        <Select value={urgencyFilter} onChange={setUrgencyFilter} options={URGENCY_OPTS} className="w-36" />
        <Select value={statusFilter}  onChange={setStatusFilter}  options={STATUS_OPTS}  className="w-44" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center bg-background border border-border rounded-2xl" style={{ minHeight: 'clamp(320px, 55vh, 520px)' }}>
          <Loader size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-background border border-border rounded-2xl" style={{ minHeight: 'clamp(320px, 55vh, 520px)' }}>
          <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-3">
            <Package size={20} className="text-text-subtle" />
          </div>
          <p className="text-sm font-medium text-text mb-1">No requests found</p>
          <p className="text-xs text-text-muted">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <RequestCard key={req.id} req={req} onReview={setSelected} />
          ))}
        </div>
      )}

      {selected && (
        <ReviewPanel
          req={selected}
          onClose={() => setSelected(null)}
          onReviewed={handleReviewed}
        />
      )}
    </DashboardLayout>
  )
}
