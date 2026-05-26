'use client'

import { useState } from 'react'

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false)

  function toggle() {
    const next = !isLight
    setIsLight(next)
    document.documentElement.dataset.theme = next ? 'light' : ''
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={isLight ? 'true' : 'false'}
      aria-label="Toggle light mode"
      className={`relative w-12 h-6 rounded-full border transition-colors duration-300 ${
        isLight ? 'bg-accent border-accent' : 'bg-surface2 border-border'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow transition-transform duration-300 flex items-center justify-center text-[9px] leading-none ${
          isLight ? 'translate-x-6 bg-bg text-accent' : 'translate-x-0 bg-muted text-bg'
        }`}
      >
        {isLight ? '☀' : '☾'}
      </span>
    </button>
  )
}
