/* مساعد المشرف التربوي: العمل بدون إنترنت */
var CACHE = "msa-v2.6";
var FONTS = "msa-fonts-v1";
var FILES = ["./", "./index.html", "./seed.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES.map(function (u) { return new Request(u, { cache: "reload" }); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE && k !== FONTS; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  // الخطوط العربية من Google: تُحفظ أول مرة، وبعدها تشتغل بدون إنترنت
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com" || (url.hostname === "www.gstatic.com" && url.pathname.indexOf("/firebasejs/") === 0)) {
    e.respondWith(caches.open(FONTS).then(function (c) {
      return c.match(e.request).then(function (hit) {
        return hit || fetch(e.request).then(function (r) { c.put(e.request, r.clone()); return r; }).catch(function () { return hit; });
      });
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // ملفات البرنامج: من الذاكرة أولًا، وتتحدث في الخلفية لما يكون فيه إنترنت
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var fresh = e.request.mode === "navigate" ? new Request(e.request.url, { cache: "no-cache", credentials: "same-origin" }) : new Request(e.request, { cache: "no-cache" });
      var net = fetch(fresh).then(function (r) { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
