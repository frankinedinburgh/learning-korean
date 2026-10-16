import { requireUser } from '@/lib/auth'
import { SentencesRepository } from '@/lib/repositories/sentence'
import PracticeClient from './client'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category: string | undefined; subcategory: string | undefined }>
}) {
  const user = await requireUser()
  const { category: activeCategory, subcategory: activeSubcategory } = await searchParams

  const [categoryRows, sentences] = await Promise.all([
    SentencesRepository.getCategorySummary(user.id),
    SentencesRepository.getSentences(user.id, {
      category: activeCategory ?? undefined,
      subcategory: activeSubcategory ?? undefined,
    }),
  ])

  return (
    <div>
      <main>
        <PracticeClient
          category={activeCategory}
          subcategory={activeSubcategory}
          initalCategoryRows={categoryRows}
          sentenceList={sentences}
        />
      </main>
    </div>
  )
}
