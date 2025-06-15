import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyARdKxJLMJvFsFOSeoAUiXspL4P1PI",
  authDomain: "tattootimev2.firebaseapp.com",
  projectId: "tattootimev2",
  storageBucket: "tattootimev2.firebasestorage.app",
  messagingSenderId: "301515167164",
  appId: "1:301515167164:web:fB3900F81f200d87b9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 