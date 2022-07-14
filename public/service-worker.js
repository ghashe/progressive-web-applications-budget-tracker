// defining file-to-catch variable
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

const cacheName = "static-cache-v2";
const dataCacheName = "data-cache-v1";

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

  // fetch
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
