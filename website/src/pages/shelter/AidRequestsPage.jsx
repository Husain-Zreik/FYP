import { useEffect, useState } from 'react'
import { Plus, Clock, CheckCircle, Package, AlertCircle } from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import { Button, Badge, Loader, SlidePanel, Select, Input } from '../../components/ui'
import { getAidRequests, createAidRequest } from '../../api/aidRequests'
import { getAidCategories } from '../../api/aidCategories'

const URGENCY_BADGE = { critical: 'danger', high: 'warning', medium: 'info', low: 'muted' }
const STATUS_BADGE  = { pending: 'muted', approved: 'success', partially_approved: 'warning', rejected: 'danger', fulfilled: 'success' }
const STATUS_LABEL  = { pending: 'Pending', approved: 'Approved', partially_approved: 'Partially Approved', rejected: 'Rejected', fulfilled: 'Fulfilled' }
const STATUS_DOT    = { pending: 'bg-text-muted', approved: 'bg-success', partially_approved: 'bg-warning', rejected: 'bg-danger', fulfilled: 'bg-success' }

const URGENCY_OPTS = [
  { value: 'low',      label: 'Low — not urgent, next available batch' },
  { value: 'medium',   label: 'Medium — needed within 1-2 weeks'       },
  { value: 'high',     label: 'High — needed within a few days'        },
  { value: 'critical', label: 'Critical — immediate need'              },
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

function RequestCard({ req }) {
  function formatDate(str) {
    if (!str) return '—'
    return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const dotColor = STATUS_DOT[req.status] ?? 'bg-text-muted'

  return (
    <div className="bg-background border border-border rounded-2xl p-5 hover:border-border-2 transition-all">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-text">{req.aid_category?.name ?? '—'}</p>
          <Badge variant={URGENCY_BADGE[req.urgency] ?? 'muted'}>{req.urgency}</Badge>
          <Badge variant={STATUS_BADGE[req.status] ?? 'muted'}>{STATUS_LABEL[req.status] ?? req.status}</Badge>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
          <span className="text-xs text-text-subtle">{STATUS_LABEL[req.status] ?? req.status}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-1">
        <p className="text-sm text-text-muted">
          Requested: <span className="text-text font-medium">{req.quantity_requested} {req.aid_category?.unit ?? 'units'}</span>
        </p>
        {(req.status === 'approved' || req.status === 'partially_approved') && req.quantity_approved != null && (
          <>
            <span className="text-text-subtle">→</span>
            <p className="text-sm text-success font-medium">
              Approved: {req.quantity_approved} {req.aid_category?.unit ?? 'units'}
            </p>
          </>
        )}
      </div>

      {req.reason && (
        <p className="text-sm text-text-muted mt-1 line-clamp-2">{req.reason}</p>
      )}

      {req.government_notes && (
        <blockquote className="border-s-2 border-secondary ps-3 text-sm text-text-muted italic mt-2">
          {req.government_notes}
        </blockquote>
      )}

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-text-subtle">{formatDate(req.created_at)}</p>
        {req.reviewer && (
          <p className="text-xs text-text-subtle">Reviewed by {req.reviewer.name}</p>
        )}
      </div>
    </div>
  )
}

function NewRequestPanel({ categories, onClose, onSaved }) {
  const [categoryId, setCategoryId] = useState('')
  const [quantity,   setQuantity]   = useState('')
  const [urgency,    setUrgency]    = useState('')
  const [reason,     setReason]     = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)

  const selectedCat  = categories.find(c => String(c.id) === categoryId)
  const categoryOpts = categories.map(c => ({ value: String(c.id), label: c.name }))

  const canSave = categoryId && Number(quantity) >= 1 && urgency && reason.trim().length >= 10

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const res = await createAidRequest({
        aid_category_id: Number(categoryId),
        quantity_requested: Number(quantity),
        urgency,
        reason,
      })
      onSaved(res.data)
      onClose()
    } catch (err) {
      setError(err.message ?? 'Failed to submit request.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SlidePanel
      title="New Aid Request"
      subtitle="Request supplies from the government"
      onClose={onClose}
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} disabled={!canSave} onClick={handleSave}>Submit Request</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <Select
          label="Category"
          required
          value={categoryId}
          onChange={setCategoryId}
          placeholder="Select a category"
          options={categoryOpts}
        />

        <Input
          label="Quantity Needed"
          type="number"
          required
          value={quantity}
          onChange={setQuantity}
          placeholder="0"
          hint={selectedCat ? `unit: ${selectedCat.unit}` : undefined}
        />

        <Select
          label="Urgency"
          required
          value={urgency}
          onChange={setUrgency}
          placeholder="Select urgency level"
          options={URGENCY_OPTS}
        />

        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">
            Reason <span className="text-danger ms-0.5">*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Explain why you need this aid and how it will be used..."
            rows={4}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all resize-none"
          />
          {reason.trim().length > 0 && reason.trim().length < 10 && (
            <p className="text-xs text-danger mt-1">Please provide at least 10 characters.</p>
          )}
        </div>
      </div>
    </SlidePanel>
  )
}

export default function AidRequestsPage() {
  const [requests,   setRequests]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [showPanel,  setShowPanel]  = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getAidRequests(),
      getAidCategories(),
    ])
      .then(([reqRes, catRes]) => {
        setRequests(reqRes.data ?? [])
        setCategories(catRes.data ?? [])
      })
      .catch(err => setError(err.message ?? 'Failed to load.'))
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(req) {
    setRequests(prev => [req, ...prev])
  }

  const pending  = requests.filter(r => r.status === 'pending').length
  const approved = requests.filter(r => r.status === 'approved' || r.status === 'partially_approved').length

  return (
    <ShelterLayout
      title="Aid Requests"
      subtitle="Request supplies and aid from the government"
      actions={
        <Button onClick={() => setShowPanel(true)}>
          <Plus size={14} /> New Request
        </Button>
      }
    >
      {error && (
        <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending"  value={pending}            icon={Clock}        iconColor="text-warning"    iconBg="bg-warning-surface" />
        <StatCard label="Approved" value={approved}           icon={CheckCircle}  iconColor="text-success"    iconBg="bg-success-surface" />
        <StatCard label="Total"    value={requests.length}    icon={Package}      iconColor="text-text-muted" iconBg="bg-surface-2"       />
      </div>

      {loading ? (
        <div className="flex items-center justify-center bg-background border border-border rounded-2xl" style={{ minHeight: 'clamp(320px, 55vh, 520px)' }}>
          <Loader size="lg" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-background border border-border rounded-2xl" style={{ minHeight: 'clamp(320px, 55vh, 520px)' }}>
          <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-3">
            <Package size={20} className="text-text-subtle" />
          </div>
          <p className="text-sm font-medium text-text mb-1">No requests yet</p>
          <p className="text-xs text-text-muted max-w-xs">
            Submit your first aid request to the government.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <RequestCard key={req.id} req={req} />
          ))}
        </div>
      )}

      {showPanel && (
        <NewRequestPanel
          categories={categories.filter(c => c.is_active)}
          onClose={() => setShowPanel(false)}
          onSaved={handleSaved}
        />
      )}
    </ShelterLayout>
  )
}
