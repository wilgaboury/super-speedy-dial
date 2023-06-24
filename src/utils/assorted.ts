import { debounce } from "@solid-primitives/scheduled";
import { Navigator } from "@solidjs/router";
import { Bookmarks, tabs, windows } from "webextension-polyfill";

export const isFirefox = navigator.userAgent.indexOf("Firefox") >= 0;
export const isChrome = navigator.userAgent.indexOf("Chrome") >= 0;

interface Memo<T extends (...args: any[]) => any, K> {
  (...args: Parameters<T>): ReturnType<T>;
  resolve: (...args: Parameters<T>) => K;
  cache: Map<K, ReturnType<T>>;
}

export function memo<T extends (...args: any[]) => any, K>(
  fn: T,
  resolve: (...args: Parameters<T>) => K = (...args: any[]) => args[0]
): Memo<T, K> {
  const cache = new Map<K, ReturnType<T>>();
  const memoized = (...args: Parameters<T>): ReturnType<T> => {
    const key = resolve(...args);
    if (!cache.has(key)) {
      cache.set(key, fn(...args));
    }
    return cache.get(key)!;
  };
  return Object.assign(memoized, { resolve, cache });
}

export function memoTtl<
  T extends (...args: any[]) => any,
  K,
  M extends Memo<T, K>
>(m: M, ttl: number = 250): Memo<T, K> {
  const delayedDelete = memo((key: K) =>
    debounce(() => {
      m.cache.delete(key);
      delayedDelete.cache.delete(key);
    }, ttl)
  );
  const memoized = (...args: Parameters<T>): ReturnType<T> => {
    delayedDelete(m.resolve(...args))();
    return m(...args);
  };
  return Object.assign(memoized, m);
}

export function memoPromise<
  R extends any,
  T extends (...args: any[]) => Promise<R>,
  K,
  M extends Memo<T, K>
>(m: M): Memo<T, K> {
  const memoized = (...args: Parameters<T>): Promise<R> => {
    const del = () => m.cache.delete(m.resolve(...args));
    return m(...args)
      .then((result) => {
        del();
        return result;
      })
      .catch((err) => {
        del();
        throw err;
      });
  };
  return Object.assign(memoized, m);
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
  openUrlNewTab(`#/folder/${node.id}`);
}

export function openFolderBackground(node: Bookmarks.BookmarkTreeNode) {
  openUrlBackground(`#/folder/${node.id}`);
}

export function openFolderWindow(node: Bookmarks.BookmarkTreeNode) {
  openUrlBackground(`#/folder/${node.id}`);
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

export function openUrlBackground(url: string | null | undefined) {
  if (url == null) return;
  tabs.create({ url, active: false });
}

export async function openUrlWindow(url: string | null | undefined) {
  if (url == null) return;
  windows.create({ url });
}

export interface OpenUrlModifiers {
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
}

export function openUrlClick(
  url: string | null | undefined,
  e: OpenUrlModifiers
) {
  if (e.ctrlKey) {
    openUrlNewTab(url);
  } else if (e.altKey) {
    openUrlBackground(url);
  } else if (e.shiftKey) {
    openUrlWindow(url);
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

export function urlToDomain(url: string): string {
  return new URL(url).hostname;
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

export function assertExhaustive(
  value: never,
  message: string = "Reached unexpected case in exhaustive switch"
): never {
  throw new Error(message);
}

export function run<T>(func: () => T): T {
  return func();
}

export function union<T>(set1: Set<T>, set2: Set<T>): Set<T> {
  return new Set([...set1, ...set2]);
}

export function intersect<T>(set1: Set<T>, set2: Set<T>): Set<T> {
  return new Set([...set1].filter(set2.has));
}

export function difference<T>(set1: Set<T>, set2: Set<T>): Set<T> {
  return new Set([...set1].filter((item) => !set2.has(item)));
}

export function move<T>(
  arr: Array<T>,
  fromIdx: number,
  toIdx: number
): Array<T> {
  const elem = arr[fromIdx];
  arr.splice(fromIdx, 1);
  arr.splice(toIdx, 0, elem);
  return arr;
}

export function zip<A, B>(
  a: ReadonlyArray<A>,
  b: ReadonlyArray<B>
): ReadonlyArray<[A, B]> {
  return a.map((k, i) => [k, b[i]]);
}
