export type Filter<T> = (v: T) => boolean;

export function applyFilter<T>(
  filter?: Filter<T>
): (fn: (v: T) => void) => (v: T) => void {
  return (fn) => (v) => {
    if (filter == null || filter(v)) fn(v);
  };
}

export function andFilters<T extends Event>(
  ...filters: ReadonlyArray<Filter<T>>
): Filter<T> {
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
  ...filters: ReadonlyArray<Filter<T>>
): Filter<T> {
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

export function keyFilter(
  ...keys: ReadonlyArray<string>
): Filter<KeyboardEvent> {
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
): Filter<T> {
  return (e) => {
    const eventSources = propegationFilterMap.get(e);
    return (
      eventSources == null ||
      sources == null ||
      sources.reduce((acc, source) => acc && !eventSources.has(source), true)
    );
  };
}
