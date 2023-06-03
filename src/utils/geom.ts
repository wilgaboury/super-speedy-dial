export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export type Rect = Position & Size;

export function intersects(rect1: Rect, rect2: Rect): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect2.x < rect1.x + rect1.width &&
    rect1.y < rect2.y + rect2.height &&
    rect2.y < rect1.y + rect1.height
  );
}

export function clientToPage<T extends Position>(pos: T): T {
  return {
    ...pos,
    x: pos.x + window.scrollX,
    y: pos.y + window.scrollY,
  };
}

export function clientToRelative<T extends Position>(
  pos: T,
  elem: HTMLElement
): T {
  const rect = elemClientRect(elem);
  return {
    ...pos,
    x: pos.x - rect.x,
    y: pos.y - rect.y,
  };
}

export function pageToRelative<T extends Position>(
  pos: T,
  elem: HTMLElement
): T {
  const rect = clientToPage(elemClientRect(elem));
  return {
    ...pos,
    x: pos.x - rect.x,
    y: pos.y - rect.y,
  };
}

export function elemClientRect(elem: HTMLElement) {
  return elem.getBoundingClientRect();
}

export function elemPageRect(elem: HTMLElement) {
  return clientToPage(elemClientRect(elem));
}

export function toDomRect(rect: Rect): DOMRect {
  return DOMRect.fromRect(rect);
}

export function dist(p1: Position, p2: Position) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}
