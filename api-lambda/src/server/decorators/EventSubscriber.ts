import { Constructable, Container } from 'typedi'
import EventDispatcher from '../services/event/EventDispatcher'
import { Event } from '../enums/Event'

export default function EventSubscriber(event: Event): ClassDecorator {
  return <T = Constructable<unknown>>(subscriber: T): void => {
    const eventDispatcher = Container.get(EventDispatcher)
    eventDispatcher.on(event, async (data: any) => {
      const eventSubscriber: { handle: (data: any) => void } = Container.get(subscriber)
      await eventSubscriber.handle(data)
    })
  }
}
