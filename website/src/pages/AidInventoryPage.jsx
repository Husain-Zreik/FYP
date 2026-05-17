import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Package, Archive, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import { Button, Badge, Loader, Input, Select, SlidePanel, Table, FilterBar, StatCard } from '../components/ui'
import { fmt } from '../utils/format'
import { getAidCategories } from '../api/aidCategories'
import { getAidBatches, createAidBatch } from '../api/aidBatches'
import { getAidRequests } from '../api/aidRequests'

function CategoryCard({ category, totalReceived, available }) {
  const total     = totalReceived ?? 0
  const avail     = available ?? 0
  const ratio     = total > 0 ? avail / total : 0
  const barColor  = ratio > 0.5 ? 'bg-success' : ratio > 0.2 ? 'bg-warning' : 'bg-danger'
  const barWidth  = `${Math.round(ratio * 100)}%`

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
        <p className="text-2xl font-bold text-text leading-none">{avail.toLocaleString()}</p>
        <p className="text-sm text-text-muted mt-0.5">{category.unit} available</p>
      </div>

      <div className="mb-3">
        <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: barWidth }} />
        </div>
        <p className="text-[11px] text-text-subtle mt-1">{Math.round(ratio * 100)}% of received stock available</p>
      </div>

      <p className="text-xs text-text-subtle">Total received: {total.toLocaleString()} {category.unit}</p>
    </div>
  )
}

function LogBatchPanel({ categories, onClose, onSaved }) {
  const today = new Date().toISOString().split('T')[0]

  const [categoryId, setCategoryId]   = useState('')
  const [source,     setSource]       = useState('')
  const [quantity,   setQuantity]     = useState('')
  const [dateReceived, setDate]       = useState(today)
  const [notes,      setNotes]        = useState('')
  const [saving,     setSaving]       = useState(false)
  const [error,      setError]        = useState(null)

  const categoryOpts = categories.map(c => ({ value: String(c.id), label: c.name }))

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const res = await createAidBatch({
        aid_category_id: Number(categoryId),
        source,
        quantity: Number(quantity),
        received_at: dateReceived,
        notes: notes || null,
      })
      onSaved(res.data)
      onClose()
    } catch (err) {
      setError(err.message ?? 'Failed to save batch.')
    } finally {
      setSaving(false)
    }
  }

  const canSave = categoryId && source.trim() && Number(quantity) >= 1 && dateReceived

  return (
    <SlidePanel
      title="Record Delivery"
      subtitle="Record a new batch of received aid"
      onClose={onClose}
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} disabled={!canSave} onClick={handleSave}>Save Batch</Button>
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
          label="Source"
          required
          value={source}
          onChange={setSource}
          placeholder="e.g. UNHCR, Red Cross, EU Aid"
        />

        <Input
          label="Quantity Received"
          type="number"
          required
          value={quantity}
          onChange={setQuantity}
          placeholder="0"
        />

        <Input
          label="Date Received"
          type="date"
          required
          value={dateReceived}
          onChange={setDate}
        />

        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes about this batch..."
            rows={3}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all resize-none"
          />
        </div>
      </div>
    </SlidePanel>
  )
}

