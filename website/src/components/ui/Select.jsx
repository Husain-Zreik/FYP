export default function Select({
  label,
  value      = '',
  onChange,
  options    = [],      // [{ value, label }]
  error,
  placeholder,
  hint,
  required,
  disabled,
  className  = '',
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-text mb-1.5">
          {label}
          {required && <span className="text-danger ms-0.5">*</span>}
        </label>
      )}

      <select
        value={value}
        onChange={e => onChange?.(e.target.value)}
        disabled={disabled}
        className={`
          w-full border rounded-xl px-4 py-2.5 text-sm text-text bg-background
          focus:outline-none focus:ring-2 transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error
            ? 'border-danger focus:border-danger'
            : 'border-border hover:border-border-2 focus:border-secondary'}
        `}
        style={{ '--tw-ring-color': 'rgba(124,58,237,0.15)' }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {error && <p className="text-xs text-danger mt-1">{Array.isArray(error) ? error[0] : error}</p>}
      {hint && !error && <p className="text-xs text-text-subtle mt-1">{hint}</p>}
    </div>
  )
}
