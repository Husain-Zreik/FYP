import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { Shield, ArrowLeft, Home, AlertTriangle, Lock, ServerCrash, Search } from 'lucide-react'

const ERRORS = {
  404: {
    icon:    Search,
    code:    '404',
    title:   'Page not found',
    message: "The page you're looking for doesn't exist or has been moved.",
    color:   'text-secondary',
    bg:      'bg-secondary/10',
  },
  403: {
    icon:    Lock,
    code:    '403',
    title:   'Access denied',
    message: "You don't have permission to view this page.",
    color:   'text-warning',
    bg:      'bg-warning-surface',
  },
  401: {
    icon:    Lock,
    code:    '401',
    title:   'Not authenticated',
    message: 'You need to sign in to access this page.',
    color:   'text-warning',
    bg:      'bg-warning-surface',
  },
  500: {
    icon:    ServerCrash,
    code:    '500',
    title:   'Server error',
    message: 'Something went wrong on our end. Please try again in a moment.',
    color:   'text-danger',
    bg:      'bg-danger-surface',
  },
}

const DEFAULT_ERROR = {
  icon:    AlertTriangle,
  code:    'Oops',
  title:   'Something went wrong',
  message: 'An unexpected error occurred. Please try again.',
  color:   'text-danger',
  bg:      'bg-danger-surface',
}

// Can be used as a React Router errorElement OR as a standalone page
export default function ErrorPage({ code }) {
  const navigate    = useNavigate()
  const routeError  = useRouteError?.()

  // Determine which error to show
  let errorCode = code
  if (!errorCode && routeError) {
    if (isRouteErrorResponse(routeError)) {
      errorCode = routeError.status
    }
  }

  const config = ERRORS[errorCode] ?? DEFAULT_ERROR
  const Icon   = config.icon

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'linear-gradient(160deg,#07061A 0%,#0D0A2E 40%,#140E3E 70%,#1C1152 100%)' }}>

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
        backgroundSize: '55px 55px',
      }} />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 65%)', filter: 'blur(80px)' }} />

      <div className="relative z-10 flex flex-col items-center max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-12">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
            <Shield size={13} className="text-white" />
          </div>
          <span className="text-base font-bold font-heading tracking-tight text-white/80">Nuzuh</span>
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <Icon size={28} style={{ color: '#A5B4FC' }} />
        </div>

        {/* Code */}
        <p className="text-7xl font-bold font-heading mb-3 tracking-tight"
          style={{
            background: 'linear-gradient(125deg,#A78BFA 0%,#818CF8 50%,#C4B5FD 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
          {config.code}
        </p>

        {/* Title */}
        <h1 className="text-xl font-semibold font-heading text-white mb-3">
          {config.title}
        </h1>

        {/* Message */}
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {config.message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#A5B4FC' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'  }}>
            <ArrowLeft size={14} /> Go back
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', boxShadow: '0 0 20px rgba(124,58,237,0.35)' }}>
            <Home size={14} /> Home
          </button>
        </div>

      </div>
    </div>
  )
}
