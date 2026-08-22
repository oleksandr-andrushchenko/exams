export default class PageNotFoundError extends Error {
  public constructor(message = 'Page not found') {
    super(message)
  }
}
