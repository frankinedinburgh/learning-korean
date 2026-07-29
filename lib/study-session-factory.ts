export interface SessionConfig {
  endpoint: string
  label: string
}

function buildEndpoint(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  return `/api/cards?${search}`
}

export const StudySessionFactory = {
  allDue: (): SessionConfig => ({
    endpoint: buildEndpoint({ due: 'true' }),
    label: 'All cards due',
  }),
  byCategory: (category: string, subcategory?: string): SessionConfig => ({
    endpoint: buildEndpoint({ due: 'true', category, subcategory }),
    label: subcategory ? `Due cards - ${category} / ${subcategory}` : `Due cards - ${category}`,
  }),
  fullCategory: (category: string, subcategory?: string): SessionConfig => ({
    endpoint: buildEndpoint({ category, subcategory }),
    label: subcategory ? `All cards - ${category} / ${subcategory}` : `All cards - ${category}`,
  }),
}
