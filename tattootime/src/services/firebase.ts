import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "tattootimev2.firebaseapp.com",
  projectId: "tattootimev2",
  storageBucket: "tattootimev2.appspot.com",
  messagingSenderId: "301515167164",
  appId: "1:301515167164:web:fbd3900f81edf208a607b9",
  measurementId: "G-Q8X9G8F08P"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Verbindung zum Emulator im Entwicklungsmodus
if (process.env.NODE_ENV === 'development') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
} 