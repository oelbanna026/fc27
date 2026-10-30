/* FC 27 — Defense Lab · service worker
   الهدف: أول فتحة واحدة بالنت، وبعد كده الموقع يفتح بدون نت خالص. */

const VERSION = "fc27-lab-v1";

const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      await Promise.all(
        CORE.map(async (url) => {
          try {
            await cache.add(new Request(url, { cache: "reload" }));
          } catch (_) {
            /* عنصر واحد مش موجود مايوقعش التركيب */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch (_) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  /* التنقل بين الصفحات: النسخة المحفوظة فوراً، والتحديث في الخلفية لو فيه نت */
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(VERSION);
        const cached = await cache.match("./index.html");
        const network = fetch(req)
          .then(async (res) => {
            if (res && res.ok) await cache.put("./index.html", res.clone());
            return res;
          })
          .catch(() => null);
        return (
          cached ||
          (await network) ||
          new Response(
            "<!doctype html><meta charset='utf-8'><title>FC 27</title>" +
              "<body style='background:#0a0f12;color:#e8f2f0;font-family:system-ui;padding:40px;text-align:center'>" +
              "<h2>النسخة الأوفلاين لسه ماتحفظتش</h2>" +
              "<p>افتح الصفحة مرة واحدة والنت شغال، وبعد كده هتفتح بدون نت.</p></body>",
            { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
          )
        );
      })()
    );
    return;
  }

  /* الملفات: من الكاش أولاً، وبعدين الشبكة */
  event.respondWith(
    (async () => {
      const cache = await caches.open(VERSION);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.ok && res.type === "basic") cache.put(req, res.clone());
        return res;
      } catch (_) {
        return new Response("", { status: 504, statusText: "offline" });
      }
    })()
  );
});
