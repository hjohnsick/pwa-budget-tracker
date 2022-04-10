// create variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1

const request = indexedDB.open("budget_tracker", 1);

// this event will emit if the database version changes (nonexistant to version 1, v1, to v2, etc)

request.onupgradeneeded = function (event) {
  // save a reference to the database

  const db = event.target.result;

  // create an object store (table) called 'new_budget', set it to have an auto incrementing primary key of sorts

  db.createObjectStore("new_budget", { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;

  //check if app is online, if yes run uploadBudget() function to send all local db data to api
  if (navigator.onLine) {
    uploadBudget();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new budget and there's no internet connection

function saveRecord(record) {
  // open a new transaction with the database with read and write permissions

  const transaction = db.transaction(["new_budget"], "readwrite");

  // access the object store for 'new_budget'
  const budgetObjectStore = transaction.objectStore("new_budget");

  // add record to your store with add method
  budgetObjectStore.add(record);
}

function uploadBudget() {
  const transaction = db.transaction(["new_budget"], "readwrite");
  const budgetObjectStore = transaction.objectStore("new_budget");
  const getTransactions = budgetObjectStore.getAll();
  getTransactions.onsuccess = function () {
    if (getTransactions.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getTransactions.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(["new_budget"], "readwrite");
          const budgetObjectStore = transaction.objectStore("new_budget");
          budgetObjectStore.clear();

          alert("All saved budget has been submited!");
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", uploadBudget);
