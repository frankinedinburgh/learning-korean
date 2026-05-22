import { NextResponse } from "next/server"

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  statusCode: number = 200
): Promise<NextResponse> {
  try {
    const result = await fn()
    return NextResponse.json(result, { status: statusCode })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
