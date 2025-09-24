// THIS FILE IS FOR THE SERVER-SIDE ONLY (API Routes)

import admin from 'firebase-admin';

// Check if the service account JSON is available
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error("The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.");
}

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf-8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };