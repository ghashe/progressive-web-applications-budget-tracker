// Create a variable to hold the database connection
let db;

// Establish a connection to an IndexedDB database named 'budget' and setting the version to 1.
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
  // Create a database reference
  const db = event.target.result;
  // Make a new object store (table) called "new_record" with a primary key of sorts that auto increments
  db.createObjectStore("new_record", { autoIncrement: true });
};

// In the event of a successful outcome
request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    uploadBudget();
  }
};

request.onerror = function (event) {
  // The error will be logged here
  console.log("Sorry!" + event.target.errorCode);
};

function saveRecord(record) {
  // Adding a transaction with read-write rights to the new_record database
  const transaction = db.transaction(["new_record"], "readwrite");

  const budgetObjectStore = transaction.objectStore("new_record");

  // With the add method, you can add a record to your budgetObjectStore.
  budgetObjectStore.add(record);
}

function uploadBudget() {
  // Make a transaction in the new_record database
  const transaction = db.transaction("new_record", "readwrite");

  // Getting access to the new_record budgetObjectStore object
  const budgetObjectStore = transaction.objectStore("new_record");

  // Store all records in a variable after retrieving them from the budgetObjectStore
  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          // Create a transaction in your new_record database if successful
          const transaction = db.transaction("new_record", "readwrite");

          // Get access to the new_record object budgetObjectStore
          const budgetObjectStore = transaction.objectStore("new_record");

          // Make sure all items in your budgetObjectStore are cleared
          budgetObjectStore.cleear();
        });
    }
  };
}

// Await the return of the app
window.addEventListener("online", uploadBudget);
