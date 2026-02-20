// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCfx1bb8Sz5bRZ34CfTVzDdfelcWTdMpWs",
    authDomain: "scrobblediscogs.firebaseapp.com",
    projectId: "scrobblediscogs",
    storageBucket: "scrobblediscogs.firebasestorage.app",
    messagingSenderId: "769397701039",
    appId: "1:769397701039:web:cb4e589027c00175ed975a",
    measurementId: "G-68SJTV05KJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);