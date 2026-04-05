import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readEnv } from '../env';

function getFirebaseAdminConfig() {
  const projectId = readEnv('FIREBASE_PROJECT_ID') || readEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  const clientEmail = readEnv('FIREBASE_CLIENT_EMAIL');
  const privateKey = readEnv('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return {
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    };
  }

  if (projectId) {
    return {
      credential: applicationDefault(),
      projectId,
    };
  }

  return null;
}

export function isFirebaseAdminConfigured() {
  return Boolean(getFirebaseAdminConfig());
}

export function getFirebaseAdminApp() {
  const config = getFirebaseAdminConfig();
  if (!config) {
    return null;
  }

  return getApps().length ? getApps()[0] : initializeApp(config);
}

export function getFirebaseAdminDb() {
  const app = getFirebaseAdminApp();
  return app ? getFirestore(app) : null;
}
