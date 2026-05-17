import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export default function Select({
  label,
  value       = '',
  onChange,
  options     = [],
  error,
  placeholder,
  hint,
  required,
  disabled,
  className   = '',
}) {
  const [open, setOpen]   = useState(false)
  const containerRef      = useRef(null)

  const selected = options.find(o => String(o.value) === String(value))
  const display  = selected?.label ?? placeholder ?? '— Select —'
  const isEmpty  = !selected

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleSelect(optValue) {
    onChange?.(optValue)
    setOpen(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape')     { setOpen(false); return }
    if (e.key === 'Enter' || e.key === ' ') { if (!disabled) setOpen(v => !v); e.preventDefault() }
    if (e.key === 'ArrowDown')  {
      e.preventDefault()
      const idx = options.findIndex(o => String(o.value) === String(value))
      const next = options[idx + 1]
      if (next) handleSelect(next.value)
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = options.findIndex(o => String(o.value) === String(value))
      const prev = options[idx - 1]
      if (prev) handleSelect(prev.value)
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>

      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-text mb-1.5">
          {label}
          {required && <span className="text-danger ms-0.5">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        onKeyDown={handleKeyDown}
        className={`
          w-full flex items-center justify-between gap-2
          border rounded-xl px-4 py-2.5 text-sm bg-background
          transition-all duration-150 cursor-pointer text-start
          focus:outline-none focus:ring-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${open
            ? 'border-secondary ring-2'
            : error
              ? 'border-danger hover:border-danger'
              : 'border-border hover:border-border-2'
          }
        `}
        style={{ '--tw-ring-color': error ? 'rgba(239,68,68,0.12)' : 'rgba(124,58,237,0.12)' }}
      >
        <span className={isEmpty ? 'text-text-subtle' : 'text-text'}>
          {display}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-text-subtle transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 w-full mt-1.5 bg-background border border-border rounded-xl shadow-lg overflow-hidden"
          style={{ minWidth: '100%' }}>
          <div className="max-h-56 overflow-y-auto py-1">
            {placeholder && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`
                  w-full flex items-center justify-between px-4 py-2 text-sm text-start transition-colors
                  ${value === '' ? 'bg-primary/5 text-primary font-medium' : 'text-text-subtle hover:bg-surface'}
                `}
              >
                <span>{placeholder}</span>
                {value === '' && <Check size={13} className="shrink-0 text-primary" />}
              </button>
            )}
            {options.map(opt => {
              const isSelected = String(opt.value) === String(value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full flex items-center justify-between px-4 py-2 text-sm text-start transition-colors
                    ${isSelected
                      ? 'bg-primary/8 text-primary font-medium'
                      : 'text-text hover:bg-surface hover:text-text'}
                  `}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={13} className="shrink-0 text-primary" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-danger mt-1">{Array.isArray(error) ? error[0] : error}</p>}
      {hint && !error && <p className="text-xs text-text-subtle mt-1">{hint}</p>}
    </div>
  )
}
