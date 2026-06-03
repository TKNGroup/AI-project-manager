/* eslint-disable @typescript-eslint/no-explicit-any */
type ArgumentTypes<T> = T extends (...args: infer A) => any ? A : never;
type SuperReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type ListenerOptions = AddEventListenerOptions;

type ListenerObject<T> = { callback: T; options?: ListenerOptions };

export type EventListeners = Record<string, (...args: any[]) => any>;

export class EventListenerBase<Listeners extends EventListeners> {
  protected listeners: Partial<{
    [K in keyof Listeners]: Set<ListenerObject<Listeners[K]>>;
  }> = {};

  protected listenerResults: Partial<{
    [K in keyof Listeners]: ArgumentTypes<Listeners[K]>;
  }> = {};

  private readonly reuseResults: boolean;

  public constructor(reuseResults = false) {
    this.reuseResults = reuseResults;
  }

  public addEventListener<K extends keyof Listeners>(
    name: K,
    callback: Listeners[K],
    options?: ListenerOptions,
  ): void {
    const listenerObject = { callback, options } as ListenerObject<
      Listeners[K]
    >;

    (this.listeners[name] ??= new Set()).add(listenerObject);

    if (this.listenerResults.hasOwnProperty(name)) {
      callback(...this.listenerResults[name]!);

      if ((options as AddEventListenerOptions)?.once) {
        this.listeners[name]!.delete(listenerObject);
      }
    }
  }

  public once<K extends keyof Listeners>(
    name: K,
    callback: Listeners[K],
  ): void {
    this.addEventListener(name, callback, { once: true });
  }

  public removeEventListener<K extends keyof Listeners>(
    name: K,
    callback: Listeners[K],
  ): void {
    const listenerSet = this.listeners[name];

    if (!listenerSet) {
      return;
    }

    for (const listener of listenerSet) {
      if (listener.callback === callback) {
        listenerSet.delete(listener);
        break;
      }
    }
  }

  public hasListeners<K extends keyof Listeners>(name: K): boolean {
    return !!this.listeners[name]?.size;
  }

  public dispatchEvent<K extends keyof Listeners>(
    name: K,
    ...args: ArgumentTypes<Listeners[K]>
  ): void {
    if (this.reuseResults) {
      this.listenerResults[name] = args;
    }

    const listeners = this.listeners[name];

    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      try {
        listener.callback(...args);
      } catch (error) {
        console.error(`Error in listener for event "${String(name)}":`, error);
      }

      if ((listener.options as AddEventListenerOptions)?.once) {
        listeners.delete(listener);
      }
    }
  }

  public dispatchResultableEvent<K extends keyof Listeners>(
    name: K,
    ...args: ArgumentTypes<Listeners[K]>
  ): Array<SuperReturnType<Listeners[K]>> {
    if (this.reuseResults) {
      this.listenerResults[name] = args;
    }

    const listeners = this.listeners[name];
    const results: SuperReturnType<Listeners[K]>[] = [];

    if (!listeners) {
      return results;
    }

    for (const listener of listeners) {
      try {
        const result = listener.callback(...args);
        results.push(result as SuperReturnType<Listeners[K]>);
      } catch (error) {
        console.error(`Error in listener for event "${String(name)}":`, error);
      }

      if ((listener.options as AddEventListenerOptions)?.once) {
        listeners.delete(listener);
      }
    }

    return results;
  }

  public dispatchUntil<K extends keyof Listeners>(
    name: K,
    predicate: (result: SuperReturnType<Listeners[K]>) => boolean,
    ...args: ArgumentTypes<Listeners[K]>
  ): SuperReturnType<Listeners[K]> | undefined {
    if (this.reuseResults) {
      this.listenerResults[name] = args;
    }

    const listeners = this.listeners[name];

    if (!listeners) {
      return undefined;
    }

    for (const listener of listeners) {
      try {
        const result = listener.callback(...args);

        if ((listener.options as AddEventListenerOptions)?.once) {
          listeners.delete(listener);
        }

        if (predicate(result as SuperReturnType<Listeners[K]>)) {
          return result as SuperReturnType<Listeners[K]>;
        }
      } catch (error) {
        console.error(`Error in listener for event "${String(name)}":`, error);
      }
    }

    return undefined;
  }

  public cleanup(): void {
    this.listeners = {};
    this.listenerResults = {};
  }
}
