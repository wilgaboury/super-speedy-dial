import { Bookmarks, bookmarks } from "webextension-polyfill";

// @ts-ignore
const isFirefox = typeof InstallTrigger !== "undefined";

console.log(isFirefox);

export const rootFolderId = isFirefox ? "root________" : "0";

export async function getBookmarkPath(
  id: string | null | undefined
): Promise<ReadonlyArray<Bookmarks.BookmarkTreeNode>> {
  if (id == null) return [];
  const node = (await bookmarks.get(id))[0];
  return [...(await getBookmarkPath(node.parentId)), node];
}

export function foldBookmarkTreeInOrder<T>(
  node: Bookmarks.BookmarkTreeNode,
  value: T,
  callback: (node: Bookmarks.BookmarkTreeNode, value: T) => T
): T {
  value = callback(node, value);
  if (node.children != null) {
    for (const child of node.children) {
      value = foldBookmarkTreeInOrder(child, value, callback);
    }
  }
  return value;
}

export async function getSubTreeAsList(id: string) {
  const node = (await bookmarks.getSubTree(id))[0];
  return foldBookmarkTreeInOrder(
    node,
    [] as Bookmarks.BookmarkTreeNode[],
    (n, arr) => {
      arr.push(n);
      return arr;
    }
  );
}

export function getBookmarkTitle(node: Bookmarks.BookmarkTreeNode): string {
  if (node.id === rootFolderId) return "Root";
  else return node.title;
}

export function isFolder(node: Bookmarks.BookmarkTreeNode): boolean {
  return node.url == undefined;
}

export function isBookmark(node: Bookmarks.BookmarkTreeNode): boolean {
  return node.url != undefined;
}

export function isSeparator(node: Bookmarks.BookmarkTreeNode): boolean {
  return node.type != null && node.type == "separator";
}
