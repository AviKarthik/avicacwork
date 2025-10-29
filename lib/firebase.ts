// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { initializeFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBI_7WLt6KeMmeiJu0QLiN9bcN9Z7-g0Cs",
  authDomain: "avi-app1-avik.firebaseapp.com",
  projectId: "avi-app1-avik",
  storageBucket: "avi-app1-avik.firebasestorage.app",
  messagingSenderId: "117636907647",
  appId: "1:117636907647:web:579e341980dbc61bb8b54a",
  measurementId: "G-92Y3PSRL8P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  // useFetchStreams is missing from the public types but required for Expo/React Native
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  useFetchStreams: false,
});
export const storage = getStorage(app);

if (__DEV__) {
  setLogLevel('debug');
}
