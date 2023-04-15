import browser from "webextension-polyfill";
import { blobToString, stringToBlob } from "./utils";

declare global {
  interface Window {
    mozIndexedDB: IDBFactory;
  }
}

export const backgroundImageStore = "background_store";
export const tileImageStore = "tile_images";

export const StorageSeparator = ".";

export function storageKey(keys: ReadonlyArray<string>): string {
  return keys.join(StorageSeparator);
}

export async function storageGet<T>(
  keys: ReadonlyArray<string>
): Promise<T | null> {
  const key = storageKey(keys);
  return (await browser.storage.local.get(key))[key] as T | null;
}

export function storagePut(keys: ReadonlyArray<string>, value: any) {
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

function getDb(): Promise<Database> {
  if (database != null) {
    return Promise.resolve(database);
  }
  return new Promise((resolve) => {
    databaseOnloadCallbacks.push((db: Database) => resolve(db));
  });
}

function setDb(db: Database) {
  database = db;
  for (const callback of databaseOnloadCallbacks) {
    callback(db);
  }
  databaseOnloadCallbacks.length = 0;
}

export async function dbGet<T>(store: string, key: string): Promise<T | null> {
  const db = await getDb();
  const result = await db.get(store, key);
  return result as T | null;
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

async function visitMutate(
  obj: any,
  mutate: (key: string, obj: any) => Promise<void>
): Promise<void> {
  for (const k in obj) {
    mutate(k, obj);
    const value = obj[k];
    if (typeof value === "object") {
      visitMutate(value, mutate);
    }
  }
}

const BlobPrefix = "__ENCODED_BLOB__";
const RootBlobPrefix = "__ROOT_ENCODED_BLOB__";

function StorageDatabase(): Database {
  return {
    set: async (store, key, value) => {
      if (value instanceof Blob) {
        const result: any = {};
        result[`${RootBlobPrefix}`] = await blobToString(value);
        value = result;
      } else {
        await visitMutate(value, async (k, obj) => {
          const v = obj[k];
          if (value instanceof Blob) {
            obj[`${BlobPrefix}${k}`] = await blobToString(v);
          }
        });
      }
      storagePut([store, key], value);
    },
    get: async (store, key) => {
      let value: any = await storageGet([store, key]);
      if (value == null) {
        return null;
      } else if (RootBlobPrefix in value) {
        return stringToBlob(value[`${RootBlobPrefix}`]);
      } else {
        await visitMutate(value, async (k, obj) => {
          if (k.startsWith(BlobPrefix)) {
            const v = obj[k];
            obj[k] = undefined;
            k = k.slice(BlobPrefix.length);
            obj[k] = stringToBlob(v);
          }
        });
        return value;
      }
    },
  };
}

const idb = window.indexedDB || window.mozIndexedDB;
const dbVersion = 1;
const dbRequest = idb.open("super_speedy_dial", dbVersion);

dbRequest.onsuccess = () => setDb(IdbDatabase(dbRequest.result));

dbRequest.onerror = () => {
  console.warn("IndexedDB is unavailable, defaulting to storage.local");
  setDb(StorageDatabase());
};

dbRequest.onupgradeneeded = (event) => {
  console.log("upgrading database");

  if (event.target == null) return;

  const db = dbRequest.result;
  db.createObjectStore(backgroundImageStore);
  db.createObjectStore(tileImageStore);
};
