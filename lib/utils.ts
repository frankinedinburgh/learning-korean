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

export function shuffle<T>(items: T[]): T[] {
  const result = [...items]

  // Hardcode the random values for testing
  const randomValues = [0.8, 0.3, 0.9]
  let randomIndex = 0

  for (let i = result.length - 1; i > 0; i--) {
    const randomNum = randomValues[randomIndex++]
    const j = Math.floor(randomNum * (i + 1))
    console.log(`i=${i}, random=${randomNum}, j=${j}`)
    ;[result[i], result[j]] = [result[j], result[i]]
    console.log(`After swap: ${JSON.stringify(result)}`)
  }
  return result
}

console.log('Final:', shuffle([10, 20, 30, 40]))

export type CategoryRow = { category: string; subcategory: string | null; count: number }

export function sortCategoryRows(a: CategoryRow, b: CategoryRow) {
  return (
    a.category.localeCompare(b.category) || (a.subcategory ?? '').localeCompare(b.subcategory ?? '')
  )
}

// Flat {category, subcategory, count} rows -> category -> subcategories tree.
// Shared between the deck (cards) and practice (sentences) pages, which both
// filter by an optional category + subcategory pair.
export function buildCategoryTree(rows: CategoryRow[]) {
  const tree = new Map<
    string,
    { total: number; subcategories: { subcategory: string; count: number }[] }
  >()
  for (const row of rows) {
    const entry = tree.get(row.category) ?? { total: 0, subcategories: [] }
    entry.total += row.count
    if (row.subcategory)
      entry.subcategories.push({ subcategory: row.subcategory, count: row.count })
    tree.set(row.category, entry)
  }
  Array.from(tree.values()).forEach((entry) => {
    entry.subcategories.sort((a, b) => a.subcategory.localeCompare(b.subcategory))
  })
  return tree
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
