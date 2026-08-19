import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { getErrorStatus } from './errors'

export const asyncHandler =
  (handler: (request: Request, response: Response, next: NextFunction) => unknown): RequestHandler =>
    (request, response, next) =>
      Promise.resolve(handler(request, response, next)).catch(next)

export const queryObject = (query: Request['query']): Record<string, unknown> => {
  const result: Record<string, unknown> = {}
  for (const [ key, value ] of Object.entries(query)) {
    const item = Array.isArray(value) ? value[0] : value
    result[key] = typeof item === 'string' && item.trim() !== '' && Number.isFinite(Number(item)) ? Number(item) : item
  }
  return result
}

export const getRequestAccessToken = (request: Request): string | undefined => {
  const authorization = request.headers.authorization
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7)

  const cookies = request.headers.cookie?.split(';').map((cookie) => cookie.trim()) ?? []
  const token = cookies.find((cookie) => cookie.startsWith('authenticationToken='))
  return token ? decodeURIComponent(token.slice('authenticationToken='.length)) : undefined
}

export type ControllerHandler = (request: Request, response: Response, next: NextFunction) => unknown

export const controllerRoute = (controller: object, method: string, format: 'json' | 'html' = 'json'): RequestHandler =>
  asyncHandler(async (request, response) => {
    try {
      const handler = (controller as Record<string, ControllerHandler>)[method]
      await handler.call(controller, request, response, () => undefined)
    } catch (error) {
      const status = getErrorStatus(error)
      const message = error instanceof Error ? error.message : 'Internal server error'
      if (format === 'html' && !request.headers.accept?.includes('application/json')) {
        response.status(status).render('error.html', {
          title: status >= 500 ? 'Internal Server Error' : message,
          statusCode: status,
          message: status >= 500 ? undefined : message
        })
        return
      }
      response.status(status).json({ error: { status, message } })
    }
  })
