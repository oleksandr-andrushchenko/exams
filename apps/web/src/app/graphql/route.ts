const API_URL = process.env.API_BASE_URL || 'http://localhost:8080'

export const runtime = 'nodejs'

async function handle(request: Request): Promise<Response> {
  const headers = new Headers(request.headers)
  headers.delete('host')
  const response = await fetch(API_URL, {
    method: request.method,
    headers,
    body: request.method === 'GET' ? undefined : await request.arrayBuffer(),
    cache: 'no-store',
  })
  return new Response(response.body, {status: response.status, headers: response.headers})
}

export const GET = handle
export const POST = handle
