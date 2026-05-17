import { useEffect, useState } from 'react'
import { RefreshCw, Clock, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import { Button, Badge, Table, SlidePanel, Select } from '../../components/ui'
import { getCivilianNeeds, reviewCivilianNeed } from '../../api/civilianNeeds'
import { useUiStore } from '../../store/uiStore'

const CATEGORY_BADGE = {
  food_water:   'success',
  medical:      'danger',
  clothing:     'info',
  bedding:      'warning',
  hygiene:      'info',
  baby_supplies:'purple',
  other:        'muted',
}

const CATEGORY_LABEL = {
  food_water:    'Food & Water',
  medical:       'Medical Care',
  clothing:      'Clothing',
  bedding:       'Bedding',
  hygiene:       'Hygiene',
  baby_supplies: 'Baby Supplies',
  other:         'Other',
}

const URGENCY_BADGE  = { critical: 'danger', high: 'warning', medium: 'info', low: 'muted' }
const STATUS_BADGE   = { pending: 'muted', in_review: 'info', fulfilled: 'success', rejected: 'danger' }
const STATUS_LABEL   = { pending: 'Pending', in_review: 'In Review', fulfilled: 'Fulfilled', rejected: 'Rejected' }

const CATEGORY_OPTS = [
  { value: '',             label: 'All categories'  },
  { value: 'food_water',   label: 'Food & Water'    },
  { value: 'medical',      label: 'Medical Care'    },
  { value: 'clothing',     label: 'Clothing'        },
  { value: 'bedding',      label: 'Bedding'         },
  { value: 'hygiene',      label: 'Hygiene'         },
  { value: 'baby_supplies',label: 'Baby Supplies'   },
  { value: 'other',        label: 'Other'           },
]

const URGENCY_OPTS = [
  { value: '',         label: 'All urgency'  },
  { value: 'critical', label: 'Critical'      },
  { value: 'high',     label: 'High'          },
  { value: 'medium',   label: 'Medium'        },
  { value: 'low',      label: 'Low'           },
]

const STATUS_OPTS = [
  { value: '',          label: 'All statuses' },
  { value: 'pending',   label: 'Pending'      },
  { value: 'in_review', label: 'In Review'    },
  { value: 'fulfilled', label: 'Fulfilled'    },
  { value: 'rejected',  label: 'Rejected'     },
]

const REVIEW_STATUS_OPTS = [
  { value: 'in_review', label: 'Mark as In Review' },
  { value: 'fulfilled', label: 'Mark as Fulfilled'  },
  { value: 'rejected',  label: 'Reject'             },
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

function ReviewPanel({ need, onClose, onReviewed }) {
  const [status,  setStatus]  = useState('')
  const [notes,   setNotes]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)

  const civilian  = need.civilian ?? need.user ?? {}
  const isOpen    = need.status === 'pending' || need.status === 'in_review'

  function formatDate(str) {
    if (!str) return '—'
    return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  async function handleSave() {
    if (!status) return
    setError(null)
    setSaving(true)
    try {
      const res = await reviewCivilianNeed(need.id, { status, notes: notes || null })
      onReviewed(res.data)
      onClose()
    } catch (err) {
      setError(err.message ?? 'Failed to save review.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SlidePanel
      title={civilian.name ?? 'Civilian'}
      subtitle={`Need submitted ${formatDate(need.created_at)}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        {error && (
          <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <div className="bg-surface rounded-xl p-4 space-y-2">
          <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider">Civilian</p>
          {civilian.phone && <Row label="Phone" value={civilian.phone} />}
          {civilian.email && <Row label="Email" value={civilian.email} />}
        </div>

        <div className="bg-surface rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider">Need Details</p>
          <Row
            label="Category"
            value={<Badge variant={CATEGORY_BADGE[need.category] ?? 'muted'}>{CATEGORY_LABEL[need.category] ?? need.category}</Badge>}
          />
          <Row
            label="Urgency"
            value={<Badge variant={URGENCY_BADGE[need.urgency] ?? 'muted'}>{need.urgency}</Badge>}
          />
          <Row
            label="Status"
            value={<Badge variant={STATUS_BADGE[need.status] ?? 'muted'}>{STATUS_LABEL[need.status] ?? need.status}</Badge>}
          />
          <Row label="Submitted" value={formatDate(need.created_at)} />
          {need.description && (
            <div className="pt-1">
              <p className="text-xs text-text-muted mb-1">Description</p>
              <p className="text-sm text-text leading-relaxed">{need.description}</p>
            </div>
          )}
        </div>

        {need.status !== 'pending' && need.status !== 'in_review' && (
          <div className="bg-surface rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider">Review</p>
            {need.reviewer && <Row label="Reviewed by" value={need.reviewer.name} />}
            {need.reviewed_at && <Row label="Date" value={formatDate(need.reviewed_at)} />}
            {need.notes && (
              <div className="pt-1">
                <p className="text-xs text-text-muted mb-1">Notes</p>
                <p className="text-sm text-text leading-relaxed">{need.notes}</p>
              </div>
            )}
          </div>
        )}

        {isOpen && (
          <div className="space-y-3">
            <Select
              label="Update status"
              value={status}
              onChange={setStatus}
              placeholder="Select new status"
              options={REVIEW_STATUS_OPTS}
            />
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about how you helped or why you rejected..."
                rows={3}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button loading={saving} disabled={!status} onClick={handleSave}>Save</Button>
            </div>
          </div>
        )}
      </div>
    </SlidePanel>
  )
}

export default function CivilianNeedsPage() {
  const setShelterPendingNeedsCount = useUiStore((s) => s.setShelterPendingNeedsCount)

  const [needs,         setNeeds]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [selected,      setSelected]      = useState(null)
  const [catFilter,     setCatFilter]     = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [statusFilter,  setStatusFilter]  = useState('')

  function loadNeeds() {
    setLoading(true)
    setError(null)
    getCivilianNeeds()
      .then(res => {
        const data = res.data ?? []
        setNeeds(data)
        setShelterPendingNeedsCount(data.filter(n => n.status === 'pending').length)
      })
      .catch(err => setError(err.message ?? 'Failed to load.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadNeeds() }, [setShelterPendingNeedsCount])

  function handleReviewed(updated) {
    setNeeds(prev => {
      const next = prev.map(n => n.id === updated.id ? updated : n)
      setShelterPendingNeedsCount(next.filter(n => n.status === 'pending').length)
      return next
    })
  }

  const pendingCount   = needs.filter(n => n.status === 'pending').length
  const inReviewCount  = needs.filter(n => n.status === 'in_review').length
  const fulfilledCount = needs.filter(n => n.status === 'fulfilled').length
  const rejectedCount  = needs.filter(n => n.status === 'rejected').length

  const filtered = needs.filter(n =>
    (!catFilter     || n.category === catFilter) &&
    (!urgencyFilter || n.urgency  === urgencyFilter) &&
    (!statusFilter  || n.status   === statusFilter)
  )

  function formatDate(str) {
    if (!str) return '—'
    return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const columns = [
    {
      key: 'civilian',
      header: 'Civilian',
      render: (_, need) => {
        const civ = need.civilian ?? need.user ?? {}
        const initial = (civ.name ?? '?').charAt(0).toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-warning-surface flex items-center justify-center text-xs font-bold text-warning shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-text truncate">{civ.name ?? '—'}</p>
              <p className="text-xs text-text-muted truncate">{civ.email ?? civ.phone ?? ''}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'category',
      header: 'Category',
      render: (val) => (
        <Badge variant={CATEGORY_BADGE[val] ?? 'muted'}>
          {CATEGORY_LABEL[val] ?? val}
        </Badge>
      ),
    },
    {
      key: 'urgency',
      header: 'Urgency',
      render: (val) => (
        <Badge variant={URGENCY_BADGE[val] ?? 'muted'}>{val}</Badge>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      className: 'hidden md:table-cell',
      render: (val) => (
        <span className="text-sm text-text-muted max-w-xs block truncate">{val ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => (
        <Badge variant={STATUS_BADGE[val] ?? 'muted'}>{STATUS_LABEL[val] ?? val}</Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      className: 'hidden lg:table-cell',
      render: (val) => <span className="text-xs text-text-muted">{formatDate(val)}</span>,
    },
    {
      key: 'id',
      header: '',
      render: (_, need) => (
        <Button size="sm" variant="secondary" onClick={() => setSelected(need)}>
          <Eye size={13} /> Review
        </Button>
      ),
    },
  ]

  return (
    <ShelterLayout
      title="Civilian Needs"
      subtitle="Review and respond to needs submitted by civilians"
      actions={
        <Button variant="secondary" size="sm" onClick={loadNeeds}>
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
        <StatCard label="Pending"   value={pendingCount}   icon={Clock}        iconColor="text-warning"    iconBg="bg-warning-surface" />
        <StatCard label="In Review" value={inReviewCount}  icon={Eye}          iconColor="text-secondary"  iconBg="bg-secondary/10"    />
        <StatCard label="Fulfilled" value={fulfilledCount} icon={CheckCircle}  iconColor="text-success"    iconBg="bg-success-surface" />
        <StatCard label="Rejected"  value={rejectedCount}  icon={XCircle}      iconColor="text-danger"     iconBg="bg-danger-surface"  />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Select value={catFilter}     onChange={setCatFilter}     options={CATEGORY_OPTS} className="w-44" />
        <Select value={urgencyFilter} onChange={setUrgencyFilter} options={URGENCY_OPTS}  className="w-36" />
        <Select value={statusFilter}  onChange={setStatusFilter}  options={STATUS_OPTS}   className="w-36" />
      </div>

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        emptyText="No civilian needs found."
      />

      {selected && (
        <ReviewPanel
          need={selected}
          onClose={() => setSelected(null)}
          onReviewed={handleReviewed}
        />
      )}
    </ShelterLayout>
  )
}
