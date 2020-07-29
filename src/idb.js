// const idb = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
// const IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;
// const dbVersion = 1.0;
// const request = idb.open('wils_db', dbVersion);

// let db;

// request.onsuccess = function(event) {
//     db = request.result;
// };

// //Consult https://developer.mozilla.org/en-US/docs/Web/API/IDBRequest to understand the return value

// export function getIDBObject(store_name, object_name) {
//     let transaction = db.transaction([store_name], IDBTransaction.READ_WRITE);
//     return transaction.objectStore(store_name).get(object_name);
// }

// export function setIDBObject(store_name, object_name, blob) {
//     let transaction = db.transaction([store_name], IDBTransaction.READ_WRITE);
//     return transaction.objectStore(store_name).put(blob, object_name);
// }