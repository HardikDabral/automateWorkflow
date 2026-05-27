'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Sparkles } from 'lucide-react'

export function AnimatedHero() {
  const ringARef = useRef<HTMLDivElement>(null)
  const ringBRef = useRef<HTMLDivElement>(null)
  const ringCRef = useRef<HTMLDivElement>(null)
  const ringDRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(ringARef.current, { rotateX: 75, rotateZ: 0 })
      gsap.set(ringBRef.current, { rotateY: 75, rotateZ: 0 })
      gsap.set(ringCRef.current, { rotateX: 55, rotateY: 35, rotateZ: 0 })
      gsap.set(ringDRef.current, { rotateX: -30, rotateY: 60, rotateZ: 0 })

      gsap.to(ringARef.current, {
        rotateZ: '+=360',
        duration: 20,
        repeat: -1,
        ease: 'none',
      })
      gsap.to(ringBRef.current, {
        rotateZ: '-=360',
        duration: 16,
        repeat: -1,
        ease: 'none',
      })
      gsap.to(ringCRef.current, {
        rotateZ: '-=360',
        duration: 24,
        repeat: -1,
        ease: 'none',
      })
      gsap.to(ringDRef.current, {
        rotateZ: '+=360',
        duration: 28,
        repeat: -1,
        ease: 'none',
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <section className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-[color:var(--surface-2)] via-[color:var(--surface)] to-[color:var(--surface)] border-r border-[color:var(--border)] relative overflow-hidden">
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden
      >
        <div
          className="scene-3d relative"
          style={{ width: 'min(70vh, 560px)', height: 'min(70vh, 560px)' }}
        >
          <div ref={ringARef} className="ring" />
          <div ref={ringBRef} className="ring" style={{ inset: '10%' }} />
          <div ref={ringCRef} className="ring" style={{ inset: '22%' }} />
          <div ref={ringDRef} className="ring" style={{ inset: '36%' }} />
        </div>
      </div>

      <div className="relative z-10">
        <div className="h-10 w-10 rounded-xl bg-[rgb(var(--tint)/0.1)] grid place-items-center mb-6">
          <Sparkles className="h-5 w-5 text-[color:var(--foreground)]" />
        </div>
        <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-2">
          Automation · new era
        </div>
        <h2 className="text-4xl font-semibold tracking-tight leading-tight max-w-md">
          Design workflows that{' '}
          <span className="text-[color:var(--muted)]">think</span> with you.
        </h2>
        <p className="mt-4 text-sm text-[color:var(--muted)] max-w-md">
          Describe automations in plain English — the AI drafts them on the canvas. You tweak,
          activate, and we run them on every matching event.
        </p>
      </div>

      <div className="relative z-10 text-xs text-[color:var(--muted-2)]">
        © {new Date().getFullYear()} Workflow Platform
      </div>
    </section>
  )
}
