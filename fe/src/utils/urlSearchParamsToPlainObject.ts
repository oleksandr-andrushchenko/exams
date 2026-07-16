export default function urlSearchParamsToPlainObject(params: URLSearchParams): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [ key, value ] of params.entries()) {
    result[key] = value
  }

  return result
}