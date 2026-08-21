// Supabase/PostgREST caps rows per request at 1000 (db-max-rows) regardless
// of how large a `.range()` is requested, so fetching a full table beyond
// that count requires looping pages and concatenating the results.
const MAX_ROWS_PER_PAGE = 1000

export async function fetchAllRows<T>(
  buildQuery: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = []
  let from = 0
  while (true) {
    const { data, error } = await buildQuery(from, from + MAX_ROWS_PER_PAGE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < MAX_ROWS_PER_PAGE) break
    from += MAX_ROWS_PER_PAGE
  }
  return rows
}
