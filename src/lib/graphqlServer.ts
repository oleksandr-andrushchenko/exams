const API_URL = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:8080'

export async function graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`GraphQL request failed: ${response.status}`)
  const result = await response.json()
  if (result.errors?.length) throw new Error(result.errors.map((e: { message: string }) => e.message).join('\n'))
  return result.data as T
}
