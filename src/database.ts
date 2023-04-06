import browser from "webextension-polyfill";
import { blobToString, stringToBlob } from "./utils";

declare global {
  interface Window {
    mozIndexedDB: IDBFactory;
  }
}

export const backgroundImageStore = "background_store";
export const tileImageStore = "tile_images";
export const tileImageSizesStore = "tile_image_sizes";

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
let database: Database | null = null; // StorageDatabase(); // TODO: test this

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

function StorageDatabase(): Database {
  return {
    set: async (store, key, value) => {
      const record: Record<string, any> = {};
      const storeKey = storageKey([store, key]);

      if (value instanceof Blob) {
        value = { blob: await blobToString(value) };
      }
      record[`${storeKey}`] = value;
      browser.storage.local.set(record);
    },
    get: async (store, key) => {
      const storeKey = storageKey([store, key]);
      const record = await browser.storage.local.get(storeKey);
      const value = record[storeKey];
      if (value != null && value.blob != null) {
        return stringToBlob(value.blob);
      }
      return value;
    },
  };
}

const idb = window.indexedDB || window.mozIndexedDB;
const dbVersion = 1;
const dbRequest = idb.open("dial_db", dbVersion);

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
  db.createObjectStore(tileImageSizesStore);
};
