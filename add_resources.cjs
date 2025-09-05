const { createCommunityResource } = require("./src/services/resourceService");
const { initializeApp } = require("firebase/app");

// Your Firebase configuration (same as in src/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyC7svdTB9k-qIyS78sdvmUXOBLFTM8AJHE",
  authDomain: "right-quiz.firebaseapp.com",
  databaseURL: "https://right-quiz-default-rtdb.firebaseio.com",
  projectId: "right-quiz",
  storageBucket: "right-quiz.appspot.com",
  messagingSenderId: "219119155760",
  appId: "1:219119155760:web:67ff12f439c0eb959f0bf5",
  measurementId: "G-LP4V87RQGG"
};

// Initialize Firebase app (needed for resourceService to work)
const app = initializeApp(firebaseConfig);

const addYoutubeResources = async () => {
  const resourcesToAdd = [
    {
      url: "https://youtu.be/-h1T1kWPtjY",
      title: "YouTube Video 1: Short Clip",
      description: "A short YouTube video resource.",
      thumbnail: "https://img.youtube.com/vi/-h1T1kWPtjY/hqdefault.jpg", // Default YouTube thumbnail
    },
    {
      url: "https://youtu.be/aocuD-n9SoM",
      title: "YouTube Video 2: Another Clip",
      description: "Another YouTube video resource.",
      thumbnail: "https://img.youtube.com/vi/aocuD-n9SoM/hqdefault.jpg", // Default YouTube thumbnail
    },
  ];

  const userId = "admin-user-id"; // Placeholder user ID
  const userDisplayName = "Admin";
  const userPhotoURL = ""; // Placeholder or empty

  for (const res of resourcesToAdd) {
    try {
      const resourceId = await createCommunityResource({
        userId: userId,
        userDisplayName: userDisplayName,
        userPhotoURL: userPhotoURL,
        title: res.title,
        description: res.description,
        resourceType: 'youtube',
        resourceURL: res.url,
        resourceMetadata: {
          title: res.title,
          thumbnail: res.thumbnail,
          duration: 0,
          viewCount: 0,
          uploadDate: new Date(),
          summary: res.description,
        },
        tags: ["youtube", "video", "educational"],
        category: "Educational", // Default category
        rating: 0, // Default rating
        difficulty: 'beginner', // Default difficulty
      });
      console.log(`Successfully added YouTube resource: ${res.title} with ID: ${resourceId}`);
    } catch (error) {
      console.error(`Failed to add YouTube resource ${res.title}:`, error);
    }
  }
};

addYoutubeResources().catch(console.error);
