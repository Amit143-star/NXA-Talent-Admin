const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function listCourses() {
  const snap = await db.collection('courses').get();
  console.log(`TOTAL COURSES IN DB: ${snap.size}`);
  snap.forEach(doc => {
    console.log(`ID: "${doc.id}", Title: "${doc.data().title}"`);
  });
}

listCourses().catch(console.error);
