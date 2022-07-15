// Defining which files we would like to cache
const fileToCache = [
  "/",
  "manifest.json",
  "index.html",
  "css/styles.css",
  "js/index.js",
  "https://cdn.jsdelivr.net/npm/chart.js@2.8.0",
  "js/idb.js",
  "icons/icon-192x192.png",
  "icons/icon-512x512.png",
];

// setting up cacheName as a global constant to help keep track of which cache to use.
const cacheName = "static-cache-v2";

const dataCacheName = "data-cache-v1";

// Installing the service worker by using the self keyword, so that the application can instantiate listeners on the service worker and can use the cache.
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      console.log(
        "A pre-cached version of your files has been successfully created!"
      );
      return cache.addAll(fileToCache);
    })
  );
  self.skipWaiting();
});

// Adding an event listener to the activate event
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then((keylist) => {
      return Promise.all(
        keylist.map((key) => {
          if (key !== cacheName && key !== dataCacheName) {
            console.log("Getting rid of old cache data!", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();

  // Creating an additional event listener for cleaning up old service workers that have already been managed, and for adding necessary files to the cache
  self.addEventListener("fetch", function (event) {
    // Keep a cache of successful API calls
    if (event.request.url.includes("/api/")) {
      event.respondWith(
        caches
          .open(dataCacheName)
          .then((cache) => {
            return fetch(event.request)
              .then((response) => {
                // In case the response was successful, clone and cache it.
                if (response.status === 200) {
                  cache.put(event.request.url, response.clone());
                }
                return response;
              })
              .catch((err) => {
                // Try getting it from the cache if the network request failed.
                return cache.match(event.request);
              });
          })
          .catch((err) => console.log(err))
      );
      return;
    }
    // In cases where the request does not involve API access, serve static assets using "offline first" practice.
    event.respondWith(
      caches.match(event.request).then(function (response) {
        return response || fetch(event.request);
      })
    );
  });
});
