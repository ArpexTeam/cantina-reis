// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCsYi--ojLnU_eAEXL2XRlznMYddzaaDWs",
  authDomain: "cantina-reis.firebaseapp.com",
  projectId: "cantina-reis",
  storageBucket: "cantina-reis.firebasestorage.app",
  messagingSenderId: "255895939750",
  appId: "1:255895939750:web:207a871c2983f2bc742267"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
