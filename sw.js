
const CACHE="remindue-v1.2.1";
const SHELL=["./","./index.html","./manifest.webmanifest","./src/css/styles.css","./src/js/app.js","./src/js/dates.js","./src/js/storage.js","./src/js/notifications.js","./assets/icons/icon-192.png","./assets/icons/icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match("./index.html")))})
