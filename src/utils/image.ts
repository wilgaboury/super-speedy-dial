import { Tabs, bookmarks, tabs } from "webextension-polyfill";
import pdfTileIcon from "../assets/pdf.svg";
import videoTileIcon from "../assets/video.svg";
import {
  convertUrlToAbsolute,
  decodeBlob,
  escapeRegExp,
  getObjectUrl,
  urlToDomain,
} from "./assorted";
import { Size } from "./geom";
import { createRandomStringSeed, randomHue } from "./rand";

export interface RasterImage {
  readonly kind: "raster";
  readonly blob: Blob;
  readonly size: Size;
}

export interface VectorImage {
  readonly kind: "vector";
  readonly blob: Blob;
}

export type Image = RasterImage | VectorImage;

export interface TextAndHue {
  readonly text: string;
  readonly hue: number;
}

export interface BookmarkVisualImage {
  readonly kind: "image";
  readonly image: Image;
}

export interface BookmarkVisualText {
  readonly kind: "text";
  readonly text: string;
  readonly hue: number;
}

export type BookmarkVisual = BookmarkVisualImage | BookmarkVisualText;

export function isBookmarkVisual(obj: any): obj is BookmarkVisual {
  return isBookmarkVisualImage(obj) || isBookmarkVisualText(obj);
}

function isBookmarkVisualImage(obj: any): obj is BookmarkVisualImage {
  return (
    obj != null &&
    obj.kind != null &&
    obj.kind === "image" &&
    isImageType(obj.image)
  );
}

function isBookmarkVisualText(obj: any): obj is BookmarkVisualImage {
  return (
    obj != null &&
    obj.kind != null &&
    obj.kind === "text" &&
    obj.text != null &&
    typeof obj.text === "string" &&
    obj.hue != null &&
    typeof obj.hue === "number"
  );
}

function isImageType(obj: any): obj is BookmarkVisualImage {
  return isRasterImage(obj) || isVectorImage(obj);
}

function isRasterImage(obj: any): obj is RasterImage {
  return (
    obj != null &&
    obj.kind != null &&
    obj.kind === "raster" &&
    obj.blob != null &&
    obj.blob instanceof Blob &&
    isSize(obj.size)
  );
}

function isVectorImage(obj: any): obj is VectorImage {
  return (
    obj != null &&
    obj.kind != null &&
    obj.kind === "vector" &&
    obj.blob != null &&
    obj.blob instanceof Blob
  );
}

function isSize(obj: any): obj is Size {
  return (
    obj != null &&
    obj.width != null &&
    typeof obj.width === "number" &&
    obj.height != null &&
    typeof obj.height === "number"
  );
}

export async function scaleDown(
  image: Image,
  maxDimSize: number = 512
): Promise<Image> {
  if (image.kind == "vector") {
    return image;
  }

  const img = await loadImg(getObjectUrl(image.blob));
  let width;
  let height;
  if (image.size.width > maxDimSize || image.size.height > maxDimSize) {
    const scale = maxDimSize / Math.max(img.width, img.height);
    width = Math.round(scale * img.width);
    height = Math.round(scale * img.height);
  } else {
    width = img.width;
    height = img.height;
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (ctx == null) {
    throw new Error("could not initialize 2d context");
  }

  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height);

  const blob = await canvas.convertToBlob({
    type: "image/webp",
    quality: 0.75,
  });

  return {
    kind: "raster",
    blob,
    size: {
      width,
      height,
    },
  };
}

const supportedDomParserTypes = [
  "application/xhtml+xml",
  "application/xml",
  "image/svg+xml",
  "text/html",
  "text/xml",
];

export function isSupportedDomParserType(
  type: string
): type is DOMParserSupportedType {
  return supportedDomParserTypes.includes(type);
}

const supportedImageTypes = [
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
  "image/x-icon",
];

const supportedImageTypeRegex = new RegExp(
  `^${supportedImageTypes.map(escapeRegExp).join("|")}.*$`
);

export function isSupportedImageType(type: string) {
  return supportedImageTypeRegex.test(type);
}

export function isVectorImageType(type: string) {
  return type.trim().startsWith("image/svg+xml");
}

export function isRasterImageType(type: string) {
  return !isVectorImageType(type);
}

export async function retrieveBlob(
  url: string | null | undefined
): Promise<Blob | null> {
  if (url == null) return Promise.resolve(null);
  try {
    const response = await fetch(url, { credentials: "include" });
    if (response.ok) return response.blob();
  } catch (e) {
    console.error(e);
  }
  return null;
}

export async function retrieveLocalBlob(url: string): Promise<Blob> {
  return (await fetch(url)).blob();
}

export async function loadImage(url: string): Promise<Image> {
  return (await blobToImage(await retrieveLocalBlob(url), url))!;
}

/**
 * This should only be called on static resources and urls from URL.createObjectURL
 */
async function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = url;
  });
}

/**
 * @param url should always resolve correctly during runtime (i.e. a static resource or URL.createObjectURL)
 */
export async function blobToImage(
  blob: Blob | null | undefined,
  url?: string
): Promise<Image | null> {
  if (blob == null || !isSupportedImageType(blob.type)) return null;
  if (isVectorImageType(blob.type)) {
    return { kind: "vector", blob };
  } else {
    const img = await loadImg(getObjectUrl(blob));
    return {
      kind: "raster",
      blob,
      size: { width: img.width, height: img.height },
    };
  }
}

export function retrieveFaviconBlob(url: string): Promise<Blob | null> {
  return retrieveBlob(
    `https://frail-turquoise-baboon.faviconkit.com/${new URL(url).hostname}/512`
  );
}

