self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "AkadilXbet";
  const options = {
    body: data.body || "You have a new notification!",
    icon: "/akadilxbet-logo.png",
    badge: "/akadilxbet-logo.png",
    tag: data.tag || "default",
    data: data.data || {},
    requireInteraction: true,
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
