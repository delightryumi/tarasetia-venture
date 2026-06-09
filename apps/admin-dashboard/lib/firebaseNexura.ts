import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCae2H7cpNu5tDLOt8mdQPxAAqQXKVV3pY",
    authDomain: "nexura-web.firebaseapp.com",
    projectId: "nexura-web",
    storageBucket: "nexura-web.firebasestorage.app",
    messagingSenderId: "461096282379",
    appId: "1:461096282379:web:2fa651b1a81aea34941a0e",
    measurementId: "G-EJHX71MHX2"
};

const nexuraApp = getApps().find(app => app.name === "nexuraApp") 
    ? getApp("nexuraApp") 
    : initializeApp(firebaseConfig, "nexuraApp");

export const nexuraDb = getFirestore(nexuraApp);
