import browser, { Bookmarks } from "webextension-polyfill";
import pdfTileIcon from "./assets/pdf.png";
import folderTileIcon from "./assets/folder.png";
import seperatorTileIcon from "./assets/separator.png";
import webTileIcon from "./assets/web.png";
import { dbGet, dbSet, tileImageSizesStore, tileImageStore } from "./database";
import { Accessor, createEffect } from "solid-js";

export interface Sized {
  readonly width: number;
  readonly height: number;
}

export interface Blobbed {
  readonly blob: Blob;
}

export interface Urled {
  readonly url: string;
}

export type RasterBlobbed = Blobbed & Sized;
export type MostlyFullyBlobbed = Blobbed & Urled & Partial<Sized>;
export type FullyBlobbed = Blobbed & Urled & Sized;

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

export function getBookmarkTitle(node: Bookmarks.BookmarkTreeNode): string {
  if (node.id === "root________") return "Root";
  else return node.title;
}

async function scaleDown(blob: FullyBlobbed): Promise<FullyBlobbed> {
  const maxDimSize = 512;
  if (blob.height <= maxDimSize && blob.width <= maxDimSize) return blob;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx == null) {
    throw new Error("could not initialize 2d context");
  }

  const img = await loadImgElem(blob);
  const scale = Math.max(img.width, img.height) / maxDimSize;
  canvas.width = img.width / scale;
  canvas.height = img.height / scale;

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
          ...toUrled({ blob: result }),
          width: canvas.width,
          height: canvas.height,
        });
      }
    });
  });
}

const supportedImageTypes = [
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
  "image/x-icon",
];

export function isValidImageType(type: string) {
  return supportedImageTypes.includes(type);
}

export function isVectorImageType(type: string) {
  return type == "image/svg+xml";
}

export function isRasterImageType(type: string) {
  return !isVectorImageType(type);
}

export function toBlobbed(blob: Blob): Blobbed {
  return { blob: blob };
}

export function toUrled<T extends Blobbed>(blob: T): T & Urled {
  return {
    url: URL.createObjectURL(blob.blob),
    ...blob,
  };
}

export function fromUrled<T extends Blobbed>(blob: T & Urled) {
  const { url: _, ...rest } = blob;
  return rest;
}

export async function retrieveBlob(
  url: string | null | undefined
): Promise<Blob | null> {
  if (url == null) return Promise.resolve(null);
  const response = await fetch(url);
  return response.blob();
}

async function loadImgElem<T extends Urled>(
  urled: T
): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = urled.url;
  });
}

/**
 * This function should only get called if it is known that the blob's mime type
 * is some sort of raster image format.
 */
export async function loadSized<T extends Urled>(blob: T): Promise<T & Sized> {
  const img = await loadImgElem(blob);
  return { ...blob, width: img.width, height: img.height };
}

/**
 * Can be used to determine if an image is an svg or not. Raster images will
 * contain a size and be converted, while svgs won't.
 */
export function isFully(blob: MostlyFullyBlobbed): blob is FullyBlobbed {
  return blob.width == null || blob.height == null;
}

export async function toMostly(
  blob: Blob | null | undefined
): Promise<MostlyFullyBlobbed | null> {
  if (blob == null || !isValidImageType(blob.type)) return null;

  const blobbed = toUrled(toBlobbed(blob));
  if (isVectorImageType(blobbed.blob.type)) return blobbed;

  return loadSized(blobbed);
}

// export function retrieveImage(
//   url: string | null | undefined
// ): Promise<HTMLImageElement | null> {
//   if (url == null) return Promise.resolve(null);
//   return new Promise((resolve) => {
//     const img = new Image();
//     img.onload = () => resolve(img);
//     img.onerror = () => resolve(null);
//     img.src = url;
//   });
// }

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

export function queryTagContent(
  tag: string,
  propName: string,
  propValue: string,
  attr: string,
  html: Document
): string | null {
  const tags = html.getElementsByTagName(tag);
  for (let tag of tags) {
    const property = tag.getAttribute(propName);
    const content = tag.getAttribute(attr);
    if (property === propValue && content != null) {
      return content;
    }
  }
  return null;
}

export function getMetaTagContent(
  propName: string,
  propValue: string,
  html: Document
): string | null {
  const metas = html.getElementsByTagName("meta");
  for (let meta of metas) {
    const property = meta.getAttribute(propName);
    const content = meta.getAttribute("content");
    if (property === propValue && content != null) {
      return content;
    }
  }
  return null;
}

