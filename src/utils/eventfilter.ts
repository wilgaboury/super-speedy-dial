export type EventFilter<T extends Event> = (e: T) => boolean;

export function applyFilter<T extends Event>(
  filter?: EventFilter<T>
): (fn: (e: T) => void) => (e: T) => void {
  return (fn) => (e) => {
    if (filter == null || filter(e)) fn(e);
  };
}

export function andFilters<T extends Event>(
  ...filters: ReadonlyArray<EventFilter<T>>
): EventFilter<T> {
  return (e) => {
    let res = true;
    for (const filter of filters) {
      res = res && filter(e);
      if (!res) return res;
    }
    return res;
  };
}

export function orFilters<T extends Event>(
  ...filters: ReadonlyArray<EventFilter<T>>
): EventFilter<T> {
  return (e) => {
    let res = false;
    for (const filter of filters) {
      res = res || filter(e);
      if (res) return res;
    }
    return res;
  };
}

export const enterKeyFilter = keyFilter("Enter");
export const escapeKeyFilter = keyFilter("Escape");

export function keyFilter(...keys: ReadonlyArray<string>) {
  return (e: KeyboardEvent) => keys.includes(e.key);
}

const propegationFilterMap = new Map<Event, Set<any>>();

/**
 * Alternative to event.stopPropegation(). Allows the event to continue propegation and for following
 * event handlers to opt into propegation prevention using propegationFilter. Also supports specifying
 * and filtering by the source of the filter.
 */
export function filterPropegation(e: Event, source?: any) {
  if (!propegationFilterMap.has(e)) {
    propegationFilterMap.set(e, new Set());
    setTimeout(() => propegationFilterMap.delete(e));
  }
  if (source != null) {
    propegationFilterMap.get(e)?.add(source);
  }
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
