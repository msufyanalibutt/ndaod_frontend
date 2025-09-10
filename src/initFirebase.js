import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
const firebaseConfig = {
  apiKey: "AIzaSyDszT-kGAoPGM_5cjO9uNxSnagjYe5IDlk",
  authDomain: "ndaod-16ded.firebaseapp.com",
  projectId: "ndaod-16ded",
  storageBucket: "ndaod-16ded.firebasestorage.app",
  messagingSenderId: "308189491879",
  appId: "1:308189491879:web:0b170ff3c25ab718206182"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db }