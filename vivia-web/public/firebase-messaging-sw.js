// Firebase Messaging Service Worker
// Este archivo DEBE estar en la raíz del servidor (public/).
// Las variables de entorno de Vite NO están disponibles aquí.

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyD27fH_gee-HOlfxJkfRILE2IGR7sIFOyM',
  authDomain:        'vivia-499723.firebaseapp.com',
  projectId:         'vivia-499723',
  storageBucket:     'vivia-499723.firebasestorage.app',
  messagingSenderId: '289958893223',
  appId:             '1:289958893223:web:e8f1dd9fc29a2ab7a52d82',
});

const messaging = firebase.messaging();

// Maneja notificaciones cuando la app está en BACKGROUND o cerrada
messaging.onBackgroundMessage((payload) => {
  const { title = 'Nuevo reporte', body = '' } = payload.notification ?? {};

  self.registration.showNotification(title, {
    body,
    icon: '/logo.png',
    badge: '/favicon.ico',
    data: payload.data,
  });
});
