import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { Shield, AlertTriangle, Lock, ServerCrash, Search, ArrowLeft, Home } from 'lucide-react'
import Button from '../components/ui/Button'

const ERRORS = {
  404: { icon: Search,      code: '404', title: 'Page not found',      message: "The page you're looking for doesn't exist or has been moved." },
  403: { icon: Lock,        code: '403', title: 'Access denied',        message: "You don't have permission to view this page." },
  401: { icon: Lock,        code: '401', title: 'Not authenticated',    message: 'You need to sign in to access this page.' },
  500: { icon: ServerCrash, code: '500', title: 'Server error',         message: 'Something went wrong on our end. Please try again in a moment.' },
}
const DEFAULT = { icon: AlertTriangle, code: 'Oops', title: 'Something went wrong', message: 'An unexpected error occurred. Please try again.' }

export default function ErrorPage({ code }) {
  const navigate   = useNavigate()
  const routeError = useRouteError?.()

  let errorCode = code
  if (!errorCode && routeError && isRouteErrorResponse(routeError)) {
    errorCode = routeError.status
  }

  const { icon: Icon, code: displayCode, title, message } = ERRORS[errorCode] ?? DEFAULT

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg,#07061A 0%,#0D0A2E 40%,#140E3E 70%,#1C1152 100%)' }}>

      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
        backgroundSize: '55px 55px',
      }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 65%)', filter: 'blur(80px)' }} />

      <div className="relative z-10 flex flex-col items-center max-w-md">

        <div className="flex items-center gap-2 mb-12">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
            <Shield size={13} className="text-white" />
          </div>
          <span className="text-base font-bold font-heading text-white/80">Nuzuh</span>
        </div>

        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <Icon size={28} style={{ color: '#A5B4FC' }} />
        </div>

        <p className="text-7xl font-bold font-heading mb-3 tracking-tight"
          style={{ background: 'linear-gradient(125deg,#A78BFA 0%,#818CF8 50%,#C4B5FD 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {displayCode}
        </p>

        <h1 className="text-xl font-semibold font-heading text-white mb-3">{title}</h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>{message}</p>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}
            className="border-white/10! text-white/60! hover:text-white/90! hover:bg-white/5!">
            <ArrowLeft size={14} /> Go back
          </Button>
          <Button onClick={() => navigate('/')}>
            <Home size={14} /> Home
          </Button>
        </div>
      </div>
    </div>
  )
}
