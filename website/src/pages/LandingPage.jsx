import { useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight, ChevronDown, Shield, Users, BarChart3,
  MapPin, FileCheck, AlertTriangle, HeartHandshake, Radio,
} from 'lucide-react'
import Map from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useAuthStore } from '../store/authStore'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

function LebanonMap() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden"
      style={{
        height: 'min(520px, 72vh)',
        boxShadow: '0 0 60px rgba(99,102,241,0.35), 0 0 120px rgba(124,58,237,0.15)',
      }}>
      <Map
        initialViewState={{ longitude: 35.85, latitude: 33.85, zoom: 7.4 }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        interactive={false}
        attributionControl={false}
      />
    </div>
  )
}

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Shield,        title: 'Role-based access',    desc: 'Five distinct roles with granular permissions scoped to shelter or system-wide.' },
  { icon: MapPin,        title: 'Live shelter tracking', desc: 'Know exactly how many people are in every shelter, in every district, right now.' },
  { icon: HeartHandshake,title: 'Civilian management',  desc: 'Register, admit, and track displaced civilians with full profile history.' },
  { icon: BarChart3,     title: 'Government reports',   desc: 'Exportable reports for planning, compliance, and international aid coordination.' },
  { icon: Radio,         title: 'Real-time sync',        desc: 'Field updates propagate instantly. Government sees everything as it happens.' },
  { icon: AlertTriangle, title: 'Capacity alerts',       desc: 'Automatic warnings when shelters approach maximum capacity thresholds.' },
]

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Mission',  href: '#mission'  },
]

