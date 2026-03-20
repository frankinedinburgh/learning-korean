'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface NavProps {
  dueCount?: number
}

export default function Nav({ dueCount = 0 }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const tabs = [
    { href: '/study', label: 'Study' },
    { href: '/deck', label: 'Deck' },
    { href: '/stats', label: 'Stats' },
  ]

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border relative z-10">
      <div className="font-serif text-xl italic text-white">
        한국어 <span className="text-accent">flashcards</span>
      </div>

      <nav className="flex gap-1 bg-surface p-1 rounded-xl border border-border">
        {tabs.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-lg text-xs tracking-widest uppercase transition-all ${
              pathname === tab.href
                ? 'bg-surface2 text-white border border-border'
                : 'text-muted hover:text-white'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <span className="text-xs text-muted">
          Due: <span className="text-accent">{dueCount}</span>
        </span>
        <button
          onClick={signOut}
          className="text-xs text-muted hover:text-white transition-colors tracking-widest uppercase"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
