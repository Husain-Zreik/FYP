import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Shield, Users, BarChart3, ArrowRight, CheckCircle } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Role-based access',
    desc: 'Five distinct roles with granular permissions. Shelter staff see only their data — government and admin have full visibility.',
  },
  {
    icon: Users,
    title: 'Civilian management',
    desc: 'Register, admit, and discharge civilians with complete profiles, location tracking, and history.',
  },
  {
    icon: BarChart3,
    title: 'Reporting & oversight',
    desc: 'Government staff access real-time reports across all shelters. Export data for compliance and planning.',
  },
]

const stats = [
  { value: '5',    label: 'Role types'       },
  { value: '25',   label: 'Permissions'      },
  { value: '100%', label: 'API-first design' },
]

export default function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Shield size={14} className="text-primary-foreground" />
            </div>
            <span className="text-base font-bold font-heading text-text tracking-tight">Nuzuh</span>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text transition-colors"
          >
            Sign in <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-28">
        <div className="inline-flex items-center gap-2 bg-surface border border-border text-text-muted text-xs font-medium px-4 py-2 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-success rounded-full" />
          Shelter Management Platform
        </div>

        <h1 className="text-6xl font-bold font-heading text-text leading-[1.1] tracking-tight mb-6 max-w-3xl">
          Manage shelters,<br />
          <span className="text-text-muted">support civilians.</span>
        </h1>

        <p className="text-lg text-text-muted leading-relaxed mb-10 max-w-xl">
          Nuzuh unifies shelter administrators, government staff, and
          field workers in one secure platform built for rapid deployment.
        </p>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm"
          >
            Get started <ArrowRight size={14} />
          </Link>
          <a href="#features" className="text-sm font-medium text-text-muted hover:text-text transition-colors">
            Learn more
          </a>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-3 divide-x divide-border">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 px-8">
              <span className="text-3xl font-bold font-heading text-text">{value}</span>
              <span className="text-sm text-text-muted">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto w-full px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold font-heading text-text mb-3">
            Everything you need
          </h2>
          <p className="text-text-muted max-w-md mx-auto">
            Built for the full lifecycle of shelter operations — from intake to reporting.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group bg-background border border-border rounded-2xl p-6 hover:border-border-2 hover:shadow-sm transition-all duration-200"
            >
              <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center mb-4 group-hover:bg-tertiary transition-colors">
                <Icon size={18} className="text-text-muted" />
              </div>
              <h3 className="font-semibold font-heading text-text mb-2">{title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto w-full px-6 pb-24">
        <div className="bg-primary rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold font-heading text-primary-foreground mb-3">
            Ready to get started?
          </h2>
          <p className="text-primary-foreground/60 mb-8 max-w-md mx-auto">
            Sign in to access your shelter management dashboard.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-background text-text px-6 py-3 rounded-xl text-sm font-medium hover:bg-surface transition-colors"
          >
            Sign in to dashboard <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded-md flex items-center justify-center">
              <Shield size={10} className="text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-text">Nuzuh</span>
          </div>
          <p className="text-xs text-text-subtle">© 2026 Nuzuh. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
