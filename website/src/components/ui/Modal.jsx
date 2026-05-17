import { X } from 'lucide-react'
import Button from './Button'

/*
 * Props:
 *   title:    string
 *   subtitle?: string
 *   onClose:  () => void
 *   children: ReactNode
 *   footer?:  ReactNode  – sticky bottom action bar
 *   width?:   string     – default 'max-w-2xl'
 */
export default function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = 'max-w-2xl',
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-text/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className={`relative w-full ${width} bg-background rounded-2xl border border-border shadow-2xl flex flex-col`}
        style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold font-heading text-text">{title}</h2>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <Button variant="icon-ghost" onClick={onClose} className="-me-1">
            <X size={16} />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
