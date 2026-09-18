'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface INavTabs {
  tabs: { href: string; label: string }[]
  onClose: () => void
}

export default function NavTabs({ tabs, onClose }: INavTabs) {
  const pathname = usePathname()

  return (
    <>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          onClick={onClose}
          className={`px-4 py-1.5 rounded-lg text-xs tracking-widest uppercase transition-all ${
            pathname === tab.href
              ? 'bg-surface2 text-white border border-border'
              : 'text-muted hover:text-white'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </>
  )
}
