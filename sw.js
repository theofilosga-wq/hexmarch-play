/* Hexmarch service worker (installable app + offline play). Copied next to index.html by build.py; it only runs on the plain page
   (GitHub Pages), never inside the claude.ai artifact.
   - Own files: NETWORK FIRST, so a newly published version shows at once; the cached copy is used only when there is no connection.
   - Pinned libraries and fonts from the CDNs: cached copy at once, refreshed in the background.
   - Videos and range requests are left to the browser. */
const CACHE='hexmarch-app-1';
const HOME='./';
const SHELL=[HOME,'manifest.webmanifest','icon-192.png','icon-512.png'];
const CDN=/(^|\.)(cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const keep=(key,res)=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(key,cp)).catch(()=>{})};
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.protocol!=='http:'&&url.protocol!=='https:')return;
  if(req.headers.has('range')||/\.(mp4|webm)$/i.test(url.pathname))return;
  if(url.origin===self.location.origin){
    const scope=new URL(HOME,self.location).pathname,home=req.mode==='navigate'&&(url.pathname===scope||url.pathname===scope+'index.html');
    e.respondWith(fetch(req).then(res=>{if(res.ok)keep(home?HOME:req,res);return res})
      .catch(()=>(home?caches.match(HOME):caches.match(req,{ignoreSearch:true})).then(hit=>hit||(req.mode==='navigate'?caches.match(HOME):undefined)).then(hit=>hit||Response.error())));
    return}
  if(CDN.test(url.hostname)){
    e.respondWith(caches.match(req).then(hit=>{
      const net=fetch(req).then(res=>{if(res.ok||res.type==='opaque')keep(req,res);return res});
      if(hit){net.catch(()=>{});return hit}
      return net}))}
});
