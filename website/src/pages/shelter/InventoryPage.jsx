import { useEffect, useState } from 'react'
import { RefreshCw, Package, ArrowDownToLine, Send, CheckCircle, AlertCircle } from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import { Badge, Loader, Table, FilterBar, StatCard, Button } from '../../components/ui'
import { fmt } from '../../utils/format'
import { getAidCategories } from '../../api/aidCategories'
import { getAidDispatches } from '../../api/aidDispatches'

const ACTIVITY_TYPE_BADGE = { received: 'success', sent: 'info' }
const ACTIVITY_TYPE_LABEL = { received: 'Received', sent: 'Sent' }

function CategoryCard({ category, received, sent, available }) {
  const isNegative = available < 0
  const ratio      = received > 0 ? available / received : (sent > 0 ? -1 : 0)
  const barColor   = ratio > 0.5 ? 'bg-success' : ratio > 0.2 ? 'bg-warning' : 'bg-danger'
  const barWidth   = `${Math.max(0, Math.min(100, Math.round(ratio * 100)))}%`

  return (
    <div className={`bg-background border border-border rounded-2xl p-5 hover:border-border-2 hover:shadow-sm transition-all ${!category.is_active ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="font-semibold text-text leading-snug">{category.name}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          {!category.is_active && <Badge variant="muted">Inactive</Badge>}
          <Badge variant="muted">{category.unit}</Badge>
        </div>
      </div>

      <div className="mb-3">
        <p className={`text-2xl font-bold leading-none ${isNegative ? 'text-danger' : 'text-text'}`}>
          {available.toLocaleString()}
        </p>
        <p className="text-sm text-text-muted mt-0.5">{category.unit} available</p>
      </div>

      <div className="mb-3">
        <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: barWidth }} />
        </div>
        <p className="text-[11px] text-text-subtle mt-1">
          {isNegative ? 'Distributed more than received' : `${Math.round(ratio * 100)}% of received stock remaining`}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-text-subtle">
        <span>Received: {received.toLocaleString()} {category.unit}</span>
        <span>Sent: {sent.toLocaleString()} {category.unit}</span>
      </div>
    </div>
  )
}

export default function ShelterInventoryPage() {
  const [categories,  setCategories]  = useState([])
  const [incoming,    setIncoming]    = useState([])
  const [outgoing,    setOutgoing]    = useState([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingLog,  setLoadingLog]  = useState(true)
  const [error,       setError]       = useState(null)
  const [search,      setSearch]      = useState('')
  const [catFilter,   setCatFilter]   = useState('')

  function loadAll() {
    setError(null)
    setLoadingCats(true)
    setLoadingLog(true)

    getAidCategories()
      .then(res => setCategories(res.data ?? []))
      .catch(err => setError(err.message ?? 'Failed to load categories.'))
      .finally(() => setLoadingCats(false))

    Promise.all([
      getAidDispatches({ direction: 'incoming' }),
      getAidDispatches({ direction: 'outgoing' }),
    ])
      .then(([incRes, outRes]) => {
        setIncoming(incRes.data ?? [])
        setOutgoing(outRes.data ?? [])
      })
      .catch(err => setError(err.message ?? 'Failed to load aid activity.'))
      .finally(() => setLoadingLog(false))
  }

  useEffect(() => { loadAll() }, [])

  // Received = government deliveries the shelter has confirmed.
  // Sent = deliveries to civilians that haven't been declined (matches the
  // government side's own immediate-deduction / refund-on-reject semantics).
  const receivedDispatches = incoming.filter(d => d.status === 'accepted')
  const sentDispatches     = outgoing.filter(d => d.status !== 'rejected')

  const totalReceived  = receivedDispatches.reduce((sum, d) => sum + (d.quantity ?? 0), 0)
  const totalSent      = sentDispatches.reduce((sum, d) => sum + (d.quantity ?? 0), 0)
  const totalAvailable = totalReceived - totalSent

  const categoryTotals = categories
    .map(cat => {
      const received  = receivedDispatches.filter(d => d.category?.id === cat.id).reduce((s, d) => s + (d.quantity ?? 0), 0)
      const sent       = sentDispatches.filter(d => d.category?.id === cat.id).reduce((s, d) => s + (d.quantity ?? 0), 0)
      return { category: cat, received, sent, available: received - sent }
    })
    .filter(c => c.received > 0 || c.sent > 0)

  const activity = [
    ...receivedDispatches.map(d => ({
      id: `in-${d.id}`,
      type: 'received',
      date: d.received_at ?? d.dispatched_at,
      category: d.category,
      quantity: d.quantity,
      detail: d.dispatcher_name ? `From ${d.dispatcher_name}` : 'From Government',
    })),
    ...sentDispatches.map(d => ({
      id: `out-${d.id}`,
      type: 'sent',
      date: d.status === 'accepted' ? (d.received_at ?? d.dispatched_at) : d.dispatched_at,
      category: d.category,
      quantity: d.quantity,
      detail: d.civilian?.name ? `To ${d.civilian.name}` : 'To civilian',
      status: d.status,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  const filteredActivity = activity.filter(a => {
    const matchSearch = !search || (a.detail ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat    = !catFilter || String(a.category?.id) === catFilter
    return matchSearch && matchCat
  })

  const ACTIVITY_COLUMNS = [
    {
      key: 'date',
      header: 'Date',
      render: (_, a) => <span className="text-sm text-text-muted">{fmt(a.date)}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (_, a) => <Badge variant={ACTIVITY_TYPE_BADGE[a.type]}>{ACTIVITY_TYPE_LABEL[a.type]}</Badge>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (_, a) => <span className="text-sm font-medium text-text">{a.category?.name ?? '—'}</span>,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (_, a) => (
        <span className={`text-sm font-medium ${a.type === 'received' ? 'text-success' : 'text-text'}`}>
          {a.type === 'received' ? '+' : '-'}{(a.quantity ?? 0).toLocaleString()}{' '}
          <span className="text-text-subtle font-normal text-xs">{a.category?.unit ?? ''}</span>
        </span>
      ),
    },
    {
      key: 'detail',
      header: 'Detail',
      render: (_, a) => <span className="text-sm text-text-muted">{a.detail}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      className: 'hidden md:table-cell',
      render: (_, a) => a.type === 'sent'
        ? <Badge variant={a.status === 'accepted' ? 'success' : 'warning'}>{a.status === 'accepted' ? 'Delivered' : 'Pending'}</Badge>
        : <Badge variant="success">Confirmed</Badge>,
    },
  ]

  return (
    <ShelterLayout
      title="Aid Inventory"
      subtitle="Stock currently held by your shelter"
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Categories"
          value={categoryTotals.filter(c => c.available > 0).length}
          icon={Package}
          iconColor="text-secondary"
          iconBg="bg-secondary/10"
        />
        <StatCard
          label="Total Received"
          value={totalReceived.toLocaleString()}
          icon={ArrowDownToLine}
          iconColor="text-text-muted"
          iconBg="bg-surface-2"
        />
        <StatCard
          label="Sent to Civilians"
          value={totalSent.toLocaleString()}
          icon={Send}
          iconColor="text-secondary"
          iconBg="bg-secondary/10"
        />
        <StatCard
          label="Available Now"
          value={totalAvailable.toLocaleString()}
          icon={CheckCircle}
          iconColor="text-success"
          iconBg="bg-success-surface"
        />
      </div>

      {/* Stock by category */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-sm font-semibold font-heading text-text">Stock by Category</h2>
          <p className="text-xs text-text-muted mt-0.5">What your shelter currently has on hand</p>
        </div>

        {loadingCats ? (
          <div className="flex items-center justify-center bg-background border border-border rounded-2xl" style={{ minHeight: '200px' }}>
            <Loader size="lg" />
          </div>
        ) : categoryTotals.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center bg-background border border-border rounded-2xl py-16">
            <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-3">
              <Package size={20} className="text-text-subtle" />
            </div>
            <p className="text-sm font-medium text-text mb-1">No aid received yet</p>
            <p className="text-xs text-text-muted">Accepted deliveries from the government will appear here.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTotals.map(({ category, received, sent, available }) => (
              <CategoryCard
                key={category.id}
                category={category}
                received={received}
                sent={sent}
                available={available}
              />
            ))}
          </div>
        )}
      </div>

      {/* Activity log */}
      <div>
        <div className="mb-4">
          <h2 className="text-sm font-semibold font-heading text-text">Activity Log</h2>
          <p className="text-xs text-text-muted mt-0.5">Aid received from government and sent to civilians</p>
        </div>

        <FilterBar
          search={search}
          onSearch={setSearch}
          filters={[{
            value: catFilter,
            onChange: setCatFilter,
            options: [
              { value: '', label: 'All categories' },
              ...categories.map(c => ({ value: String(c.id), label: c.name })),
            ],
            className: 'w-44',
          }]}
        />

        <Table
          columns={ACTIVITY_COLUMNS}
          data={filteredActivity}
          loading={loadingLog}
          emptyText="No aid activity yet."
          pageSize={15}
        />
      </div>
    </ShelterLayout>
  )
}
