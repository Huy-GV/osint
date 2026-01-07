import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp({
      projectId: "osint-challenge-10e24",
      appId: "1:487086894126:web:ecce9f99da71f761ce03bf",
      storageBucket: "osint-challenge-10e24.firebasestorage.app",
      apiKey: "AIzaSyDViEzt5o4VyXcGezApwHcvqlrEDuOqqsk",
      authDomain: "osint-challenge-10e24.firebaseapp.com",
      messagingSenderId: "487086894126",
      // projectNumber: "487086894126",
      // version: "2"
    })),
    provideFirestore(() => getFirestore())
  ]
};
