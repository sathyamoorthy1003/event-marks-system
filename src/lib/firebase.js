import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

let firebaseConfig;
try {
  if (typeof __firebase_config !== "undefined") {
    firebaseConfig = JSON.parse(__firebase_config);
  } else {
    // Fallback for local dev environment - Replace with your keys
    firebaseConfig = {
      apiKey: "AIzaSyBSnLkIdiPYdkzEvtYAfjJ-dJFfwXPyf7w",
      authDomain: "event-mark.firebaseapp.com",
      projectId: "event-mark",
      storageBucket: "event-mark.firebasestorage.app",
      messagingSenderId: "859059423914",
      appId: "1:859059423914:web:82db36f82ab7e5acd8ded3",
      measurementId: "G-SL4FRYN3FQ",
    };
  }
} catch (error) {
  console.error("Firebase Config Error:", error);
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// CONSTANTS
export const MASTER_SYSTEM_ID = "sys_master_v1";
export const DEFAULT_APP_ID = "demo_event_v1";
export const GLOBAL_ROOT_ID =
  typeof __app_id !== "undefined" ? __app_id : "event_marks_saas_v1";

// Helper to generate consistent collection paths
export const getCollectionRef = (tenantId, collectionName) => {
  const safeTenant = tenantId || DEFAULT_APP_ID;
  const finalName = `${safeTenant}_${collectionName}`;
  return collection(
    db,
    "artifacts",
    GLOBAL_ROOT_ID,
    "public",
    "data",
    finalName
  );
};

export const getDocRef = (tenantId, collectionName, docId) => {
  const safeTenant = tenantId || DEFAULT_APP_ID;
  const finalName = `${safeTenant}_${collectionName}`;
  return doc(
    db,
    "artifacts",
    GLOBAL_ROOT_ID,
    "public",
    "data",
    finalName,
    docId
  );
};

// Helper for safe date formatting
export const formatDate = (timestamp) => {
  if (!timestamp) return "-";
  try {
    if (typeof timestamp.toDate === "function")
      return timestamp.toDate().toLocaleString();
    if (timestamp.seconds)
      return new Date(timestamp.seconds * 1000).toLocaleString();
    if (timestamp instanceof Date) return timestamp.toLocaleString();
  } catch (e) {
    return "";
  }
  if (typeof timestamp === "object") return "";
  return String(timestamp);
};
