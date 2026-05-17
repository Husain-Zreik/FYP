import SearchInput from './SearchInput'
import Select from './Select'

/*
 * Props:
 *   search?:    string                                – current search value
 *   onSearch?:  (v: string) => void                  – if omitted, no search input
 *   filters?:   [{value, onChange, options, placeholder?, className?}]
 *   actions?:   ReactNode                            – right side (e.g. buttons)
 *   className?: string                               – extra classes on wrapper
 */
export default function FilterBar({
  search,
  onSearch,
  filters  = [],
  actions,
  className = '',
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 mb-5 ${className}`}>
      {onSearch !== undefined && (
        <SearchInput
          value={search}
          onChange={onSearch}
          className="flex-1 min-w-48 max-w-sm"
        />
      )}
      {filters.map((f, i) => (
        <Select
          key={i}
          value={f.value}
          onChange={f.onChange}
          options={f.options}
          placeholder={f.placeholder}
          className={f.className ?? 'w-44'}
        />
      ))}
      {actions && (
        <div className="ms-auto flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
