'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Toggle from './Toggle'
import NavTabs from './NavTabs'

interface NavProps {
  dueCount?: number
}

export default function Nav({ dueCount = 0 }: NavProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const onClose = () => {
    setIsOpen(false)
  }

  const tabs = [
    { href: '/study', label: 'Study' },
    { href: '/practice', label: 'Practice' },
    { href: '/deck', label: 'Deck' },
    { href: '/stats', label: 'Stats' },
  ]

  return (
    <header className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-b border-border relative">
      <button className="md:hidden text-2xl" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>

      <div className="font-serif text-xl italic text-foreground">
        한국어 <span className="text-accent">flashcards</span>
      </div>

      {/* Backdrop overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />}

      {/* Menu slides in on top */}
      <div
        className={`
    flex flex-col gap-2 p-4
    absolute top-full left-0 right-0 bg-black z-50
    transition-all duration-300
    ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
  `}
      >
        <NavTabs tabs={tabs} onClose={onClose} />
      </div>

      <nav className="hidden md:flex gap-1 bg-black p-1 rounded-xl border border-border">
        <NavTabs tabs={tabs} onClose={onClose} />
      </nav>

      <div className="flex items-center gap-4">
        <Toggle />
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
