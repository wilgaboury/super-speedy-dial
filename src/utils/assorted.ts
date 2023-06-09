import { Navigator } from "@solidjs/router";
import { Accessor, createEffect } from "solid-js";
import { Bookmarks } from "webextension-polyfill";

export const isFirefox = navigator.userAgent.indexOf("Firefox") >= 0;

export interface MemoOptions<T> {
  readonly toKey?: (key: T) => unknown;
  readonly ttl?: number;
}

interface MemoItem<R> {
  value: R;
  ttlId?: number;
}

export function memo<T, R>(
  fn: (input: T, refresh?: boolean) => R,
  options: MemoOptions<T> = {}
): (input: T, refresh?: boolean) => R {
  const cache = new Map<any, MemoItem<R>>();
  return (input: T, refresh: boolean = false): R => {
    const key = options.toKey != null ? options.toKey(input) : input;
    if (!cache.has(key) || refresh) {
      cache.set(key, { value: fn(input, refresh) });
    }

    const item = cache.get(key)!;

    if (options.ttl != null) {
      if (item.ttlId != null) {
        clearTimeout(item.ttlId);
      }
      item.ttlId = setTimeout(() => cache.delete(key), options.ttl);
    }

    return item.value;
  };
}

/**
 * mod but the result is always positive
 */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function openFolder(
  navigate: Navigator,
  node: Bookmarks.BookmarkTreeNode
) {
  navigate(`/folder/${node.id}`);
}

export function openFolderNewTab(node: Bookmarks.BookmarkTreeNode) {
  const win = window.open(`#/folder/${node.id}`, "_blank");
  win?.focus();
}

export function openUrl(url: string | null | undefined) {
  if (url != null) window.location.href = url;
}

export function openUrlNewTab(
  url: string | null | undefined,
  focus: boolean = false
) {
  if (url == null) return;
  const win = window.open(url, "_blank");
  if (focus) win?.focus();
}

export function openUrlClick(url: string | null | undefined, newTab: boolean) {
  if (newTab) {
    openUrlNewTab(url);
  } else {
    openUrl(url);
  }
}

export function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export function convertUrlToAbsolute(origin: string, path: string): string {
  if (path.indexOf("://") > 0) {
    return path;
  } else if (path.indexOf("//") === 0) {
    return "https:" + path;
  } else {
    let url = new URL(origin);
    if (path.slice(0, 1) === "/") {
      return url.origin + path;
    } else {
      if (url.pathname.slice(-1) !== "/") {
        url.pathname = url.pathname + "/";
      }
      return url.origin + url.pathname + path;
    }
  }
}

export async function encodeBlob(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => resolve(reader.result as string);
  });
}

export async function decodeBlob(str: string): Promise<Blob> {
  return (await fetch(str)).blob();
}

export function deepTrack(store: any) {
  for (const k in store) {
    const value = store[k];
    if (typeof value === "object") {
      deepTrack(store);
    }
  }
}

export function createDebounced<T>(
  accessor: Accessor<T>,
  effect: (value: T) => void,
  timeout: number = 250
) {
  let timeoutId: number | null = null;
  createEffect(() => {
    const value = accessor();
    if (timeoutId != null) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => effect(value), timeout);
  });
}

export function urlToDomain(url: string): string {
  return new URL(url).hostname;
}

export function onEnterKeyDown(
  callback: () => void
): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    if (e.key == "Enter") callback();
  };
}

export function isValidUrl(url: string) {
  try {
    new URL(url);
  } catch (_) {
    return false;
  }
  return true;
}

export interface CancelablePromise<T> {
  readonly promise: Promise<T>;
  readonly cancel: () => void;
}

export function makeRejectCancelable<T>(
  promise: Promise<T>
): CancelablePromise<T> {
  let canceled = false;

  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise.then((value) =>
      canceled ? reject({ isCanceled: true }) : resolve(value)
    );
    promise.catch((error) =>
      canceled ? reject({ isCanceled: true }) : reject(error)
    );
  });

  return {
    promise: wrappedPromise,
    cancel() {
      canceled = true;
    },
  };
}

export function makeSilentCancelable<T>(
  promise: Promise<T>
): CancelablePromise<T | null> {
  let canceled = false;

  const wrappedPromise = new Promise<T | null>((resolve, reject) => {
    promise.then((value) => (canceled ? resolve(null) : resolve(value)));
    promise.catch((error) => reject(error));
  });

  return {
    promise: wrappedPromise,
    cancel() {
      canceled = true;
    },
  };
}

export function visitMutate(obj: any, mutate: (key: string, obj: any) => void) {
  for (const k in obj) {
    mutate(k, obj);
    const value = obj[k];
    if (typeof value === "object") {
      visitMutate(value, mutate);
    }
  }
}

export async function asyncVisitMutate(
  obj: any,
  mutate: (key: string, obj: any) => Promise<void>
): Promise<void> {
  for (const k in obj) {
    await mutate(k, obj);
    const value = obj[k];
    if (typeof value === "object") {
      visitMutate(value, mutate);
    }
  }
}

export function errorSwitch<T>(value: T): (reason: any) => T {
  return (reason) => {
    console.error(reason);
    return value;
  };
}

export function queue(fn: () => void): void {
  setTimeout(fn, 0);
}

export function applyChanges<T, K extends keyof T>(
  obj: T,
  changes: Pick<T, K>
): T {
  return Object.assign({}, obj, changes);
}

export function normalize(n: number, min: number, max: number): number {
  return (Math.max(min, Math.min(max, n)) - min) / (max - min);
}

/**
 * @param n value between 0 and 1
 * @param t value > 0 that controls the curvature of the function
 * @returns value from zero to infinity
 */
export function mapZeroOneToZeroInf(n: number, t: number = 1): number {
  return t / (1 - Math.max(0, Math.min(1, n))) - t;
}
