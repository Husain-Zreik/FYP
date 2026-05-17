import { X } from 'lucide-react'
import Button from './Button'

export default function SlidePanel({
  title,
  subtitle,
  onClose,
  footer,
  children,
  width = 'max-w-md',
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-text/20 backdrop-blur-sm" onClick={onClose} />

      <div className={`w-full ${width} bg-background border-s border-border flex flex-col h-full shadow-2xl`}>

        <div className="flex items-start justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold font-heading text-text">{title}</h2>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <Button variant="icon-ghost" onClick={onClose} title="Close">
            <X size={16} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-border shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
