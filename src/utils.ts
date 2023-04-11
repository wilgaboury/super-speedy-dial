import browser, { Bookmarks, bookmarks } from "webextension-polyfill";
import pdfTileIcon from "./assets/pdf.png";
import folderTileIcon from "./assets/folder.png";
import seperatorTileIcon from "./assets/separator.png";
import webTileIcon from "./assets/web.png";
import { dbGet, dbSet, tileImageStore } from "./database";
import { Accessor, createEffect } from "solid-js";

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface MetaBlob {
  readonly blob: Blob;
  readonly url: string;
  readonly size?: Size;
}

export interface DbMetaBlob {
  readonly blob: Blob;
  readonly size?: Size;
}

export async function getRoot() {
  return (await browser.bookmarks.getTree())[0];
}

export async function getStartFolder(): Promise<browser.Bookmarks.BookmarkTreeNode> {
  const value = await browser.storage.local.get("bookmarkRoot");
  if (value.bookmarkRoot != null) {
    const node = (await browser.bookmarks.get(value.bookmarkRoot))[0];
    return node != null ? node : getRoot();
  }
  return getRoot();
}

export async function getBookmarkPath(
  id: string | null | undefined
): Promise<ReadonlyArray<Bookmarks.BookmarkTreeNode>> {
  if (id == null) return [];
  const node = (await browser.bookmarks.get(id))[0];
  return [...(await getBookmarkPath(node.parentId)), node];
}

export async function getSubTreeAsList(id: string) {
  const node = await bookmarks.getSubTree(id);
  return getSubTreeAsListHelper(node[0]);
}

function getSubTreeAsListHelper(
  node: Bookmarks.BookmarkTreeNode
): ReadonlyArray<Bookmarks.BookmarkTreeNode> {
  if (node.children == null) return [];
  const arr = [...node.children];
  for (const child of node.children) {
    arr.push(...getSubTreeAsListHelper(child));
  }
  return arr;
}

export function getBookmarkTitle(node: Bookmarks.BookmarkTreeNode): string {
  if (node.id === "root________") return "Root";
  else return node.title;
}

async function scaleDown(blob: MetaBlob): Promise<MetaBlob> {
  const maxDimSize = 512;
  if (
    blob.size == null ||
    (blob.size.width <= maxDimSize && blob.size.height <= maxDimSize)
  ) {
    return blob;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx == null) {
    throw new Error("could not initialize 2d context");
  }

  const img = await loadImgElem(blob.url);
  const scale = Math.max(img.width, img.height) / maxDimSize;
  canvas.width = Math.round(img.width / scale);
  canvas.height = Math.round(img.height / scale);

  ctx.drawImage(
    img,
    0,
    0,
    img.width,
    img.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result == null) {
        reject("scale and crop: failed to turn canvas into blob");
      } else {
        resolve({
          blob: result,
          url: URL.createObjectURL(result),
          size: {
            width: canvas.width,
            height: canvas.height,
          },
        });
      }
    });
  });
}

const supportedImageMimes = [
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
  "image/x-icon",
];

export function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
const supportedImageMimesRegex = new RegExp(
  `^${supportedImageMimes.map(escapeRegExp).join("|")}.*$`
);

export function isValidImageType(type: string) {
  return supportedImageMimesRegex.test(type);
}

export function isVectorImageType(type: string) {
  return type.trim().startsWith("image/svg+xml");
}

export function isRasterImageType(type: string) {
  return !isVectorImageType(type);
}

export function toDbMetaBlob(blob: MetaBlob): DbMetaBlob {
  const { url: _, ...rest } = blob;
  return rest;
}

export async function retrieveBlob(
  url: string | null | undefined
): Promise<Blob | null> {
  if (url == null) return Promise.resolve(null);
  const response = await fetch(url);
  if (response.ok) return response.blob();
  else return null;
}

/**
 * This should only be called on static resources and urls from URL.createObjectURL
 */
async function loadImgElem(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = url;
  });
}

/**
 * This function should only get called if it is known that the blob's mime type
 * is some sort of raster image format.
 */
export async function loadSize(blob: MetaBlob): Promise<MetaBlob> {
  const img = await loadImgElem(blob.url);
  return { ...blob, size: { width: img.width, height: img.height } };
}