// ─── Page ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })

  const mapY        = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])
  const mapOpacity  = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const bgY         = useTransform(scrollYProgress, [0, 1], ['0%', '-10%'])
  const textY       = useTransform(scrollYProgress, [0, 1], ['0%', '-30%'])
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const user = useAuthStore((s) => s.user)
  if (isAuthenticated) {
    return <Navigate to={user?.access_point === 'shelter' ? '/shelter' : '/dashboard'} replace />
  }

  return (
    <div className="bg-background overflow-x-hidden">

      {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 inset-x-0 z-50 h-16"
        style={{ background: 'rgba(10,8,30,0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
              <Shield size={13} className="text-white" />
            </div>
            <span className="text-base font-bold font-heading tracking-tight" style={{ color: '#EEF2FF' }}>
              Nuzuh
            </span>
          </div>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ label, href }) => (
              <a key={label} href={href}
                className="text-sm font-medium transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <Link to="/login"
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)', color: '#A5B4FC' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.22)' }}>
            Sign in <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#07061A 0%,#0D0A2E 35%,#140E3E 65%,#1C1152 100%)' }}>

        <motion.div className="absolute inset-0 pointer-events-none" style={{
          y: bgY,
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)',
          backgroundSize: '55px 55px',
        }} />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute rounded-full" style={{ top: '20%', left: '8%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)', filter: 'blur(80px)' }} />
          <div className="absolute rounded-full" style={{ top: '50%', right: '5%', width: 380, height: 380, background: 'radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 70%)', filter: 'blur(90px)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 min-h-screen flex flex-col lg:flex-row items-center gap-12 lg:gap-8 pt-24 pb-16 lg:pt-0 lg:pb-0">

          {/* LEFT — map */}
          <motion.div className="w-full lg:w-[48%] flex items-center justify-center"
            style={{ y: mapY, opacity: mapOpacity }}>
            <LebanonMap />
          </motion.div>

          {/* RIGHT — text */}
          <motion.div className="w-full lg:w-[52%] flex flex-col items-start"
            style={{ y: textY, opacity: textOpacity }}>

            <div className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full mb-8"
              style={{ border: '1px solid rgba(99,102,241,0.28)', background: 'rgba(99,102,241,0.07)', color: '#A5B4FC', animation: 'hero-fade 0.9s 0.1s both' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Emergency Shelter Management — Lebanon
            </div>

            <h1 className="font-bold font-heading text-white tracking-tight mb-6"
              style={{ fontSize: 'clamp(2.4rem, 4.5vw, 4rem)', lineHeight: 1.08, animation: 'hero-fade 0.9s 0.3s both' }}>
              When people are<br />
              <span style={{ background: 'linear-gradient(125deg,#A78BFA 0%,#818CF8 50%,#C4B5FD 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                displaced by war.
              </span>
            </h1>

            <p className="text-lg leading-relaxed mb-10 max-w-lg"
              style={{ color: 'rgba(255,255,255,0.42)', animation: 'hero-fade 0.9s 0.5s both' }}>
              Nuzuh connects Lebanon's government, shelter facilities, and displaced
              civilians — so no one falls through the cracks.
            </p>

            <div className="flex items-center gap-4" style={{ animation: 'hero-fade 0.9s 0.7s both' }}>
              <Link to="/login"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', boxShadow: '0 0 30px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
                Access the platform <ArrowRight size={14} />
              </Link>
              <a href="#features" className="text-sm font-medium transition-colors"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                onMouseEnter={e => (e.target.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={e => (e.target.style.color = 'rgba(255,255,255,0.35)')}>
                Learn more
              </a>
            </div>

            <div className="flex items-center gap-8 mt-12 pt-8 border-t w-full"
              style={{ borderColor: 'rgba(99,102,241,0.16)', animation: 'hero-fade 0.9s 0.9s both' }}>
              {[
                { value: '1.5M+', label: 'Displaced civilians' },
                { value: '400+', label: 'Shelters' },
                { value: '24/7',  label: 'Live coordination' },
              ].map(({ value, label }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold font-heading text-white">{value}</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}>
          <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.16)' }}>Scroll</span>
          <ChevronDown size={13} style={{ color: 'rgba(255,255,255,0.16)' }} />
        </motion.div>
      </section>

      {/* ══ MISSION STRIP ═══════════════════════════════════════════════════ */}
      <section id="mission" className="py-20 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <span className="inline-block text-xs font-semibold text-secondary uppercase tracking-widest mb-4">
              Why Nuzuh exists
            </span>
            <h2 className="text-3xl font-bold font-heading text-text leading-tight mb-5">
              Lebanon needed a<br />coordination layer.
            </h2>
            <p className="text-text-muted leading-relaxed max-w-xl">
              Conflict and displacement have put hundreds of thousands of Lebanese
              civilians in emergency shelters. Aid organisations, ministries, and shelter
              operators are working in silos — without a shared view of who is where,
              what's available, and what's needed. Nuzuh is that layer.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:w-80 shrink-0">
            {[
              { icon: AlertTriangle, label: 'Crisis response',     desc: 'Activate shelters in minutes.' },
              { icon: MapPin,        label: 'Location tracking',    desc: 'Know where every person is.' },
              { icon: Users,         label: 'Family reunification', desc: 'Link profiles across the system.' },
              { icon: FileCheck,     label: 'Audit trail',          desc: 'Full log of every action.' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-surface border border-border rounded-xl p-4">
                <Icon size={15} className="text-secondary mb-2" />
                <p className="text-xs font-semibold text-text mb-0.5">{label}</p>
                <p className="text-[11px] text-text-muted leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20 bg-surface">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold text-secondary uppercase tracking-widest mb-4">
              Platform features
            </span>
            <h2 className="text-3xl font-bold font-heading text-text mb-3">
              Built for the field
            </h2>
            <p className="text-text-muted max-w-md mx-auto text-sm">
              Every feature designed around real shelter operations under pressure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="group bg-background border border-border rounded-2xl p-6 hover:border-border-2 hover:shadow-sm transition-all duration-200">
                <div className="w-9 h-9 bg-surface-2 rounded-xl flex items-center justify-center mb-4 group-hover:bg-tertiary transition-colors">
                  <Icon size={16} className="text-secondary" />
                </div>
                <h3 className="font-semibold font-heading text-text mb-1.5 text-sm">{title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
                  <Shield size={11} className="text-white" />
                </div>
                <span className="text-sm font-bold font-heading text-text">Nuzuh</span>
              </div>
              <p className="text-xs text-text-subtle max-w-[200px] leading-relaxed">
                Shelter management for Lebanon's displaced population.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-12">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold text-text-subtle uppercase tracking-widest mb-1">Platform</span>
                {[
                  { label: 'Features', href: '#features' },
                  { label: 'Mission',  href: '#mission'  },
                ].map(({ label, href }) => (
                  <a key={label} href={href} className="text-xs text-text-muted hover:text-text transition-colors">{label}</a>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold text-text-subtle uppercase tracking-widest mb-1">Access</span>
                <Link to="/login" className="text-xs text-text-muted hover:text-text transition-colors">Sign in</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-text-subtle">© 2026 Nuzuh. All rights reserved.</p>
            <p className="text-[11px] text-text-subtle">Built for Lebanon.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
