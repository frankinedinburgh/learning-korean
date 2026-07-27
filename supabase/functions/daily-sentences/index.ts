import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const USER_EMAIL = Deno.env.get('USER_EMAIL')! // frankhaguemail@gmail.com

const THEMES = [
  'morning routine',
  'going for a run',
  'eating breakfast',
  'visiting family',
  'shopping at the market',
  'watching a movie',
  'cooking dinner',
  'walking in the park',
  'travelling by train',
  'a rainy day at home',
  'meeting a friend for coffee',
  'playing with your daughter',
  'a family meal',
  'exploring a new neighbourhood',
  'a quiet evening at home',
  'going to the gym',
  'a sunny day out',
  'preparing for work',
  'a phone call with family',
  'trying new Korean food',
]

Deno.serve(async () => {
  try {
    // Pick a random theme
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)]

    // Generate sentences with Claude
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `You are a Korean language teacher creating daily writing practice sentences for an adult beginner learner. 
Generate exactly 3 connected Korean sentences around the given theme that tell a short story.
Use simple, everyday vocabulary and polite 해요체 speech level.
Respond ONLY with valid JSON, no markdown, no preamble:
{
  "theme": "theme name",
  "sentences": [
    {"korean": "...", "english": "...", "romanization": "..."},
    {"korean": "...", "english": "...", "romanization": "..."},
    {"korean": "...", "english": "...", "romanization": "..."}
  ]
}`,
        messages: [
          {
            role: 'user',
            content: `Theme: ${theme}`,
          },
        ],
      }),
    })

    const claudeData = await claudeRes.json()
    const text = claudeData.content?.[0]?.text ?? ''
    const parsed = JSON.parse(text.trim())
    const [s1, s2, s3] = parsed.sentences

    // Save to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', USER_EMAIL)
      .single()

    await supabase.from('daily_emails').insert({
      user_id: user?.id,
      theme: parsed.theme,
      sentence_1_korean: s1.korean,
      sentence_1_english: s1.english,
      sentence_1_romanization: s1.romanization,
      sentence_2_korean: s2.korean,
      sentence_2_english: s2.english,
      sentence_2_romanization: s2.romanization,
      sentence_3_korean: s3.korean,
      sentence_3_english: s3.english,
      sentence_3_romanization: s3.romanization,
    })

    // Send email via Resend
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Korean Daily <daily@yourdomain.com>',
        to: USER_EMAIL,
        subject: `오늘의 한국어 ✍️ — ${parsed.theme}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; background: #0d0d0f; color: #f0eff5; padding: 32px; max-width: 600px; margin: 0 auto; }
    h1 { font-size: 1.4rem; font-style: italic; color: #e8c547; margin-bottom: 4px; }
    .subtitle { font-size: 0.75rem; color: #7a7a8a; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 32px; }
    .sentence { background: #16161a; border: 1px solid #2a2a35; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    .number { font-size: 0.65rem; color: #7a7a8a; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
    .korean { font-size: 1.5rem; font-weight: bold; color: #f0eff5; margin-bottom: 6px; font-family: 'Noto Sans KR', sans-serif; }
    .romanization { font-size: 0.85rem; color: #7c6af7; margin-bottom: 6px; font-family: monospace; }
    .english { font-size: 0.95rem; font-style: italic; color: #7a7a8a; }
    .task { background: #1e1e24; border: 1px solid #e8c547; border-radius: 12px; padding: 20px; margin-top: 24px; }
    .task h2 { color: #e8c547; font-size: 0.9rem; margin-bottom: 8px; }
    .task p { color: #7a7a8a; font-size: 0.85rem; line-height: 1.6; }
    .footer { margin-top: 32px; font-size: 0.75rem; color: #7a7a8a; text-align: center; }
  </style>
</head>
<body>
  <h1>오늘의 한국어</h1>
  <p class="subtitle">Daily Korean Writing Practice — ${parsed.theme}</p>

  <div class="sentence">
    <div class="number">Sentence 1</div>
    <div class="korean">${s1.korean}</div>
    <div class="romanization">${s1.romanization}</div>
    <div class="english">${s1.english}</div>
  </div>

  <div class="sentence">
    <div class="number">Sentence 2</div>
    <div class="korean">${s2.korean}</div>
    <div class="romanization">${s2.romanization}</div>
    <div class="english">${s2.english}</div>
  </div>

  <div class="sentence">
    <div class="number">Sentence 3</div>
    <div class="korean">${s3.korean}</div>
    <div class="romanization">${s3.romanization}</div>
    <div class="english">${s3.english}</div>
  </div>

  <div class="task">
    <h2>✍️ Your task today</h2>
    <p>Write out all three sentences by hand in Korean. Then try writing your own version of the story — change one detail to make it about your day. Say all three sentences out loud to your wife.</p>
  </div>

  <div class="footer">한국어 Flashcards · Unsubscribe</div>
</body>
</html>`,
      }),
    })

    return new Response(JSON.stringify({ success: true, theme }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
