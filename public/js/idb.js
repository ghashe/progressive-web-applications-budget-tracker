// The db variable declaration
let db;

// Establish a connection to an IndexedDB database named 'budget' and setting the version to 1.
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
  // Create a database reference
  const db = event.target.result;
  // Make a new object store (table) called "awaiting" with a primary key of sorts that auto increments
  db.createObjectStore("awaiting", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  // The error will be logged here
  console.log("Sorry!" + event.target.errorCode);
};

function recordSaving(record) {
  // Adding a transaction with read-write rights to the awaiting database
  const transaction = db.transaction("awaiting", "readwrite");

  const hold = transaction.objectStore("awaiting");

  // With the add method, you can add a record to your hold.
  hold.add(record);
}

function testDatabase() {
  // Make a transaction in the awaiting database
  const transaction = db.transaction("awaiting", "readwrite");

  // Getting access to the awaiting hold object
  const hold = transaction.objectStore("awaiting");

  // Store all records in a variable after retrieving them from the hold
  const getAllRecords = hold.getAllRecords();

  getAllRecords.onsuccess = function () {
    if (getAllRecords.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAllRecords.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          // Create a transaction in your awaiting database if successful
          const transaction = db.transaction("pending", "readwrite");

          // Get access to the awaiting object hold
          const hold = transaction.objectStore("awaiting");

          // Make sure all items in your hold are cleared
          hold.cleear();
        });
    }
  };
}

// Await the return of the app
window.addEventListener("online", testDatabase);
