import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC3GvwLDXv2UnjmCTBR2Ko-l2ngkf_qn6g",
  authDomain: "hack-5fca4.firebaseapp.com",
  projectId: "hack-5fca4",
  storageBucket: "hack-5fca4.firebasestorage.app",
  messagingSenderId: "85154076688",
  appId: "1:85154076688:web:9b792790b573bb7d345295",
  measurementId: "G-93MBH2773S"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
