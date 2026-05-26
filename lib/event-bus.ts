// lib/event-bus.ts
type CardRatedPayload = { cardId: string; rating: 1 | 2 | 3 | 4 }

type EventMap = {
  'card:rated': CardRatedPayload
}

type Listener<T> = (payload: T) => void


class EventBus {
  private eventObject: Record<string, Listener<unknown>[]> = {}

  on(event: keyof EventMap, listener: Listener<unknown>) {
    if (!this.eventObject[event]) {
      this.eventObject[event] = []
    }

    // store the callback function of the subscriber
    this.eventObject[event].push(listener)
  }
  off(event: keyof EventMap, listener: Listener<unknown>) {
    if (this.eventObject[event]) {
      this.eventObject[event]  =this.eventObject[event].filter(l => l !== listener)
    }
  }
  emit(event: keyof EventMap, payload: unknown) {
    this.eventObject[event]?.forEach((element) => element(payload))
  }
}

export const eventBus = new EventBus()
