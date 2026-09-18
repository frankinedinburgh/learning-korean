# Korean Flashcards - Mobile UX Improvements

## Current Status: Mobile readability issues
**Date started:** 2026-09-12

## Problem
On mobile (iPhone 12 Pro), the flashcard UI is not optimized:
- Korean text (text-5xl) is too small for mobile readability
- Card height (h-72 = 288px) is fixed, not responsive
- Padding (p-8) is too generous on small screens
- Button layout might wrap awkwardly on small devices

## Solution: Responsive Tailwind classes
Make the Flashcard component responsive using Tailwind's mobile-first approach:
- Korean text: `text-4xl md:text-5xl` (larger on mobile)
- Card height: `h-64 md:h-72` (smaller on mobile)
- Padding: `p-4 md:p-8` (tighter on mobile)
- Buttons: Ensure proper layout on small screens

## Files to modify
- `components/Flashcard.tsx` - Main flashcard styling

## Phase
Phase 1: Mobile UX improvements (Week 1)

## Notes
- Use Tailwind's responsive prefixes (no sm: prefix, mobile-first)
- Test on actual mobile device or browser devtools
- Keep design consistent with existing theme
