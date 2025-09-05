import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Firebase Storage

export { db, app, storage };
