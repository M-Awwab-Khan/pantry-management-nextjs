// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCJr9Ys8W1WIIoZUwNaM6a9x94aCTQvD_o",
  authDomain: "pantry-management-d1b42.firebaseapp.com",
  projectId: "pantry-management-d1b42",
  storageBucket: "pantry-management-d1b42.appspot.com",
  messagingSenderId: "671058353107",
  appId: "1:671058353107:web:ec5706c9c6b612f7202d26",
  measurementId: "G-Q1DHG5LZLT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }