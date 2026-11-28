// Network-first for the app files (new deploys appear on next open); cache-first for the versioned Firebase SDK so the app also starts offline.
const V="mw-v13",CORE=["/","/index.html","/style.css","/app.js","/firebase-config.js","/manifest.webmanifest","/privacy.html","/icon-192.png","/icon-512.png","/icon-maskable-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{const r=e.request,u=new URL(r.url);if(r.method!=="GET")return;
if(u.hostname==="www.gstatic.com"&&u.pathname.startsWith("/firebasejs/")){e.respondWith(caches.open(V).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}))));return}
if(u.origin!==location.origin)return;
e.respondWith(fetch(r,{cache:"no-cache"}).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res}).catch(()=>caches.match(r).then(m=>m||caches.match("/index.html"))))});
