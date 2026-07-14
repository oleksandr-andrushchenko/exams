import EventEmitter from 'node:events'
import { Service } from 'typedi'

@Service()
export default class EventDispatcher {

  public constructor(
    private readonly emitter = new EventEmitter(),
  ) {
  }

  public on(eventName: string, listener: any) {
    this.emitter.on(eventName, listener)
  }

  public dispatch(eventName: string, data?: any) {
    this.emitter.emit(eventName, data)
  }
}