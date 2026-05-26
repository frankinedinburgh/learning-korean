import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function groupBy<T>(items: T[], getKey: (item: T) => string): Record<string, T[]> {
  return items.reduce(
    (acc, val) => {
      return {
        ...acc,
        [getKey(val)]: [...(acc[getKey(val)] ?? []), val],
      }
    },
    {} as Record<string, T[]>
  )
}

export function chunk<T>(group: T[], size: number): T[][] {
  let result = []
  for (let i = 0; i < group.length; i += size) {
    result.push(group.slice(i, i + size))
  }

  return result
}

export function flattenCategories<T>(decks: { name: string; cards: T[] }[]) {
  return decks.flatMap((deck) => {
    return deck.cards.map((card) => {
      return {
        ...card,
        deckName: deck.name,
      }
    })
  })
}
