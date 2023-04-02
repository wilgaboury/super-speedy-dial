import browser from "webextension-polyfill";
import pdfTileIcon from "./assets/pdf.png";
import folderTileIcon from "./assets/folder.png";
import seperatorTileIcon from "./assets/separator.png";
import webTileIcon from "./assets/web.png";
import { dbGet, dbSet, tileImageSizesStore, tileImageStore } from "./database";
import { Accessor, createEffect, createSignal } from "solid-js";

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

export type SizedBlob = Sized & Blobbed;
export type SizedUrl = Sized & Urled;
export type SizedUrlBlob = Sized & Blobbed & Urled;

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

export function scaleAndCropImage(img: HTMLImageElement): Promise<SizedBlob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (ctx == null) {
      return reject("could not initialize 2d context");
    }

    if (img.width > 512 || img.height > 512) {
      let scale = Math.max(img.width, img.height) / 512;
      canvas.width = img.width / scale;
      canvas.height = img.height / scale;
    } else {
      canvas.width = img.width;
      canvas.height = img.height;
    }

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

    canvas.toBlob((blob) => {
      if (blob == null) {
        // TODO: sometimes images that get loaded have a heigth and width of zero
        reject("scale and crop: failed to turn canvas into blob");
      } else {
        resolve({
          blob: blob,
          width: img.width,
          height: img.height,
        });
      }
    });
  });
}

export function retrieveImage(
  url: string | null | undefined
): Promise<HTMLImageElement | null> {
  if (url == null) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
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

export function retrieveFaviconImage(
  url: string
): Promise<HTMLImageElement | null> {
  return retrieveImage(`https://api.faviconkit.com/${new URL(url).hostname}`);
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
): Promise<HTMLImageElement | null> {
  const content = getMetaTagContent("property", "og:image", html);
  if (content == null) return null;
  return retrieveImage(convertUrlToAbsolute(url, content));
}

export async function retrieveTwitterImage(
  url: string,
  html: Document
): Promise<HTMLImageElement | null> {
  const content = getMetaTagContent("name", "twitter:image", html);
  if (content == null) return null;
  return retrieveImage(convertUrlToAbsolute(url, content));
}

export async function retrieveIconImage(
  url: string,
  html: Document
): Promise<HTMLImageElement | null> {
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
        const image = await retrieveImage(convertUrlToAbsolute(url, href));
        if (image != null) return image;
      }
    }
  }
  return null;
}

export async function retrieveAppleIconImage(
  url: string,
  html: Document
): Promise<HTMLImageElement | null> {
  const appleIcon = html.querySelector('link[rel="apple-touch-icon"]');
  if (appleIcon != null) {
    const href = appleIcon.getAttribute("href");
    if (href != null) {
      return retrieveImage(convertUrlToAbsolute(url, href));
    }
  }
  return null;
}

export async function retrievePageImage(
  url: string,
  html: Document,
  limit: number = 3
): Promise<HTMLImageElement | null> {
  const elems = Array.from(html.querySelectorAll("img[src]")).slice(0, limit);
  for (const elem of elems) {
    const src = elem.getAttribute("src");
    if (src != null) {
      const image = await retrieveImage(convertUrlToAbsolute(url, src));
      if (image != null) return image;
    }
  }
  return null;
}

export async function getFirstLargeImage(
  retrieveImages: ReadonlyArray<() => Promise<HTMLImageElement | null>>
): Promise<HTMLImageElement | ReadonlyArray<HTMLImageElement>> {
  const images: Array<HTMLImageElement> = [];
  for (const retrieveImage of retrieveImages) {
    const image = await retrieveImage();
    if (image != null) {
      if (image.width > 128) {
        return image;
      }
      images.push(image);
    }
  }
  return images;
}

export function largestImage(
  images: ReadonlyArray<HTMLImageElement>
): HTMLImageElement | null {
  const area = (image: HTMLImageElement) => image.height * image.width;

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
): Promise<HTMLImageElement | null> {
  const html = await retrieveHtml(url);
  if (html == null) {
    return retrieveFaviconImage(url);
  }

  const images = await getFirstLargeImage([
    () => retrieveOpenGraphImage(url, html),
    () => retrieveTwitterImage(url, html),
    () => retrieveIconImage(url, html),
    () => retrieveAppleIconImage(url, html),
    () => retrievePageImage(url, html, 0),
    () => retrievePageImage(url, html, 1),
    () => retrieveFaviconImage(url),
  ]);

  if (images instanceof HTMLImageElement) {
    return images;
  } else {
    return largestImage(images);
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

export async function retrievePageScreenshotUri(
  url: string
): Promise<string | null> {
  const tab = await browser.tabs.create({ url: url, active: false });
  const id = tab.id;
  if (id == null) {
    return null;
  }
  await browser.tabs.hide(id);
  return new Promise((resolve) => {
    browser.tabs.onUpdated.addListener(
      async () => {
        const imageUri = await browser.tabs.captureTab(id);
        await browser.tabs.remove(id);
        resolve(imageUri);
      },
      { properties: ["status"], tabId: tab.id }
    );
  });
}

export async function retrieveAndSaveBookmarkImage(
  id: string,
  url: string | null | undefined
): Promise<SizedBlob> {
  if (url == null) {
    return retrieveAndSaveDefaultBookmarkImage(id);
  }

  const image = await retrieveBookmarkImage(url);
  if (image != null) {
    const result = await scaleAndCropImage(image);
    saveImage(id, result);
    return result;
  }

  return retrieveAndSaveDefaultBookmarkImage(id);
}

export async function retrieveAndSaveDefaultBookmarkImage(bookmarkId: string) {
  const defaultImg = await localImageToBlob(webTileIcon);
  saveImage(bookmarkId, defaultImg);
  return defaultImg;
}

export async function saveImage(bookmarkId: string, img: SizedBlob) {
  dbSet(tileImageStore, bookmarkId, img.blob);
  dbSet(tileImageSizesStore, bookmarkId, {
    width: img.width,
    height: img.height,
  });
}

export function localImageToBlob(localPath: string): Promise<SizedBlob> {
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

export function addUrlToBlob<T extends Blobbed>(blob: T): T & Urled {
  return {
    url: URL.createObjectURL(blob.blob),
    ...blob,
  };
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
