import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCYkG48yEdSGJM4hmybCcOlN7mJH2qXGUQ",
    authDomain: "inventarioalimentos-5d797.firebaseapp.com",
    projectId: "inventarioalimentos-5d797",
    storageBucket: "inventarioalimentos-5d797.appspot.com",
    messagingSenderId: "719490768450",
    appId: "1:719490768450:android:7786dcfa0629019f9ed7db"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
