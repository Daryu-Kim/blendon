import { existsSync, readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import type { Role } from "../types/domain";

const loadEnvFile = (path: string) => {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!key || process.env[key]) continue;
    const rawValue = rest.join("=");
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
};

loadEnvFile(".env");
loadEnvFile(".env.local");

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const email = process.env.ADMIN_EMAIL || process.env.ADMIN_INITIAL_EMAIL;
const role = (process.env.ADMIN_ROLE || "owner") as Role;
const allowedRoles: Role[] = ["manager", "admin", "owner"];

if (!serviceAccountJson) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is required.");
}

if (!email) {
  throw new Error("ADMIN_EMAIL or ADMIN_INITIAL_EMAIL is required.");
}

if (!allowedRoles.includes(role)) {
  throw new Error("ADMIN_ROLE must be one of manager, admin, owner.");
}

initializeApp({
  credential: cert(JSON.parse(serviceAccountJson)),
});

const auth = getAuth();
const db = getFirestore();
const user = await auth.getUserByEmail(email);

await auth.setCustomUserClaims(user.uid, { role });
await db
  .collection("users")
  .doc(user.uid)
  .set(
    {
      uid: user.uid,
      email: user.email || email,
      role,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

console.log(`Set ${role} claim for ${email} (${user.uid}).`);
