// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Firebase Storage

console.log('Firebase app initialized:', app);
console.log('Firestore db initialized:', db);

export { db, app, storage };