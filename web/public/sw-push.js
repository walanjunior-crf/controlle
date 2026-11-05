/* Controlle · notificações. Carregado pelo service worker do app (workbox importScripts). */
self.addEventListener('push', (event) => {
  let n = {}
  try {
    n = event.data ? event.data.json() : {}
  } catch {
    n = { body: event.data ? event.data.text() : '' }
  }
  const base = self.registration.scope
  event.waitUntil(
    self.registration.showNotification(n.title || 'Controlle', {
      body: n.body || '',
      icon: base + 'icons/icon-192.png',
      badge: base + 'icons/badge-96.png',
      tag: n.tag || undefined,
      renotify: Boolean(n.tag),
      data: { url: n.url || base },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.registration.scope) && 'focus' in c) {
          c.navigate(url).catch(() => {})
          return c.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
