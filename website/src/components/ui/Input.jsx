import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function Input({
  label,
  type        = 'text',
  value       = '',
  onChange,
  error,
  placeholder,
  hint,
  required,
  disabled,
  className   = '',
}) {
  const [showPwd, setShowPwd] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-text mb-1.5">
          {label}
          {required && <span className="text-danger ms-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type={isPassword ? (showPwd ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full border rounded-xl px-4 py-2.5 text-sm text-text bg-background
            placeholder-text-subtle focus:outline-none focus:ring-2 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isPassword ? 'pr-10' : ''}
            ${error
              ? 'border-danger focus:border-danger'
              : 'border-border hover:border-border-2 focus:border-secondary'}
          `}
          style={{ '--tw-ring-color': error ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.15)' }}
        />

        {isPassword && (
          <button type="button" tabIndex={-1}
            onClick={() => setShowPwd(v => !v)}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text transition-colors">
            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-danger mt-1">{Array.isArray(error) ? error[0] : error}</p>}
      {hint && !error && <p className="text-xs text-text-subtle mt-1">{hint}</p>}
    </div>
  )
}
