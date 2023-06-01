export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export type Rect = Size & Position;

export function intersects(rect1: Rect, rect2: Rect): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect2.x < rect1.x + rect1.width &&
    rect1.y < rect2.y + rect2.height &&
    rect2.y < rect1.y + rect1.height
  );
}

export function elemPagePos(elem: HTMLElement): Position {
  const rect = elem.getBoundingClientRect();
  return {
    x: rect.x + window.scrollX,
    y: rect.y + window.scrollY,
  };
}

export function elemSize(elem: HTMLElement): Size {
  return {
    width: elem.offsetWidth,
    height: elem.offsetHeight,
  };
}

export function elemPageRect(elem: HTMLElement): Rect {
  return {
    ...elemPagePos(elem),
    ...elemSize(elem),
  };
}

export function dist(p1: Position, p2: Position) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}
