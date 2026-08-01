import { initializeApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, signInWithRedirect, signInWithPopup,
  getRedirectResult, onAuthStateChanged, signOut, browserLocalPersistence, setPersistence,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

/* ============================================================
   Cloud sync — Firebase Auth (Google) + Firestore.
   Config comes from .env (VITE_FIREBASE_*), see .env.example.
   If those vars are missing, firebaseReady is false and the app
   falls back to local-only mode instead of crashing.
   ============================================================ */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseReady = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null, auth = null, db = null, googleProvider = null;

if (firebaseReady) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(() => {});
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
}

export { auth, db };

/* Standalone home-screen apps (iOS "Add to Home Screen") can't reliably open
   popups, so redirect there; a regular browser tab is fine with a popup. */
const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.navigator.standalone || window.matchMedia?.("(display-mode: standalone)").matches);

export function signInWithGoogle() {
  if (!auth) return Promise.reject(new Error("Firebase not configured"));
  return isStandalone() ? signInWithRedirect(auth, googleProvider) : signInWithPopup(auth, googleProvider);
}

export function consumeRedirectResult() {
  if (!auth) return Promise.resolve(null);
  return getRedirectResult(auth).catch(() => null);
}

export function watchAuth(cb) {
  if (!auth) { cb(null); return () => {}; }
  return onAuthStateChanged(auth, cb);
}

export function signOutUser() {
  if (!auth) return Promise.resolve();
  return signOut(auth);
}

export async function fetchCloudSave(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export function watchCloudSave(uid, cb) {
  return onSnapshot(doc(db, "users", uid), (snap) => { if (snap.exists()) cb(snap.data()); }, () => {});
}

export async function writeCloudSave(uid, payload) {
  await setDoc(doc(db, "users", uid), payload, { merge: false });
}
