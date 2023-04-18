import { Navigator } from "@solidjs/router";
import { Accessor, createEffect } from "solid-js";
import { Bookmarks } from "webextension-polyfill";

export function memo<T, R>(
  fn: (input: T, refresh?: boolean) => R,
  toKey: (key: T) => unknown = (k) => k
): (input: T, refresh?: boolean) => R {
  const cache = new Map<any, R>();
  return (input: T, refresh: boolean = false) => {
    const key = toKey(input);
    if (!cache.has(key) || refresh) {
      cache.set(key, fn(input, refresh));
    }
    return cache.get(key)!;
  };
}

export function mod(n: number, m: number) {
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