export default function AidInventoryPage() {
  const [categories,      setCategories]      = useState([])
  const [batches,         setBatches]         = useState([])
  const [pendingCount,    setPendingCount]    = useState(0)
  const [loadingCats,     setLoadingCats]     = useState(true)
  const [loadingBatches,  setLoadingBatches]  = useState(true)
  const [error,           setError]           = useState(null)
  const [showPanel,       setShowPanel]       = useState(false)
  const [batchSearch,     setBatchSearch]     = useState('')
  const [batchCatFilter,  setBatchCatFilter]  = useState('')

  function loadAll() {
    setError(null)
    setLoadingCats(true)
    setLoadingBatches(true)

    getAidCategories()
      .then(res => setCategories(res.data ?? []))
      .catch(err => setError(err.message ?? 'Failed to load categories.'))
      .finally(() => setLoadingCats(false))

    getAidBatches()
      .then(res => setBatches(res.data ?? []))
      .catch(err => setError(err.message ?? 'Failed to load batches.'))
      .finally(() => setLoadingBatches(false))

    getAidRequests({ status: 'pending' })
      .then(res => setPendingCount((res.data ?? []).length))
      .catch(() => {})
  }

  useEffect(() => { loadAll() }, [])

  const totalReceived  = batches.reduce((sum, b) => sum + (b.quantity ?? 0), 0)
  const totalAvailable = batches.reduce((sum, b) => sum + (b.available_quantity ?? 0), 0)

  const categoryTotals = categories.map(cat => {
    const catBatches = batches.filter(b => b.aid_category_id === cat.id)
    const received   = catBatches.reduce((s, b) => s + (b.quantity ?? 0), 0)
    const available  = catBatches.reduce((s, b) => s + (b.available_quantity ?? 0), 0)
    return { category: cat, totalReceived: received, available }
  })

  const sortedBatches = [...batches].sort((a, b) =>
    new Date(b.received_at ?? b.created_at) - new Date(a.received_at ?? a.created_at)
  )

  const filteredBatches = sortedBatches.filter(b => {
    const matchSearch = !batchSearch ||
      (b.source ?? '').toLowerCase().includes(batchSearch.toLowerCase())
    const matchCat = !batchCatFilter || String(b.aid_category_id) === batchCatFilter
    return matchSearch && matchCat
  })

  const BATCH_COLUMNS = [
    {
      key: 'received_at',
      header: 'Date',
      render: (_, b) => <span className="text-sm text-text-muted">{fmt(b.received_at ?? b.created_at)}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (_, b) => <span className="text-sm font-medium text-text">{b.category?.name ?? '—'}</span>,
    },
    {
      key: 'source',
      header: 'Source',
      render: (_, b) => <span className="text-sm text-text-muted">{b.source ?? '—'}</span>,
    },
    {
      key: 'quantity',
      header: 'Received',
      render: (_, b) => (
        <span className="text-sm text-text">
          {(b.quantity ?? 0).toLocaleString()} <span className="text-text-subtle text-xs">{b.category?.unit ?? ''}</span>
        </span>
      ),
    },
    {
      key: 'available_quantity',
      header: 'Available',
      render: (_, b) => {
        const qty   = b.quantity ?? 0
        const avail = b.available_quantity ?? 0
        const unit  = b.category?.unit ?? ''
        const color = avail === qty ? 'text-success' : avail > 0 ? 'text-warning' : 'text-danger'
        return (
          <span className={`text-sm font-medium ${color}`}>
            {avail.toLocaleString()} <span className="text-text-subtle font-normal text-xs">{unit}</span>
          </span>
        )
      },
    },
    {
      key: 'creator_name',
      header: 'Logged By',
      className: 'hidden lg:table-cell',
      render: (_, b) => <span className="text-sm text-text-muted">{b.creator_name ?? '—'}</span>,
    },
  ]

  function handleBatchSaved(batch) {
    setBatches(prev => [batch, ...prev])
  }

  return (
    <DashboardLayout
      title="Aid Inventory"
      subtitle="Track and manage incoming aid from all sources"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadAll}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button onClick={() => setShowPanel(true)}>
            <Plus size={14} /> Record Delivery
          </Button>
        </div>
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
          value={categories.filter(c => c.is_active).length}
          icon={Package}
          iconColor="text-secondary"
          iconBg="bg-secondary/10"
        />
        <StatCard
          label="Total Received"
          value={totalReceived.toLocaleString()}
          icon={Archive}
          iconColor="text-text-muted"
          iconBg="bg-surface-2"
        />
        <StatCard
          label="Available Now"
          value={totalAvailable.toLocaleString()}
          icon={CheckCircle}
          iconColor="text-success"
          iconBg="bg-success-surface"
        />
        <StatCard
          label="Pending Requests"
          value={pendingCount}
          icon={Clock}
          iconColor="text-warning"
          iconBg="bg-warning-surface"
        />
      </div>

      {/* Stock by category */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-sm font-semibold font-heading text-text">Stock by Category</h2>
          <p className="text-xs text-text-muted mt-0.5">Current availability per aid type</p>
        </div>

        {loadingCats ? (
          <div className="flex items-center justify-center bg-background border border-border rounded-2xl" style={{ minHeight: '200px' }}>
            <Loader size="lg" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center bg-background border border-border rounded-2xl py-16">
            <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-3">
              <Package size={20} className="text-text-subtle" />
            </div>
            <p className="text-sm font-medium text-text mb-1">No inventory logged yet</p>
            <p className="text-xs text-text-muted">Log incoming aid to see stock levels per category.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTotals.map(({ category, totalReceived: tr, available }) => (
              <CategoryCard
                key={category.id}
                category={category}
                totalReceived={tr}
                available={available}
              />
            ))}
          </div>
        )}
      </div>

      {/* Batch log */}
      <div>
        <div className="mb-4">
          <h2 className="text-sm font-semibold font-heading text-text">Batch Log</h2>
          <p className="text-xs text-text-muted mt-0.5">All incoming aid receipts</p>
        </div>

        <FilterBar
          search={batchSearch}
          onSearch={setBatchSearch}
          filters={[{
            value: batchCatFilter,
            onChange: setBatchCatFilter,
            options: [
              { value: '', label: 'All categories' },
              ...categories.map(c => ({ value: String(c.id), label: c.name })),
            ],
            className: 'w-44',
          }]}
        />

        <Table
          columns={BATCH_COLUMNS}
          data={filteredBatches}
          loading={loadingBatches}
          emptyText="No batches logged yet."
          pageSize={15}
        />
      </div>

      {showPanel && (
        <LogBatchPanel
          categories={categories.filter(c => c.is_active)}
          onClose={() => setShowPanel(false)}
          onSaved={handleBatchSaved}
        />
      )}
    </DashboardLayout>
  )
}
