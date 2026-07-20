import { X } from 'lucide-react'
import Button from './Button'
import ModalOverlay from './ModalOverlay'

export default function SlidePanel({ title, subtitle, onClose, footer, children, width = 'max-w-md' }) {
  return (
    <ModalOverlay onClose={onClose}>
      <div
        className={`relative w-full ${width} bg-background rounded-2xl border border-border shadow-2xl flex flex-col`}
        style={{ maxHeight: '90vh' }}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold font-heading text-text">{title}</h2>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <Button variant="icon-ghost" onClick={onClose} title="Close"><X size={16} /></Button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-border shrink-0">{footer}</div>}
      </div>
    </ModalOverlay>
  )
}