export async function toMetaBlob(
  blob: Blob | null | undefined
): Promise<MetaBlob | null> {
  if (blob == null || !isValidImageType(blob.type)) return null;
  const meta = { blob: blob, url: URL.createObjectURL(blob) };
  if (isVectorImageType(blob.type)) return meta;
  return loadSize(meta);
}

export function retrieveHtml(
  url: string,
  timeout: number = 5000
): Promise<Document | null> {
  return new Promise((resolve) => {
    let xhr = new XMLHttpRequest();
    xhr.timeout = timeout;
    xhr.ontimeout = () => resolve(null);
    xhr.onerror = () => resolve(null);
    xhr.onload = () => resolve(xhr.responseXML);
    xhr.open("GET", url);
    xhr.responseType = "document";
    xhr.send();
  });
}

export function retrieveFaviconImage(url: string): Promise<Blob | null> {
  return retrieveBlob(
    `https://frail-turquoise-baboon.faviconkit.com/${new URL(url).hostname}/512`
  );
}

export async function retrieveOpenGraphImage(
  url: string,
  html: Document
): Promise<Blob | null> {
  const content = html
    .querySelector('meta[property="og:image"]')
    ?.getAttribute("content");
  if (content == null) return null;
  return retrieveBlob(convertUrlToAbsolute(url, content));
}

export async function retrieveTwitterImage(
  url: string,
  html: Document
): Promise<Blob | null> {
  const content = html
    .querySelector('meta[name="twitter:image"]')
    ?.getAttribute("content");
  if (content == null) return null;
  return retrieveBlob(convertUrlToAbsolute(url, content));
}

export async function retrieveIconShortcutImage(
  url: string,
  html: Document
): Promise<Blob | null> {
  const content = html
    .querySelector('link[rel="shortcut icon"][type="image/x-icon"]')
    ?.getAttribute("href");
  if (content == null) return null;
  return retrieveBlob(convertUrlToAbsolute(url, content));
}

export async function retrieveIconImage(
  url: string,
  html: Document
): Promise<Blob | null> {
  const sizes = [
    "228x228",
    "196x196",
    "195x195",
    "192x192",
    "180x180",
    "167x167",
    "152x152",
    "144x144",
    "128x128",
    "120x120",
    "96x96",
  ];

  for (const size of sizes) {
    const elem = html.querySelector(`link[rel="icon"][sizes="${size}"]`);
    if (elem) {
      const href = elem.getAttribute("href");
      if (href != null) {
        const image = await retrieveBlob(convertUrlToAbsolute(url, href));
        if (image != null) return image;
      }
    }
  }
  return null;
}

export async function retrieveAppleIconImage(
  url: string,
  html: Document
): Promise<Blob | null> {
  const href = html
    .querySelector('link[rel="apple-touch-icon"]')
    ?.getAttribute("href");
  if (href == null) return null;
  return retrieveBlob(convertUrlToAbsolute(url, href));
}

export async function retrievePageImage(
  url: string,
  html: Document,
  limit: number = 3
): Promise<Blob | null> {
  const elems = Array.from(html.querySelectorAll("img[src]")).slice(0, limit);
  for (const elem of elems) {
    const src = elem.getAttribute("src");
    if (src != null) {
      const image = await retrieveBlob(convertUrlToAbsolute(url, src));
      if (image != null) return image;
    }
  }
  return null;
}

/**
 * Iterates thourgh image loading callback function and returns the first image that
 * has a reasonably high resoltion or if none are very high resoltion is will return
 * the list of all images that loaded.
 */
export async function retrieveFirstOrLoaded(
  retrieves: ReadonlyArray<() => Promise<Blob | null>>
): Promise<{ first: MetaBlob } | { loaded: ReadonlyArray<MetaBlob> }> {
  const images: Array<MetaBlob> = [];
  for (const retrieve of retrieves) {
    const blob = await toMetaBlob(await retrieve());
    if (blob != null) {
      if (blob.size == undefined) return { first: blob };
      if (blob.size.width >= 128) return { first: blob };
      images.push(blob as MetaBlob);
    }
  }
  return { loaded: images };
}

export function largestImage(images: ReadonlyArray<MetaBlob>): MetaBlob | null {
  const area = (size: Size) => size.height * size.width;

  let max = null;
  for (const image of images) {
    if (
      max == null ||
      (max.size != null &&
        image.size != null &&
        area(max.size) < area(image.size))
    ) {
      max = image;
    }
  }
  return max;
}

