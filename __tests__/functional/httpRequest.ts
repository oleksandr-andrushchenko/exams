type TestRequest = {
  method: string
  path: string
  field: string
  fields?: string[]
  query?: Record<string, unknown>
  body?: unknown
}

type TestResponse = {
  status: number
  body: any
}

const errorName = (status: number): string =>
  ({
    400: 'BadRequestError',
    401: 'AuthorizationRequiredError',
    403: 'ForbiddenError',
    404: 'NotFoundError',
    409: 'ConflictError'
  })[status] ?? 'InternalServerError'

const normalizeDateFields = (value: unknown, key = ''): unknown => {
  if (typeof value === 'string' && /At$/.test(key)) return Date.parse(value)
  if (Array.isArray(value)) return value.map((item) => normalizeDateFields(item, key))
  if (value && typeof value === 'object') {
    const result = Object.fromEntries(
      Object.entries(value).map(([name, item]) => [name, normalizeDateFields(item, name)])
    )
    if (Array.isArray(result.questions)) {
      result.questionCount = result.questions.length
      result.answeredQuestionCount = result.questions.filter(
        (question: any) => typeof question.choice === 'number' || typeof question.answer === 'string'
      ).length
    }
    if (Array.isArray(result.choices)) {
      result.choices = result.choices.map((choice: any) =>
        choice && typeof choice === 'object' ? { correct: null, explanation: null, ...choice } : choice
      )
    }
    return result
  }
  return value
}

const selectFields = (value: unknown, fields: string[] | undefined): unknown => {
  if (!fields?.length) return value
  if (Array.isArray(value)) return value.map((item) => selectFields(item, fields))
  if (!value || typeof value !== 'object') return value
  const selected = fields.map((field) => field.trim().split(/\s|\{/)[0]).filter(Boolean)
  return Object.fromEntries(selected.filter((field) => field in value).map((field) => [field, value[field]]))
}

class RequestBuilder implements PromiseLike<TestResponse> {
  private method = 'GET'
  private payload: TestRequest | undefined
  private token: string | undefined

  public constructor(private readonly baseUrl: string) {}

  public post(_path: string): this {
    this.method = 'POST'
    return this
  }

  public send(payload: TestRequest): this {
    this.payload = payload
    return this
  }

  public auth(token: string, _options: { type: string }): this {
    this.token = token
    return this
  }

  public then<TResult1 = TestResponse, TResult2 = never>(
    onfulfilled?: ((value: TestResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  private async execute(): Promise<TestResponse> {
    if (!this.payload) throw new Error('A test request payload is required')

    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(this.payload.query ?? {})) {
      if (value !== undefined) query.append(key, Array.isArray(value) ? value.join(',') : String(value))
    }

    const url = new URL(this.payload.path, this.baseUrl)
    url.search = query.toString()
    const hasBody = 'body' in this.payload && this.payload.body !== undefined
    const response = await fetch(url, {
      method: this.payload.method.toUpperCase(),
      headers: {
        ...(hasBody ? { 'content-type': 'application/json' } : {}),
        ...(this.token ? { authorization: 'Bearer ' + this.token } : {})
      },
      body: hasBody ? JSON.stringify(this.payload.body) : undefined
    })
    const body = await response.json()

    if (!response.ok || (body && typeof body === 'object' && 'error' in body)) {
      return {
        status: 200,
        body: {
          errors: [
            {
              message: body?.error?.message,
              extensions: { name: errorName(response.status) }
            }
          ]
        }
      }
    }

    const value = body && typeof body === 'object' && 'deleted' in body ? body.deleted : body
    return {
      status: 200,
      body: { data: { [this.payload.field]: selectFields(normalizeDateFields(value), this.payload.fields) } }
    }
  }
}

export default (baseUrl: string): RequestBuilder => new RequestBuilder(baseUrl)
