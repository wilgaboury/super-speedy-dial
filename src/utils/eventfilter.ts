export type EventFilter<T extends Event> = (e: T) => boolean;

export function applyFilter<T extends Event>(
  filter?: EventFilter<T>
): (fn: (e: T) => void) => (e: T) => void {
  return (fn) => (e) => {
    if (filter == null || filter(e)) fn(e);
  };
}

export const enterKeyFilter = keyFilter(["Enter"]);
export const escapeKeyFilter = keyFilter(["Escape"]);

export function keyFilter(keys: ReadonlyArray<string>) {
  return (e: KeyboardEvent) => keys.includes(e.key);
}

const propegationFilterMap = new Map<Event, Set<any>>();

/**
 * Alternative to event.stopPropegation(), but allows the event to continure propegation and for following
 * event handlers to opt into propegation prevention using propegationFilter.
 */
export function filterPropegation(e: Event, source?: any) {
  if (!propegationFilterMap.has(e)) {
    propegationFilterMap.set(e, new Set());
    setTimeout(() => propegationFilterMap.delete(e));
  }
  propegationFilterMap.get(e)?.add(source);
}

export function propegationFilter<T extends Event>(
  sources?: ReadonlyArray<any>
): EventFilter<T> {
  return (e) => {
    const eventSources = propegationFilterMap.get(e);
    return (
      eventSources == null ||
      sources == null ||
      sources.reduce((acc, source) => acc && !eventSources.has(source), true)
    );
  };
}
