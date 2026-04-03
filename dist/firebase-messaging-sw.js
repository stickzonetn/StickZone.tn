importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCDnZPBaBpg9FaYOIhgENrvvieLK49OTeI",
    authDomain: "notifications-61cf3.firebaseapp.com",
    projectId: "notifications-61cf3",
    storageBucket: "notifications-61cf3.firebasestorage.app",
    messagingSenderId: "457476846801",
    appId: "1:457476846801:web:4650aae7af87bcd650c1f0"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || 'New Order';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new order!',
        icon: '/logo.png',
        badge: '/logo.png',
        data: { url: '/admin' }
    };
    
    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const url = event.notification.data?.url || '/admin';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url.includes('/admin') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
