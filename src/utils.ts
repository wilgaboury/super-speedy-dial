import { getIDBObject, setIDBObject } from "./idb.js";
import browser from "webextension-polyfill";

export interface Sized {
  readonly width: number;
  readonly height: number;
}

export interface SizedBlob extends Sized {
  readonly blob: Blob;
}

export function findBookmarkById(
  node: browser.Bookmarks.BookmarkTreeNode,
  id: string
): browser.Bookmarks.BookmarkTreeNode | null {
  if (node.id == id) {
    return node;
  }

  if (node.children) {
    for (let child of node.children) {
      let temp = findBookmarkById(child, id);
      if (temp) {
        return temp;
      }
    }
  }

  return null;
}

export function getBookmarkStack(
  bookmarkId: string
): Promise<ReadonlyArray<browser.Bookmarks.BookmarkTreeNode>> {
  return new Promise((resolve) => {
    browser.bookmarks.getTree().then((root) => {
      resolve(getBookmarkStackHelper(root[0], bookmarkId) || [root[0]]);
    });
  });
}

function getBookmarkStackHelper(
  node: browser.Bookmarks.BookmarkTreeNode,
  searchId: string
): Array<browser.Bookmarks.BookmarkTreeNode> | null {
  if (node.id == searchId) {
    return [node];
  }

  if (node.children) {
    for (let child of node.children) {
      let stack = getBookmarkStackHelper(child, searchId);
      if (stack) {
        stack.unshift(node);
        return stack;
      }
    }
  }

  return null;
}

function convertUrlToAbsolute(origin: string, path: string): string {
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

export function getPageImages(url: string): Promise<Array<string>> {
  return new Promise((resolve) => {
    let xhr = new XMLHttpRequest();
    xhr.timeout = 2500;

    let defaultResolve = () => {
      resolve([`https://api.statvoo.com/favicon/?url=${encodeURI(url)}`]);
    };

    xhr.ontimeout = defaultResolve;
    xhr.onerror = defaultResolve;
    xhr.onload = () => {
      if (xhr.responseXML == null) {
        resolve([]);
        return;
      }

      const images: Array<string> = [];

      // get open graph images
      const metas = xhr.responseXML.getElementsByTagName("meta");
      for (let meta of metas) {
        const property = meta.getAttribute("property");
        const content = meta.getAttribute("content");
        if (property === "og:image" && content != null) {
          images.push(convertUrlToAbsolute(url, content));
        }
      }

      // get large icon
      const sizes = ["192x192", "180x180", "144x144", "96x96"];
      for (const size of sizes) {
        const icon = xhr.responseXML.querySelector(
          `link[rel="icon"][sizes="${size}"]`
        );
        if (icon) {
          const href = icon.getAttribute("href");
          if (href != null) {
            images.push(convertUrlToAbsolute(url, href));
            break;
          }
        }
      }

      // get apple touch icon
      const appleIcon = xhr.responseXML.querySelector(
        'link[rel="apple-touch-icon"]'
      );
      if (appleIcon != null) {
        const href = appleIcon.getAttribute("href");
        if (href != null) {
          images.push(convertUrlToAbsolute(url, href));
        }
      }

      // get large favicon
      // let favicon = new URL(url).origin + '/favicon.ico';
      // images.push(favicon);

      // Get First Image on Page
      const imgs = Array.from(xhr.responseXML.querySelectorAll("img[src]"));
      imgs.length = Math.min(imgs.length, 4);
      for (const img of imgs) {
        const src = img.getAttribute("src");
        if (src != null) {
          images.push(convertUrlToAbsolute(url, src));
        }
      }

      // get favicon of unknown size
      images.push(`https://api.statvoo.com/favicon/?url=${encodeURI(url)}`);

      resolve(images);
    };
    xhr.open("GET", url);
    xhr.responseType = "document";
    xhr.send();
  });
}

export async function getFirstGoodImageUrl(
  urls: Array<string>
): Promise<string | null> {
  if (urls.length === 0) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const first = urls[0];
    const rest = urls.splice(1);
    const img = new Image();
    img.onload = () => {
      if (img.width <= 16 || img.height <= 16) {
        getFirstGoodImageUrl(rest).then(resolve);
      } else {
        resolve(first);
      }
    };
    img.onerror = () => getFirstGoodImageUrl(rest).then(resolve);
    img.src = first;
  });
}

// Promise returns blob
export function scaleAndCropImageFromUrl(url: string): Promise<SizedBlob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx == null) {
        reject("could not get 2d context from canvas");
        return;
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
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

// returns data uri
export async function screenshotUrl(url: string): Promise<string> {
  const tab = await browser.tabs.create({ url: url, active: false });
  const id = tab.id;
  if (id == null) {
    throw new Error("tab did not have an id");
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

export async function retrieveBookmarkImage(
  bookmarkId: string,
  pageUrl: string | null | undefined
): Promise<SizedBlob> {
  if (pageUrl == null) {
    return retreiveDefaultBookmarkImage(bookmarkId);
  }

  const urls = await getPageImages(pageUrl);
  const url = await getFirstGoodImageUrl(urls);

  if (url == null) {
    return retreiveDefaultBookmarkImage(bookmarkId);
  }

  const img = await scaleAndCropImageFromUrl(url);
  saveImage(bookmarkId, img);
  return img;
}

export async function retreiveDefaultBookmarkImage(bookmarkId: string) {
  const defaultImg = await localImageToBlob("icons/web.png");
  saveImage(bookmarkId, defaultImg);
  return defaultImg;
}

export function saveImage(bookmarkId: string, img: SizedBlob) {
  setIDBObject("bookmark_image_cache", bookmarkId, img.blob);
  setIDBObject("bookmark_image_cache_sizes", bookmarkId, {
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
        reject("could not get 2d context from canvas");
        return;
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

export async function getBookmarkImage(
  node: browser.Bookmarks.BookmarkTreeNode,
  loadingStartedCallback = () => {},
  forceReload = false
): Promise<SizedBlob> {
  if (node.type == "folder") {
    return localImageToBlob("icons/my_folder.png");
  } else if (node.type == "separator") {
    return localImageToBlob("icons/separator.png");
  } else if (
    node.url != null &&
    node.url.substring(node.url.length - 3) == "pdf"
  ) {
    return localImageToBlob("icons/pdf.png");
  } else {
    const img = await getIDBObject<Blob>("bookmark_image_cache", node.id);
    if (img == null || forceReload) {
      loadingStartedCallback();
      return retrieveBookmarkImage(node.id, node.url);
    } else {
      const size = await getIDBObject<Sized>(
        "bookmark_image_cache_sizes",
        node.id
      );
      if (size == null) {
        console.error("missing size for image");
        loadingStartedCallback();
        return retrieveBookmarkImage(node.id, node.url);
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

export async function getStartFolder(): Promise<browser.Bookmarks.BookmarkTreeNode> {
  const value = await browser.storage.local.get("bookmarkRoot");
  const root = await browser.bookmarks.getTree();
  const start = findBookmarkById(root[0], value.bookmarkRoot);
  return start ?? root[0];
}
