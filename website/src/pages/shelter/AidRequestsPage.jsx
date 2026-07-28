import { useEffect, useState } from 'react'
import { Plus, Clock, CheckCircle, Package, AlertCircle } from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import { Modal, Table, Button, Badge, Loader, SlidePanel, Select, Input, FilterBar, StatCard } from '../../components/ui'
import { fmt } from '../../utils/format'
import { getAidRequests, createAidRequest, reviewAidRequest, fulfillAidRequest } from '../../api/aidRequests'
import { getAidCategories } from '../../api/aidCategories'

const URGENCY_BADGE = { critical: 'danger', high: 'warning', medium: 'info', low: 'muted' }
const STATUS_BADGE  = { pending: 'muted', approved: 'success', partially_approved: 'warning', rejected: 'danger', fulfilled: 'success' }
const STATUS_LABEL  = { pending: 'Pending', approved: 'Approved', partially_approved: 'Partially Approved', rejected: 'Rejected', fulfilled: 'Fulfilled' }

const URGENCY_OPTS = [
  { value: 'low',      label: 'Low — not urgent, next available batch' },
  { value: 'medium',   label: 'Medium — needed within 1-2 weeks'       },
  { value: 'high',     label: 'High — needed within a few days'        },
  { value: 'critical', label: 'Critical — immediate need'              },
]

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-text-muted shrink-0">{label}</span>
      <span className="text-xs font-medium text-text text-right">{value ?? '—'}</span>
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
  const [requests,       setRequests]       = useState([])
  const [categories,     setCategories]     = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [showPanel,      setShowPanel]      = useState(false)
  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [urgencyFilter,  setUrgencyFilter]  = useState('')
  const [catFilter,      setCatFilter]      = useState('')
  const [receiptTarget,  setReceiptTarget]  = useState(null)
  const [receivedAt,     setReceivedAt]     = useState('')
  const [notes,          setNotes]          = useState('')
  const [savingReceipt,  setSavingReceipt]  = useState(false)

  const today = new Date().toISOString().split('T')[0]

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

  async function handleCancel(req) {
    try {
      const res = await reviewAidRequest(req.id, { status: 'rejected', government_notes: 'Cancelled by shelter' })
      setRequests(prev => prev.map(r => r.id === res.data.id ? res.data : r))
    } catch (err) {
      setError(err.message ?? 'Failed to cancel request.')
    }
  }

  async function handleFulfill() {
    setSavingReceipt(true)
    try {
      const res = await fulfillAidRequest(receiptTarget.id, {
        received_at: receivedAt,
        shelter_received_notes: notes || null,
      })
      setRequests(prev => prev.map(r => r.id === res.data.id ? res.data : r))
      setReceiptTarget(null)
    } catch (err) {
      setError(err.message ?? 'Failed.')
    } finally {
      setSavingReceipt(false)
    }
  }

  const pending   = requests.filter(r => r.status === 'pending').length
  const approved  = requests.filter(r => r.status === 'approved' || r.status === 'partially_approved').length
  const fulfilled = requests.filter(r => r.status === 'fulfilled').length

  const filtered = requests.filter(r => {
    const q = search.toLowerCase()
    return (
      (!search || (r.category?.name ?? '').toLowerCase().includes(q)) &&
      (!catFilter     || String(r.aid_category_id) === catFilter) &&
      (!urgencyFilter || r.urgency === urgencyFilter) &&
      (!statusFilter  || r.status  === statusFilter)
    )
  })

  const columns = [
    {
      key: 'category',
      header: 'Category',
      render: (_, req) => (
        <span className="text-sm font-medium text-text">{req.category?.name ?? '—'}</span>
      ),
    },
    {
      key: 'quantity_requested',
      header: 'Requested',
      render: (_, req) => (
        <span className="text-sm text-text">
          {req.quantity_requested} <span className="text-text-muted text-xs">{req.category?.unit ?? 'units'}</span>
        </span>
      ),
    },
    {
      key: 'quantity_approved',
      header: 'Approved',
      className: 'hidden md:table-cell',
      render: (_, req) => req.quantity_approved != null ? (
        <span className="text-sm text-success font-medium">
          {req.quantity_approved} <span className="text-xs font-normal">{req.category?.unit ?? ''}</span>
        </span>
      ) : (
        <span className="text-sm text-text-subtle">—</span>
      ),
    },
    {
      key: 'urgency',
      header: 'Urgency',
      render: (_, req) => (
        <Badge variant={URGENCY_BADGE[req.urgency]}>
          {req.urgency?.charAt(0).toUpperCase() + req.urgency?.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, req) => (
        <Badge variant={STATUS_BADGE[req.status]}>{STATUS_LABEL[req.status]}</Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Submitted',
      className: 'hidden lg:table-cell',
      render: (_, req) => (
        <span className="text-sm text-text-muted">{fmt(req.created_at)}</span>
      ),
    },
    {
      key: 'id',
      header: '',
      render: (_, req) => {
        if (['approved', 'partially_approved'].includes(req.status)) {
          if (req.can_confirm_receipt) {
            return (
              <Button size="sm" onClick={() => { setReceiptTarget(req); setReceivedAt(today); setNotes('') }}>
                Confirm Receipt
              </Button>
            )
          }
          return <span className="text-xs text-text-subtle italic">Awaiting dispatch</span>
        }
        if (req.status === 'pending') {
          return (
            <Button size="sm" variant="danger" onClick={() => handleCancel(req)}>Cancel</Button>
          )
        }
        return null
      },
    },
  ]

  return (
    <ShelterLayout
      title="Aid Requests"
      subtitle="Request supplies and aid from the government"
    >
      {error && (
        <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending"   value={pending}   icon={Clock}        iconColor="text-warning"    iconBg="bg-warning-surface" />
        <StatCard label="Approved"  value={approved}  icon={CheckCircle}  iconColor="text-success"    iconBg="bg-success-surface" />
        <StatCard label="Fulfilled" value={fulfilled}  icon={Package}      iconColor="text-text-muted" iconBg="bg-surface-2"       />
      </div>

      <FilterBar
        search={search}
        onSearch={setSearch}
        filters={[
          {
            value: catFilter,
            onChange: setCatFilter,
            options: [
              { value: '', label: 'All categories' },
              ...categories.map(c => ({ value: String(c.id), label: c.name })),
            ],
            className: 'w-44',
          },
          {
            value: urgencyFilter,
            onChange: setUrgencyFilter,
            options: [
              { value: '',         label: 'All urgency' },
              { value: 'critical', label: 'Critical'    },
              { value: 'high',     label: 'High'        },
              { value: 'medium',   label: 'Medium'      },
              { value: 'low',      label: 'Low'         },
            ],
            className: 'w-36',
          },
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: '',                  label: 'All statuses'        },
              { value: 'pending',           label: 'Pending'             },
              { value: 'approved',          label: 'Approved'            },
              { value: 'partially_approved',label: 'Partially Approved'  },
              { value: 'rejected',          label: 'Rejected'            },
              { value: 'fulfilled',         label: 'Fulfilled'           },
            ],
            className: 'w-44',
          },
        ]}
        actions={
          <Button onClick={() => setShowPanel(true)}>
            <Plus size={14} /> New Request
          </Button>
        }
      />

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        emptyText="No aid requests found."
        pageSize={10}
      />

      {showPanel && (
        <NewRequestPanel
          categories={categories.filter(c => c.is_active)}
          onClose={() => setShowPanel(false)}
          onSaved={handleSaved}
        />
      )}

      {receiptTarget && (
        <Modal
          title="Confirm Receipt"
          subtitle={`${receiptTarget.category?.name} — ${receiptTarget.quantity_approved ?? receiptTarget.quantity_requested} ${receiptTarget.category?.unit ?? 'units'}`}
          onClose={() => setReceiptTarget(null)}
          width="max-w-sm"
          footer={
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setReceiptTarget(null)}>Cancel</Button>
              <Button loading={savingReceipt} disabled={!receivedAt} onClick={handleFulfill}>Confirm Receipt</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="bg-surface rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider">Request Details</p>
              <InfoRow label="Category" value={receiptTarget.category?.name} />
              <InfoRow label="Approved" value={`${receiptTarget.quantity_approved ?? receiptTarget.quantity_requested} ${receiptTarget.category?.unit ?? 'units'}`} />
              {receiptTarget.government_notes && <InfoRow label="Gov. Note" value={receiptTarget.government_notes} />}
            </div>

            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">
                Date Received <span className="text-danger">*</span>
                <span className="block text-xs font-normal text-text-subtle mt-0.5">When did your shelter physically receive this aid?</span>
              </label>
              <input
                type="date"
                value={receivedAt}
                max={today}
                onChange={e => setReceivedAt(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background focus:outline-none focus:border-secondary hover:border-border-2 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">
                Notes <span className="text-text-subtle font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Any notes about the received items..."
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all resize-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </ShelterLayout>
  )
}
