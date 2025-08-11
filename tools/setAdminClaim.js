// tools/setAdminClaim.js
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(process.cwd(), 'serviceAccountKey.json'));

if (!process.argv[2]) {
  console.error('Usage: node tools/setAdminClaim.js email@example.com');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

(async () => {
  const email = process.argv[2];
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  const fresh = await admin.auth().getUser(user.uid);
  console.log('Custom claims now:', fresh.customClaims);
  console.log('Done. Sign out and sign back in for the claim to appear in your ID token.');
  process.exit(0);
})();
