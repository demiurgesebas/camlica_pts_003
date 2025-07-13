import * as admin from "firebase-admin";
// Service account dosyasını require ile import et
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require("../serviceAccountKey.json");

// Firebase Admin SDK'yı elle başlat
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Gerekirse projectId: "camlica-pts-001" eklenebilir
  });
}

const db = admin.firestore();

// Firestore koleksiyonları için referanslar
export const collections = {
  personnel: db.collection("personnel"),
  branches: db.collection("branches"),
  departments: db.collection("departments"),
  shifts: db.collection("shifts"),
  shiftAssignments: db.collection("shiftAssignments"),
  attendanceRecords: db.collection("attendanceRecords"),
  leaveRequests: db.collection("leaveRequests"),
  qrCodes: db.collection("qrCodes"),
  notifications: db.collection("notifications"),
  tasks: db.collection("tasks"),
  teams: db.collection("teams"),
};

// Firebase Storage
export const storage = admin.storage();

// Firebase Auth
export const auth = admin.auth();

export { db };