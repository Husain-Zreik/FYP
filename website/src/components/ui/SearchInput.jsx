import { Search } from 'lucide-react'

export default function SearchInput({
  value       = '',
  onChange,
  placeholder = 'Search…',
  className   = '',
}) {
  return (
    <div className={`relative ${className}`}>
      <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none" />
      <input
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-border rounded-xl ps-9 pe-4 py-2 text-sm text-text bg-background
          placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all"
      />
    </div>
  )
}
