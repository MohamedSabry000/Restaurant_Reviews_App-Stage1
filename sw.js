//var cacheID = "restaurant-reviews-x2";


self.addEventListener("install", function (event) {
    // e.waitUntil Delays the event until the Promise is resolved
    event.waitUntil(caches.open("restaurant-reviews-x1").then(function (cache) {
        // Add all the default files to the cache
        return cache
            .addAll([
            "/",
            "index.html",
            "restaurant.html",
            "/restaurant.html?id=1",
            "/restaurant.html?id=2",
            "/restaurant.html?id=3",
            "/restaurant.html?id=4",
            "/restaurant.html?id=5",
            "/restaurant.html?id=6",
            "/restaurant.html?id=7",
            "/restaurant.html?id=8",
            "/restaurant.html?id=9",
            "/restaurant.html?id=10",
            "css/styles.css",
            "css/normalize.css",
            "data/restaurants.json",
            "js/dbhelper.js",
            "js/main.js",
            "js/restaurant_info.js",
            "js/register-sw.js"
        ]).catch(function (error) {
                console.log("Caches open failed: " + error);
            });
    }));
});


self.addEventListener('activate', function (event) {
    event.waitUntil(
        // Get all the cache keys (cacheName)
        caches.keys()
        .then((cacheNames) => {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('resturant-') &&
                        cacheName != staticCacheName;
                }).map(function (cacheName) {
                    // Delete a previous cacheName
                    return caches.delete(cacheName);
                })
            );
        })
    );
});


self.addEventListener("fetch", event => {
    let cacheRequest = event.request;
    let cacheUrlObj = new URL(event.request.url);
    if (event.request.url.indexOf("restaurant.html") > -1) {
        const cacheURL = "restaurant.html";
        cacheRequest = new Request(cacheURL);
    }
    if (cacheUrlObj.hostname !== "localhost") {
        event.request.mode = "no-card";
    }
debugger
    // event.respondWidth Responds to the fetch event
    event.respondWith(caches.match(cacheRequest).then(response => {
        return (response || fetch(event.request).then(fetchResponse => {
            //  Open the cache
            return caches
                .open("restaurant-reviews-x1")
                .then(cache => {
                    if (fetchResponse.url.indexOf("browser-sync") === -1) {
                        // Put the fetched response in the cache
                        cache.put(event.request, fetchResponse.clone());
                    }
                    // Return the cached version
                    return fetchResponse;
                });
        }).catch(error => {
            console.log("Application is not connected to the internet");
        }));
    }));
});
