import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CardsRepository } from '@/lib/repositories/card'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const subcategory = searchParams.get('subcategory')
  const format = searchParams.get('format') ?? 'csv'

  const cards = await CardsRepository.getCardsForExport(
    user.id,
    category ?? undefined,
    subcategory ?? undefined
  )

  const filename = [
    'korean',
    category && category !== 'all' ? category : 'all-cards',
    subcategory || null,
  ]
    .filter(Boolean)
    .join('-')

  if (format === 'json') {
    return new NextResponse(JSON.stringify(cards, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    })
  }

  // Prefix a leading apostrophe on fields starting with =, +, -, or @ so
  // spreadsheet apps (Excel/Sheets) treat them as text, not formulas.
  const csvSafe = (value: string) =>
    /^[=+\-@]/.test(value) ? `'${value}` : value

  const rows = [
    ['Korean', 'English', 'Romanization', 'Category', 'Subcategory'],
    ...(cards ?? []).map(c => [
      `"${csvSafe(c.korean ?? '').replace(/"/g, '""')}"`,
      `"${csvSafe(c.english ?? '').replace(/"/g, '""')}"`,
      `"${csvSafe(c.romanization ?? '').replace(/"/g, '""')}"`,
      `"${csvSafe(c.category ?? '').replace(/"/g, '""')}"`,
      `"${csvSafe(c.subcategory ?? '').replace(/"/g, '""')}"`,
    ]),
  ]

  return new NextResponse(rows.map(r => r.join(',')).join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  })
}