export async function retrieveOpenGraphImage(
  url: string,
  html: Document
): Promise<Blob | null> {
  const content = getMetaTagContent("property", "og:image", html);
  if (content == null) return null;
  return retrieveBlob(convertUrlToAbsolute(url, content));
}

export async function retrieveTwitterImage(
  url: string,
  html: Document
): Promise<Blob | null> {
  const content = getMetaTagContent("name", "twitter:image", html);
  if (content == null) return null;
  return retrieveBlob(convertUrlToAbsolute(url, content));
}

export async function retrieveIconShortcutImage(
  url: string,
  html: Document
): Promise<Blob | null> {
  const content = getMetaTagContent("name", "twitter:image", html);
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
  const appleIcon = html.querySelector('link[rel="apple-touch-icon"]');
  if (appleIcon != null) {
    const href = appleIcon.getAttribute("href");
    if (href != null) {
      return retrieveBlob(convertUrlToAbsolute(url, href));
    }
  }
  return null;
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
): Promise<
  { first: MostlyFullyBlobbed } | { loaded: ReadonlyArray<FullyBlobbed> }
> {
  const images: Array<FullyBlobbed> = [];
  for (const retrieve of retrieves) {
    const blob = await toMostly(await retrieve());
    if (blob != null) {
      if (!isFully(blob)) return { first: blob }; // image contains no size because it is an svg
      if (blob.width >= 128) return { first: blob };
      images.push(blob);
    }
  }
  return { loaded: images };
}

export function largestImage(
  images: ReadonlyArray<FullyBlobbed>
): FullyBlobbed | null {
  const area = (image: FullyBlobbed) => image.height * image.width;

  let max = null;
  for (const image of images) {
    if (max == null || area(max) < area(image)) {
      max = image;
    }
  }
  return max;
}

export async function retrieveBookmarkImage(
  url: string
): Promise<MostlyFullyBlobbed | null> {
  const html = await retrieveHtml(url);
  if (html == null) {
    return toMostly(await retrieveFaviconImage(url));
  }

  const images = await retrieveFirstOrLoaded([
    () => retrieveOpenGraphImage(url, html),
    () => retrieveTwitterImage(url, html),
    () => retrieveIconImage(url, html),
    () => retrieveAppleIconImage(url, html),
    () => retrievePageImage(url, html, 0),
    () => retrievePageImage(url, html, 1),
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
): Promise<FullyBlobbed | null> {
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
  const mostly = await toMostly(blob);
  if (mostly == null || !isFully(mostly)) return null;
  const result = await scaleDown(mostly);

  await browser.tabs.remove(id);
  saveImage(bookmarkId, result);
  return result;
}

export async function retrieveAndSaveBookmarkImage(
  id: string,
  url: string | null | undefined
): Promise<MostlyFullyBlobbed> {
  if (url == null) {
    return retrieveAndSaveDefaultBookmarkImage(id);
  }

  let image = await retrieveBookmarkImage(url);
  if (image == null) return retrieveAndSaveDefaultBookmarkImage(id);

  if (isFully(image)) image = await scaleDown(image);
  saveImage(id, image);
  return image;
}

export async function retrieveAndSaveDefaultBookmarkImage(bookmarkId: string) {
  const defaultImg = await localImageToBlob(webTileIcon);
  saveImage(bookmarkId, defaultImg);
  return defaultImg;
}

export async function saveImage(bookmarkId: string, blob: MostlyFullyBlobbed) {
  dbSet(tileImageStore, bookmarkId, blob);
}

export function localImageToBlob(localPath: string): Promise<FullyBlobbed> {
  const img = loadImgElem({ url: localPath });

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx == null) {
        return reject("could not get 2d context from canvas");
      }

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0, img.width, img.height);
      canvas.toBlob((blob) => {
        if (blob == null) {
          reject("failed to turn canvas into blob");
        } else {
          resolve({
            blob: blob,
            width: img.width,
            height: img.height,
          });
        }
      });
    };
    img.src = localPath;
  });
}

export async function retrieveTileImage(
  node: browser.Bookmarks.BookmarkTreeNode,
  loadingStartedCallback = () => {},
  forceReload = false
): Promise<SizedBlob> {
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
    const img = await dbGet<Blob>(tileImageStore, node.id);
    if (img == null || forceReload) {
      loadingStartedCallback();
      return retrieveAndSaveBookmarkImage(node.id, node.url);
    } else {
      const size = await dbGet<Sized>(tileImageSizesStore, node.id);
      if (size == null) {
        console.error("missing size for image");
        loadingStartedCallback();
        return retrieveAndSaveBookmarkImage(node.id, node.url);
      } else {
        return {
          blob: img,
          width: size.width,
          height: size.height,
        };
      }
    }
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
