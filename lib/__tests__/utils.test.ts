import { groupBy, chunk, flattenCategories } from '@/lib/utils'
describe('groupBy', () => {
  it('groups items by key into separate arrays', () => {
    // you know this before writing a single line of groupBy
    expect(
      groupBy(
        [{ category: 'animals' }, { category: 'food' }, { category: 'animals' }],
        (item) => item.category
      )
    ).toEqual({
      animals: [{ category: 'animals' }, { category: 'animals' }],
      food: [{ category: 'food' }],
    })
  })

  it('Empty array returns empty object', () => {
    expect(groupBy([], (item) => item.category)).toEqual({})
  })

  it('puts all same-key items into one array', () => {
    expect(groupBy(['a', 'b', 'c'], () => 'same')).toEqual({ same: ['a', 'b', 'c'] })
  })
})

describe('chunk', () => {
  it('should split array into groups of given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk(['a', 'b', 'c'], 3)).toEqual([['a', 'b', 'c']])
  })
})

describe('flattenCategories', () => {
  it('Each card in the output gets a deckName: string added', () => {
    const decks = [
      { name: 'Animals', cards: [{ korean: '개' }, { korean: '고양이' }] },
      { name: 'Food', cards: [{ korean: '밥' }] },
    ]

    expect(flattenCategories(decks)).toEqual([
      { korean: '개', deckName: 'Animals' },
      { korean: '고양이', deckName: 'Animals' },
      { korean: '밥', deckName: 'Food' },
    ])
  })
})
