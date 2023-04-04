import browser from "webextension-polyfill";

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

const databaseOnloadCallbacks: Array<() => void> = [];
let database: Database = StorageDatabase(); // | null;

export function getDb(): Promise<Database> {
  if (database != null) return Promise.resolve(database);
  return new Promise((resolve) => {
    databaseOnloadCallbacks.push(() => resolve(database!));
  });
}

function setDb(db: Database) {
  database = db;
  for (const callback of databaseOnloadCallbacks) {
    callback();
  }
  databaseOnloadCallbacks.length = 0;
}

export async function dbGet<T>(store: string, key: string): Promise<T | null> {
  return (await (await getDb()).get(store, key)) as T | null;
}

export async function dbSet(store: string, key: string, value: any) {
  (await getDb()).set(store, key, value);
}

function IdbDatabase(db: IDBDatabase): Database {
  return {
    get: (store, key) => {
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
    set: (store, key, value) => {
      const record: Record<string, any> = {};
      const storeKey = storageKey([store, key]);

      if (value instanceof Blob) {
        const reader = new FileReader();
        reader.readAsDataURL(value);
        reader.onloadend = () => {
          record[`${storeKey}`] = { blob: reader.result, type: value.type };
          browser.storage.local.set(record);
        };
      } else {
        record[`${storeKey}`] = value;
        browser.storage.local.set(record);
      }
    },
    get: async (store, key) => {
      const storeKey = storageKey([store, key]);
      const record = await browser.storage.local.get(storeKey);
      const value = record[storeKey];
      if (value != null && value.blob != null && value.type != null) {
        return (await fetch(`data:${value.type};base64,${value.blob}`)).blob();
      }
      return value;
    },
  };
}

const idb = window.indexedDB || window.mozIndexedDB;
const dbVersion = 1;
const dbRequest = idb.open("dial_db", dbVersion);

dbRequest.onsuccess = function (event) {
  setDb(IdbDatabase(dbRequest.result));
};

dbRequest.onerror = function () {
  console.warn("IndexedDB is unavailable, defaulting to storage.local");
  setDb(StorageDatabase());
};

dbRequest.onupgradeneeded = function (event) {
  console.log("upgrading database");

  if (event.target == null) return;

  const db = dbRequest.result;
  db.createObjectStore(backgroundImageStore);
  db.createObjectStore(tileImageStore);
  db.createObjectStore(tileImageSizesStore);
};
