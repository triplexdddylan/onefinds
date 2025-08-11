// lib/firebaseAdmin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

function loadServiceAccount() {
  // Local dev: read file. In production we’ll switch to an env var.
  const p = path.join(process.cwd(), 'serviceAccountKey.json');
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(loadServiceAccount()),
    });

export const adminAuth = getAuth(app);
