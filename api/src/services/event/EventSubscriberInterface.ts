export default interface EventSubscriberInterface {
  handle(data?: any): void
}