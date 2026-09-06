/**
 * Lightweight typed EventBus for cross-component communication
 */

type Handler<T = unknown> = (data: T) => void;

export class EventBus {
  private listeners: Map<string, Set<Handler>> = new Map();

  on<T = unknown>(event: string, handler: Handler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(handler as Handler);

    return () => {
      set.delete(handler as Handler);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  emit<T = unknown>(event: string, data?: T): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of Array.from(handlers)) {
        try {
          handler(data);
        } catch (err) {
          console.error(`[EventBus] Error handling event "${event}":`, err);
        }
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
