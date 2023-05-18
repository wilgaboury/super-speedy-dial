import browser, { storage } from "webextension-polyfill";
import {
  asyncVisitMutate,
  decodeBlob,
  encodeBlob,
  errorSwitch,
} from "./assorted";

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
  readonly clearAll: (store: string) => Promise<void>;
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

function idbRequestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function IdbDatabase(db: IDBDatabase): Database {
  return {
    get: async (store, key) => {
      const transaction = db.transaction([store], "readwrite");
      return idbRequestToPromise(transaction.objectStore(store).get(key)).catch(
        errorSwitch(null)
      );
    },
    set: (store, key, value) => {
      const transaction = db.transaction([store], "readwrite");
      transaction.objectStore(store).put(value, key);
    },
    clearAll: async (store) => {
      const transaction = db.transaction([store], "readwrite");
      return idbRequestToPromise(transaction.objectStore(store).clear()).catch(
        errorSwitch(undefined)
      );
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
    clearAll: async (store) => {
      const records = await storage.local.get(null);
      await Promise.allSettled(
        Object.entries(records).map(async ([key, value]) => {
          if (key.startsWith(store + storageSeparator)) {
            return storage.local.remove(key);
          }
        })
      );
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
