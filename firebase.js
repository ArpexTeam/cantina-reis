// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBF_3hiDaZlQe7E2hzdz-6CoUqBXhTUBWA",
  authDomain: "toricelli-a9f8f.firebaseapp.com",
  projectId: "toricelli-a9f8f",
  storageBucket: "toricelli-a9f8f.firebasestorage.app",
  messagingSenderId: "741906615573",
  appId: "1:741906615573:web:7991333505043b1b62ed1c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };