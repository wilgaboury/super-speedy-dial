declare global {
  interface Window {
    webkitIndexedDB: IDBFactory;
    mozIndexedDB: IDBFactory;
    OIndexedDB: IDBFactory;
    msIndexedDB: IDBFactory;
    webkitIDBTransaction: IDBTransaction;
  }
}

const idb =
  window.indexedDB ||
  window.webkitIndexedDB ||
  window.mozIndexedDB ||
  window.OIndexedDB ||
  window.msIndexedDB;
const dbVersion = 2;
const dbRequest = idb.open("wils_db", dbVersion);

const preOpenCallbacks: Array<() => void> = [];
let db: IDBDatabase | Map<string, Map<string, Blob>> | null = null;

dbRequest.onsuccess = function (event) {
  db = dbRequest.result;
  for (const callback of preOpenCallbacks) {
    callback();
  }
  preOpenCallbacks.length = 0;
};

dbRequest.onerror = function () {
  console.log(
    "Cound not connect to IndexedDB. Using temporary in memory data store."
  );
  db = new Map();
  for (let callback of preOpenCallbacks) {
    callback();
  }
  preOpenCallbacks.length = 0;
};

dbRequest.onupgradeneeded = function (event) {
  console.log("upgrading database");

  if (event.target == null) return;

  let database = dbRequest.result;

  if (event.oldVersion < 1) {
    database.createObjectStore("background_store");
  }

  if (event.oldVersion < 2) {
    database.createObjectStore("bookmark_image_cache");
    database.createObjectStore("bookmark_image_cache_sizes");
  }
};

export function getIDBObject<T>(
  storeName: string,
  objectName: string
): Promise<T | null> {
  return new Promise((resolve) => {
    if (db == null) {
      preOpenCallbacks.push(() => resolve(getIDBObject(storeName, objectName)));
    } else if (db instanceof Map) {
      const store = db.get(storeName);
      if (store == null) {
        resolve(null);
        return;
      }

      const object = store.get(objectName);
      if (object == null) {
        resolve(null);
        return;
      }

      resolve(object as T);
    } else {
      const transaction = db.transaction([storeName], "readwrite");
      const request = transaction.objectStore(storeName).get(objectName);
      request.onsuccess = function (event) {
        resolve(request.result);
      };
      request.onerror = function () {
        resolve(null);
      };
    }
  });
}

export function setIDBObject(
  storeName: string,
  objectName: string,
  object: any
) {
  if (db == null) {
    preOpenCallbacks.push(() => setIDBObject(storeName, objectName, object));
  } else if (db instanceof Map) {
    let store = db.get(storeName);
    if (store == null) {
      store = new Map();
      db.set(storeName, store);
    }
    store.set(objectName, object);
  } else {
    const transaction = db.transaction([storeName], "readwrite");
    transaction.objectStore(storeName).put(object, objectName);
  }
}

export function deleteIDBObject(storeName: string, objectName: string) {
  if (db == null) {
    preOpenCallbacks.push(() => deleteIDBObject(storeName, objectName));
  } else if (db instanceof Map) {
    const store = db.get(storeName);
    if (store == null) return;
    store.delete(objectName);
  } else {
    const transaction = db.transaction([storeName], "readwrite");
    transaction.objectStore(storeName).delete(objectName);
  }
}