export async function retrieveFaviconBlobSmall(
  url: string
): Promise<Blob | null> {
  return retrieveBlob(
    `https://www.google.com/s2/favicons?domain=${urlToDomain(url)}&sz=32`
  );
}

export async function retrieveOpenGraphBlob(
  url: string,
  html: Document
): Promise<Blob | null> {
  const content = html
    .querySelector('meta[property="og:image"]')
    ?.getAttribute("content");
  if (content == null) return null;
  return retrieveBlob(convertUrlToAbsolute(url, content));
}

export async function retrieveTwitterBlob(
  url: string,
  html: Document
): Promise<Blob | null> {
  const content = html
    .querySelector('meta[name="twitter:image"]')
    ?.getAttribute("content");
  if (content == null) return null;
  return retrieveBlob(convertUrlToAbsolute(url, content));
}

export async function retrieveIconShortcutBlob(
  url: string,
  html: Document
): Promise<Blob | null> {
  const content = html
    .querySelector('link[rel="shortcut icon"][type="image/x-icon"]')
    ?.getAttribute("href");
  if (content == null) return null;
  return retrieveBlob(convertUrlToAbsolute(url, content));
}

export async function retrieveIconBlob(
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

export async function retrieveAppleIconBlob(
  url: string,
  html: Document
): Promise<Blob | null> {
  const href = html
    .querySelector('link[rel="apple-touch-icon"]')
    ?.getAttribute("href");
  if (href == null) return null;
  return retrieveBlob(convertUrlToAbsolute(url, href));
}

export async function retrievePageBlob(
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
export async function retrieveFirstImageOrLoaded(
  retrieves: ReadonlyArray<() => Promise<Blob | null>>
): Promise<{ first: Image } | { loaded: ReadonlyArray<RasterImage> }> {
  const images: Array<RasterImage> = [];
  for (const retrieve of retrieves) {
    const blob = await blobToImage(await retrieve());
    if (blob != null) {
      if (blob.kind == "vector") return { first: blob };
      if (blob.size.width >= 128) return { first: blob };
      images.push(blob);
    }
  }
  return { loaded: images };
}

export function largestImage<T extends RasterImage>(
  images: ReadonlyArray<T>
): T | null {
  const area = (size: Size) => size.height * size.width;

  let max: T | null = null;
  for (const image of images) {
    if (max == null || area(max.size) < area(image.size)) {
      max = image;
    }
  }
  return max;
}

async function retrieveBlobFromMime(mimeType: string): Promise<Blob | null> {
  if (mimeType.startsWith("video")) {
    return retrieveLocalBlob(videoTileIcon);
  } else if (mimeType.startsWith("application/pdf")) {
    return retrieveLocalBlob(pdfTileIcon);
  } else {
    return null;
  }
}

const parser = new DOMParser();

export async function retrieveBookmarkImage(
  url: string
): Promise<Image | null> {
  try {
    const response = await fetch(url, { credentials: "include" });

    const contentType = response.headers.get("Content-Type");
    if (!response.ok || contentType == null)
      return blobToImage(await retrieveFaviconBlob(url));

    const mimeType = contentType.split(";")[0].trim();

    if (isSupportedImageType(mimeType))
      return blobToImage(await response.blob());

    const mimeImage = await retrieveBlobFromMime(mimeType);

    if (!isSupportedDomParserType(mimeType)) {
      return blobToImage(mimeImage ?? (await retrieveFaviconBlob(url)));
    }

    const html = parser.parseFromString(await response.text(), mimeType);
    const images = await retrieveFirstImageOrLoaded([
      () => retrieveOpenGraphBlob(url, html),
      () => retrieveTwitterBlob(url, html),
      () => retrieveIconBlob(url, html),
      () => retrieveIconShortcutBlob(url, html),
      () => retrieveAppleIconBlob(url, html),
      () => retrievePageBlob(url, html),
      () => retrieveFaviconBlob(url),
      () => Promise.resolve(mimeImage),
    ]);

    if ("first" in images) {
      return images.first;
    } else {
      return largestImage(images.loaded);
    }
  } catch {
    return blobToImage(await retrieveFaviconBlob(url));
  }
}

export async function awaitTabLoad(id: number): Promise<boolean> {
  return new Promise((resolve) => {
    const listener = (
      _tabId: any,
      changeInfo: Tabs.OnUpdatedChangeInfoType
    ) => {
      if (changeInfo.status != null && changeInfo.status == "complete") {
        tabs.onUpdated.removeListener(listener);
        setTimeout(() => resolve(true), 7500); // give page a bit of time to load
      }
    };

    tabs.onUpdated.addListener(listener, {
      properties: ["status"],
      tabId: id,
    });

    setTimeout(() => {
      tabs.onUpdated.removeListener(listener);
      resolve(false);
    }, 10000);
  });
}

export async function retrievePageScreenshotImage(
  url: string | undefined | null
): Promise<Image | null> {
  if (url == null) return null;
  const tab = await tabs.create({ url: url, active: false });
  const id = tab.id;
  if (id == null) return null;

  await tabs.hide(id);
  if (!(await awaitTabLoad(id))) return null;

  const imageUri = await tabs.captureTab(id);
  const blob = await decodeBlob(imageUri);
  const meta = await blobToImage(blob);
  if (meta == null) return null;
  const result = await scaleDown(meta);

  await tabs.remove(id);
  return result;
}

export async function defaultBookmarkVisual(
  bookmarkId: string
): Promise<BookmarkVisual> {
  const bookmark = (await bookmarks.get(bookmarkId))[0];
  return {
    kind: "text",
    text: urlToDomain(bookmark.url!),
    hue: randomHue(createRandomStringSeed(bookmark.id)),
  };
}
