import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';

// Config pública de Firebase — los mismos valores que public/firebase-messaging-sw.js.
// Hardcodeada (igual que en el SW) para no depender de variables de entorno en el build.
const firebaseConfig = {
  apiKey:            'AIzaSyD27fH_gee-HOlfxJkfRILE2IGR7sIFOyM',
  authDomain:        'vivia-499723.firebaseapp.com',
  projectId:         'vivia-499723',
  storageBucket:     'vivia-499723.firebasestorage.app',
  messagingSenderId: '289958893223',
  appId:             '1:289958893223:web:e8f1dd9fc29a2ab7a52d82',
  measurementId:     'G-T2E68CW99C',
};

// Evita re-inicializar si ya existe una instancia (HMR en desarrollo)
export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
