// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsYi--ojLnU_eAEXL2XRlznMYddzaaDWs",
  authDomain: "cantina-reis.firebaseapp.com",
  projectId: "cantina-reis",
  storageBucket: "cantina-reis.firebasestorage.app",
  messagingSenderId: "255895939750",
  appId: "1:255895939750:web:207a871c2983f2bc742267"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };