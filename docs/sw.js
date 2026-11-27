// Offline support for the installed game. The version below changes every build, so phones pick up new versions.
const CACHE="lantern-10a30fb103";
const FILES=["./","index.html","manifest.json","icon-192.png","icon-512.png","icon-180.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;
  // the game page: try the internet first (to get updates), fall back to the saved copy when offline
  if(r.mode==="navigate"){e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put("index.html",cp));return res;}).catch(()=>caches.match("index.html")));return;}
  // everything else (icons, fonts): use the saved copy if there is one, otherwise fetch and save it
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res&&(res.ok||res.type==="opaque")){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}return res;})));});
