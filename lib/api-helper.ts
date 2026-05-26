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


export function withLogging<T>(fn: () => Promise<T>, label: string): () => Promise<T> {
  return async () => {
    try {
      console.log(`[${label} starting]`)
      const result = await fn()
      console.log(`[${label} done]`)
      return result
    } catch (error) {
      console.log(`[${label} error]`)
      throw error
    }
  }
}