export async function retrieveBookmarkImage(
  url: string
): Promise<MetaBlob | null> {
  const html = await retrieveHtml(url);
  if (html == null) {
    return toMetaBlob(await retrieveFaviconImage(url));
  }

  const images = await retrieveFirstOrLoaded([
    () => retrieveOpenGraphImage(url, html),
    () => retrieveTwitterImage(url, html),
    () => retrieveIconImage(url, html),
    () => retrieveIconShortcutImage(url, html),
    () => retrieveAppleIconImage(url, html),
    () => retrievePageImage(url, html),
    () => retrieveFaviconImage(url),
  ]);

  if ("first" in images) {
    return images.first;
  } else {
    return largestImage(images.loaded);
  }
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

export async function blobToString(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => resolve(reader.result as string);
  });
}

export async function stringToBlob(str: string): Promise<Blob> {
  return (await fetch(str)).blob();
}

export async function awaitTabLoad(id: number): Promise<void> {
  return new Promise((resolve) => {
    const listener = (
      _tabId: any,
      changeInfo: browser.Tabs.OnUpdatedChangeInfoType
    ) => {
      if (changeInfo.status != null && changeInfo.status == "complete") {
        browser.tabs.onUpdated.removeListener(listener);
        setTimeout(() => resolve(), 5000); // give page a bit of time to load
      }
    };
    // TODO: timout and reflect in result if error
    browser.tabs.onUpdated.addListener(listener, {
      properties: ["status"],
      tabId: id,
    });
  });
}

export async function retrievePageScreenshot(
  bookmarkId: string,
  url: string | undefined | null
): Promise<MetaBlob | null> {
  if (url == null) return null;
  const tab = await browser.tabs.create({ url: url, active: false });
  const id = tab.id;
  if (id == null) {
    return null;
  }
  await browser.tabs.hide(id);
  await awaitTabLoad(id);

  const imageUri = await browser.tabs.captureTab(id);
  const blob = await stringToBlob(imageUri);
  const meta = await toMetaBlob(blob);
  if (meta == null) return null;
  const result = await scaleDown(meta);

  await browser.tabs.remove(id);
  saveImage(bookmarkId, result);
  return result;
}

export async function retrieveAndSaveBookmarkImage(
  id: string,
  url: string | null | undefined
): Promise<MetaBlob> {
  if (url == null) {
    return retrieveAndSaveDefaultBookmarkImage(id);
  }

  let image = await retrieveBookmarkImage(url);
  if (image == null) return retrieveAndSaveDefaultBookmarkImage(id);
  image = await scaleDown(image);
  saveImage(id, image);
  return image;
}

export async function retrieveAndSaveDefaultBookmarkImage(bookmarkId: string) {
  const defaultImg = await localImageToBlob(webTileIcon);
  saveImage(bookmarkId, defaultImg);
  return defaultImg;
}

export async function saveImage(bookmarkId: string, blob: MetaBlob) {
  dbSet(tileImageStore, bookmarkId, toDbMetaBlob(blob));
}

export async function localImageToBlob(path: string): Promise<MetaBlob> {
  const img = await loadImgElem(path);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx == null) {
    throw new Error("could not get 2d context from canvas");
  }

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0, img.width, img.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob == null) {
        reject("failed to turn canvas into blob");
      } else {
        resolve({
          blob: blob,
          url: URL.createObjectURL(blob),
          size: { width: img.width, height: img.height },
        });
      }
    });
  });
}

export async function retrieveTileImage(
  node: browser.Bookmarks.BookmarkTreeNode,
  loadingStartedCallback = () => {},
  forceReload = false
): Promise<MetaBlob> {
  if (node.type == "folder") {
    return localImageToBlob(folderTileIcon);
  } else if (node.type == "separator") {
    return localImageToBlob(seperatorTileIcon);
  } else if (
    node.url != null &&
    node.url.substring(node.url.length - 3) == "pdf"
  ) {
    return localImageToBlob(pdfTileIcon);
  } else {
    const blob = await dbGet<DbMetaBlob>(tileImageStore, node.id);
    if (blob == null || forceReload) {
      loadingStartedCallback();
      return retrieveAndSaveBookmarkImage(node.id, node.url);
    }
    return {
      ...blob,
      url: URL.createObjectURL(blob.blob),
    };
  }
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
