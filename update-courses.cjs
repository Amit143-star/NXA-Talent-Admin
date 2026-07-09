const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize the app with a service account
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const YT_IDS = [
  'jNQXAC9IVRw', 'M7lc1UVf-VE', 'C0DPdy98e4c', 'tgbNymZ7vqY', 
  'kJQP7kiw5Fk', 'JGwWNGJdvx8', '9bZkp7q19f0', 'L_jWHffIx5E', 
  'V-_O7nl0Ii0', 'RgKAFK5djSk', '2b1UKTgZA_U', 'B51bL3mNux0',
  'YQHsXMglC9A', 'F1Hq8eVOMHs', 'PkZNo7MFEPs', '8aGhPhVnOOM'
];

const LESSON_TOPICS = [
  "Core Architecture", "Deep Dive Integration", "System Optimization",
  "Error Handling Strategies", "Production Deployment", "Advanced Routing",
  "State Management", "Performance Tuning", "Security Best Practices",
  "Database Schema Design", "Microservices Breakdown", "Authentication Flow"
];

const generateLessons = (count) => {
  const lessons = [];
  for (let i = 1; i <= count; i++) {
    const topic = LESSON_TOPICS[randomInt(0, LESSON_TOPICS.length - 1)];
    lessons.push({
      title: `Lesson ${i}: ${topic}`,
      ytId: YT_IDS[randomInt(0, YT_IDS.length - 1)],
      duration: `${randomInt(5, 25)} mins`
    });
  }
  return lessons;
};

async function updateAllCourses() {
  console.log("Fetching all courses...");
  const snapshot = await db.collection('courses').get();
  
  if (snapshot.empty) {
    console.log("No courses found.");
    return;
  }

  console.log(`Found ${snapshot.size} courses. Updating them for nested syllabus...`);
  const batch = db.batch();
  let updatedCount = 0;

  snapshot.forEach(doc => {
    const courseRef = db.collection('courses').doc(doc.id);
    const data = doc.data();

    const newModulesCount = randomInt(8, 15);
    const newTestsCount = randomInt(3, 8);
    const flatVideos = generateLessons(randomInt(15, 25)); // Keep a flat array for the VIDEOS tab backwards compatibility

    // Generate nested interactive syllabus
    const newSyllabus = [];
    for (let i = 1; i <= newModulesCount; i++) {
      // Each module gets 2-4 lessons
      newSyllabus.push({
        title: `Module ${i}: ${data.title} Phase ${i}`,
        lessons: generateLessons(randomInt(2, 4))
      });
    }

    const newTestList = Array.from({ length: newTestsCount }, (_, i) => ({ 
      title: `Assessment ${i + 1}: Practical Integration`, 
      duration: `${randomInt(15, 60)} mins` 
    }));

    batch.update(courseRef, {
      modules: newModulesCount,
      tests: newTestsCount,
      videos: flatVideos,
      syllabus: newSyllabus,
      testList: newTestList
    });

    updatedCount++;
    console.log(`Prepared update for ${data.title}`);
  });

  await batch.commit();
  console.log(`Successfully updated ${updatedCount} courses!`);
}

updateAllCourses().catch(console.error);
