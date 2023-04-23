import browser from "webextension-polyfill";
import { asyncVisitMutate, decodeBlob, encodeBlob } from "./assorted";

declare global {
  interface Window {
    mozIndexedDB: IDBFactory;
    webkitIndexedDB: IDBFactory;
    msIndexedDB: IDBFactory;
    shimIndexedDB: IDBFactory;
  }
}

export const backgroundImageStore = "background_store";
export const tileImageStore = "tile_image_store";
export const faviconStore = "favicon_store";

export const storageSeparator = ".";

export function storageKey(keys: ReadonlyArray<string>): string {
  return keys.join(storageSeparator);
}

export async function storageGet<T>(
  keys: ReadonlyArray<string>
): Promise<T | null> {
  const key = storageKey(keys);
  return (await browser.storage.local.get(key))[key] as T | null;
}

export function storageSet(keys: ReadonlyArray<string>, value: any) {
  const record: Record<string, any> = {};
  const key = storageKey(keys);
  record[key] = value;
  browser.storage.local.set(record);
}

export interface Database {
  readonly get: (store: string, key: string) => Promise<unknown>;
  readonly set: (store: string, key: string, value: any) => void;
}

const databaseOnloadCallbacks: Array<(db: Database) => void> = [];
let database: Database | null = null;
let usingIdb: null | boolean;

export function getDb(): Promise<Database> {
  if (database != null) {
    return Promise.resolve(database);
  }
  return new Promise((resolve) => {
    databaseOnloadCallbacks.push(() => resolve(database!));
  });
}

export async function isUsingIdb(): Promise<boolean> {
  if (usingIdb != null) {
    return usingIdb;
  } else {
    return new Promise((resolve) => {
      databaseOnloadCallbacks.push(() => resolve(usingIdb!));
    });
  }
}

function setDb(db: Database, isIdb: boolean) {
  usingIdb = isIdb;
  database = db;
  for (const callback of databaseOnloadCallbacks) {
    callback(db);
  }
  databaseOnloadCallbacks.length = 0;
}

export async function dbGet(store: string, key: string): Promise<unknown> {
  return (await getDb()).get(store, key);
}

export async function dbSet(store: string, key: string, value: any) {
  const db = await getDb();
  db.set(store, key, value);
}

function IdbDatabase(db: IDBDatabase): Database {
  return {
    get: async (store, key) => {
      return new Promise((resolve) => {
        const transaction = db.transaction([store], "readwrite");
        const request = transaction.objectStore(store).get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      });
    },
    set: (store, key, value) => {
      const transaction = db.transaction([store], "readwrite");
      transaction.objectStore(store).put(value, key);
    },
  };
}

const blobPrefix = "__ENCODED_BLOB__";
const rootBlobPrefix = "__ROOT_ENCODED_BLOB__";

export function StorageDatabase(): Database {
  return {
    set: async (store, key, value) => {
      if (value instanceof Blob) {
        const result: any = {};
        result[`${rootBlobPrefix}`] = await encodeBlob(value);
        value = result;
      } else {
        await asyncVisitMutate(value, async (k, obj) => {
          const v = obj[k];
          if (value instanceof Blob) {
            obj[`${blobPrefix}${k}`] = await encodeBlob(v);
          }
        });
      }
      storageSet([store, key], value);
    },
    get: async (store, key) => {
      let value: any = await storageGet([store, key]);
      if (value == null) {
        return null;
      } else if (rootBlobPrefix in value) {
        return decodeBlob(value[`${rootBlobPrefix}`]);
      } else {
        await asyncVisitMutate(value, async (k, obj) => {
          if (k.startsWith(blobPrefix)) {
            const v = obj[k];
            obj[k] = undefined;
            k = k.slice(blobPrefix.length);
            obj[k] = decodeBlob(v);
          }
        });
        return value;
      }
    },
  };
}

const idb =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;
const dbVersion = 3;

const defaultStorageInfoString =
  "IndexedDB is unavailable, defaulting to storage.local";

if (idb != null) {
  const dbRequest = idb.open("super_speedy_dial", dbVersion);

  dbRequest.onsuccess = () => setDb(IdbDatabase(dbRequest.result), true);

  dbRequest.onerror = () => {
    console.info(defaultStorageInfoString);
    setDb(StorageDatabase(), false);
  };

  dbRequest.onupgradeneeded = (event) => {
    console.info("upgrading database");

    if (event.target == null) return;

    const db = dbRequest.result;
    const names = db.objectStoreNames;
    const stores = [backgroundImageStore, tileImageStore, faviconStore];

    for (const store of stores) {
      if (!names.contains(store)) db.createObjectStore(store);
    }
  };
} else {
  console.info(defaultStorageInfoString);
  setDb(StorageDatabase(), false);
}
