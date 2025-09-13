import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyBjIwORP-gV8B-D_qGgjiO7T6NFR-quJR4",
  authDomain: "ndaod-6622b.firebaseapp.com",
  projectId: "ndaod-6622b",
  storageBucket: "ndaod-6622b.firebasestorage.app",
  messagingSenderId: "249115218057",
  appId: "1:249115218057:web:68ef4baca2d451af9bf658"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };
