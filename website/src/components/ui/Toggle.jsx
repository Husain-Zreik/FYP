export default function Toggle({
  label,
  description,
  value    = false,
  onChange,
  disabled,
  className = '',
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-1 ${className}`}>
      <div className="min-w-0">
        {label       && <p className="text-sm font-semibold text-text">{label}</p>}
        {description && <p className="text-xs text-text-muted">{description}</p>}
      </div>

      <button
        type="button"
        onClick={() => !disabled && onChange?.(!value)}
        disabled={disabled}
        className={`relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200 disabled:opacity-50
          ${value ? 'bg-secondary' : 'bg-border-2'}`}>
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200
          ${value ? 'start-5' : 'start-1'}`} />
      </button>
    </div>
  )
}
