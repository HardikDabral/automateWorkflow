import { AnimatedHero } from '@/components/auth/AnimatedHero'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[color:var(--background)] grid lg:grid-cols-[1fr_1.1fr]">
      <AnimatedHero />
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  )
}
