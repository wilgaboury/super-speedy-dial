const idb = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
const IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;
const dbVersion = 1.0;
const db_request = idb.open('wils_db', dbVersion);

db_request.onupgradeneeded = function(event) {
    let database = event.target.result;
    database.createObjectStore("background_store");
}

let null_db_callbacks = [];
let db = null;
db_request.onsuccess = function(event) {
    db = event.target.result;
    for (let callback of null_db_callbacks) {
        callback();
    }
};

//Consult https://developer.mozilla.org/en-US/docs/Web/API/IDBRequest to understand the return value

export function getIDBObject(store_name, object_name, callback) {
    if (db == null) {
        null_db_callbacks.push(() => getIDBObject(store_name, object_name, callback));
    } else {
        let transaction = db.transaction([store_name], 'readwrite');
        let request = transaction.objectStore(store_name).get(object_name);
        request.onsuccess = function(event) {
            callback(event.target.result);
        };
    }
}

export function setIDBObject(store_name, object_name, object) {
    console.log('got here');
    if (db == null) {
        null_db_callbacks.push(() => setIDBObject(store_name, object_name, object, callback));
    } else {
        let transaction = db.transaction([store_name], 'readwrite');
        transaction.objectStore(store_name).put(object, object_name);
    }
}