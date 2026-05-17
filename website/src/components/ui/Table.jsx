import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, total, pageSize, onChange }) {
  if (totalPages <= 1) return null

  const start = Math.min((page - 1) * pageSize + 1, total)
  const end   = Math.min(page * pageSize, total)

  function getPages() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = [1]
    if (page > 3)               pages.push(-1)
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2)  pages.push(-1)
    pages.push(totalPages)
    return pages
  }

  const btnBase = 'transition-colors disabled:opacity-30 disabled:cursor-not-allowed'

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border">
      <p className="text-xs text-text-muted">
        Showing {start}–{end} of {total}
      </p>

      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className={`p-1.5 rounded-lg text-text-subtle hover:text-text hover:bg-surface ${btnBase}`}>
          <ChevronLeft size={15} />
        </button>

        {getPages().map((p, i) =>
          p === -1 ? (
            <span key={`e${i}`} className="w-8 text-center text-xs text-text-subtle">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-primary text-primary-foreground'
                  : 'text-text-muted hover:bg-surface hover:text-text'
              }`}>
              {p}
            </button>
          )
        )}

        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className={`p-1.5 rounded-lg text-text-subtle hover:text-text hover:bg-surface ${btnBase}`}>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────
/*
 * columns: [{ key, header, className?, render?(value, row) => ReactNode }]
 * data:     array of row objects
 * keyField: property used as React key (default: 'id')
 * loading:  show centered spinner
 * emptyText / emptyNode: message or element when data is empty
 * pageSize: rows per page (default 10, set to Infinity to disable pagination)
 */
export default function Table({
  columns   = [],
  data      = [],
  keyField  = 'id',
  loading   = false,
  emptyText = 'No data found.',
  emptyNode,
  pageSize  = 10,
}) {
  const [page, setPage] = useState(1)

  // Reset to page 1 whenever the filtered dataset changes
  useEffect(() => { setPage(1) }, [data])

  const totalPages = Math.ceil(data.length / pageSize)
  const paginated  = pageSize === Infinity
    ? data
    : data.slice((page - 1) * pageSize, page * pageSize)

  // ── Loading ──
  if (loading) {
    return (
      <div className="bg-background rounded-2xl border border-border flex items-center justify-center"
        style={{ minHeight: 'clamp(280px, 50vh, 480px)' }}>
        <div className="w-6 h-6 border-2 border-border border-t-secondary rounded-full animate-spin" />
      </div>
    )
  }

  // ── Empty ──
  if (data.length === 0) {
    return (
      <div className="bg-background rounded-2xl border border-border flex items-center justify-center text-center px-6"
        style={{ minHeight: 'clamp(280px, 50vh, 480px)' }}>
        {emptyNode ?? <p className="text-sm text-text-muted">{emptyText}</p>}
      </div>
    )
  }

  // ── Table ──
  return (
    <div className="bg-background rounded-2xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            {columns.map(col => (
              <th key={col.key}
                className={`text-start px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {paginated.map(row => (
            <tr key={row[keyField]} className="hover:bg-surface/50 transition-colors">
              {columns.map(col => (
                <td key={col.key} className={`px-5 py-3.5 ${col.className ?? ''}`}>
                  {col.render
                    ? col.render(row[col.key], row)
                    : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={data.length}
        pageSize={pageSize}
        onChange={setPage}
      />
    </div>
  )
}
