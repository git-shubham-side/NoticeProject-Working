import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { readEnv } from '../env';

const firebaseConfig = {
  apiKey: readEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: readEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
};

export function isFirebaseClientConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

export function getFirebaseClientApp() {
  if (!isFirebaseClientConfigured()) {
    return null;
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseClientDb() {
  const app = getFirebaseClientApp();
  return app ? getFirestore(app) : null;
}
