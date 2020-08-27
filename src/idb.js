const idb = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
const IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;
const dbVersion = 2;
const db_request = idb.open('wils_db', dbVersion);

db_request.onupgradeneeded = function(event) {
    console.log('upgrading database');
    let database = event.target.result;

    if (event.oldVersion < 1) {
        database.createObjectStore("background_store");
    }

    if (event.oldVersion < 2) {
        database.createObjectStore("bookmark_image_cache");
        database.createObjectStore("bookmark_image_cache_sizes");
    }
}

let null_db_callbacks = [];
let db = null;
db_request.onsuccess = function(event) {
    db = event.target.result;
    for (let callback of null_db_callbacks) {
        callback();
    }
};

db_request.onerror = function() {
    console.log('Cound not connect to IndexedDB. Using temporary in memory data store.');
    db = new Map();
    for (let callback of null_db_callbacks) {
        callback();
    }
}

export function getIDBObject(store_name, object_name, callback) {
    if (db == null) {
        null_db_callbacks.push(() => getIDBObject(store_name, object_name, callback));
    } else if (db instanceof Map) {
        if (db.has(store_name) && db.get(store_name).has(object_name)) {
            callback(db.get(store_name).get(object_name));
        } else {
            callback(null);
        }
    } else {
        let transaction = db.transaction([store_name], 'readwrite');
        let request = transaction.objectStore(store_name).get(object_name);
        request.onsuccess = function(event) {
            callback(event.target.result);
        };
        request.onerror = function() {
            callback(null);
        }
    }
}

export function setIDBObject(store_name, object_name, object) {
    if (db == null) {
        null_db_callbacks.push(() => setIDBObject(store_name, object_name, object, callback));
    } else if (db instanceof Map) {
        if (!db.has(store_name)) {
            db.set(store_name, new Map());
        }
        db.get(store_name).set(object_name, object);
    } else {
        let transaction = db.transaction([store_name], 'readwrite');
        transaction.objectStore(store_name).put(object, object_name);
    }
}