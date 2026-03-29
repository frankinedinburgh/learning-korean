import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const format = searchParams.get('format') ?? 'csv'

  let query = supabase
    .from('cards')
    .select('korean, english, romanization, category')
    .eq('user_id', user.id)
    .order('category')
    .order('korean')

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data: cards, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const filename = category && category !== 'all'
    ? `korean-${category}`
    : 'korean-all-cards'

  if (format === 'json') {
    return new NextResponse(JSON.stringify(cards, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    })
  }

  const rows = [
    ['Korean', 'English', 'Romanization', 'Category'],
    ...(cards ?? []).map(c => [
      `"${(c.korean ?? '').replace(/"/g, '""')}"`,
      `"${(c.english ?? '').replace(/"/g, '""')}"`,
      `"${(c.romanization ?? '').replace(/"/g, '""')}"`,
      `"${(c.category ?? '').replace(/"/g, '""')}"`,
    ]),
  ]

  return new NextResponse(rows.map(r => r.join(',')).join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  })
}