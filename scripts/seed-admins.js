/**
 * NXA Talent — Direct Admin Account Seeder (Zero Dependencies)
 * 
 * Uses Google API REST endpoints to authenticate with service account,
 * create/update users, assign custom claims, and save Firestore documents.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service account key
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'serviceAccountKey.json'), 'utf8')
);

const adminsToSeed = [
  {
    email: 'nxasupertalent@gmail.com',
    password: 'NXA1426',
    displayName: 'Super Admin',
    role: 'admin',
    roleType: 'super',
  },
  {
    email: 'nxamaxtalent@gmail.com',
    password: 'NXA1526',
    displayName: 'Max Admin',
    role: 'admin',
    roleType: 'max',
  },
  {
    email: 'nxacentertalent@gmail.com',
    password: 'NXA1626',
    displayName: 'Center Admin',
    role: 'admin',
    roleType: 'center',
  },
];

// Helper to make HTTPS requests
function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject({ status: res.statusCode, error: parsed.error || parsed });
          } else {
            resolve(parsed);
          }
        } catch (e) {
          if (res.statusCode >= 400) {
            reject({ status: res.statusCode, raw: data });
          } else {
            resolve(data);
          }
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

// Generate OAuth2 token using service account JWT signing
async function getAccessToken() {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp,
    iat
  };

  const base64Encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsignedToken = `${base64Encode(header)}.${base64Encode(payload)}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer.sign(serviceAccount.private_key, 'base64url');

  const jwt = `${unsignedToken}.${signature}`;

  const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;

  const res = await request({
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }, postData);

  return res.access_token;
}

// Create or update admin account
async function seedAdmin(token, adminDef) {
  const { email, password, displayName, role, roleType } = adminDef;
  const projId = serviceAccount.project_id;
  let uid = null;

  console.log(`Processing admin: ${email}...`);

  // 1. Try to create the user
  try {
    const createRes = await request({
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/projects/${projId}/accounts`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, {
      email,
      password,
      displayName,
      emailVerified: true
    });
    uid = createRes.localId;
    console.log(`✅ Created Auth User: ${email} (uid: ${uid})`);
  } catch (err) {
    const code = err.error?.message;
    if (code === 'EMAIL_EXISTS') {
      // 2. Fetch existing user UID if already exists and update password
      const lookupRes = await request({
        hostname: 'identitytoolkit.googleapis.com',
        path: `/v1/projects/${projId}/accounts:lookup`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }, {
        email: [email]
      });
      uid = lookupRes.users[0].localId;
      console.log(`ℹ️  Auth User already exists: ${email} (uid: ${uid}). Updating credentials...`);
      
      // Update existing user with the requested password
      await request({
        hostname: 'identitytoolkit.googleapis.com',
        path: `/v1/projects/${projId}/accounts:update`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }, {
        localId: uid,
        password
      });
      console.log(`✅ Reset password for ${email}`);
    } else {
      console.error(`❌ Failed to create/lookup user: ${email}`, err);
      return;
    }
  }

  // 3. Set custom user claims (role & roleType)
  await request({
    hostname: 'identitytoolkit.googleapis.com',
    path: `/v1/accounts:update`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, {
    localId: uid,
    customAttributes: JSON.stringify({ role, roleType })
  });
  console.log(`✅ Assigned custom claims: role=${role}, roleType=${roleType}`);

  // 4. Save admin directory doc in Firestore
  const docPath = `/v1/projects/${projId}/databases/(default)/documents/admins/${encodeURIComponent(email.toLowerCase())}`;
  await request({
    hostname: 'firestore.googleapis.com',
    path: docPath + '?updateMask.fieldPaths=email&updateMask.fieldPaths=name&updateMask.fieldPaths=role&updateMask.fieldPaths=roleType&updateMask.fieldPaths=created',
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, {
    fields: {
      email: { stringValue: email.toLowerCase() },
      name: { stringValue: displayName },
      role: { stringValue: role },
      roleType: { stringValue: roleType },
      created: { stringValue: new Date().toISOString() }
    }
  });
  console.log(`✅ Saved Firestore admin directory doc`);

  // 5. Save profile doc in Firestore for consistency
  const profileDocPath = `/v1/projects/${projId}/databases/(default)/documents/profiles/${encodeURIComponent(email.toLowerCase())}`;
  await request({
    hostname: 'firestore.googleapis.com',
    path: profileDocPath + '?updateMask.fieldPaths=email&updateMask.fieldPaths=fullname&updateMask.fieldPaths=role&updateMask.fieldPaths=roleType&updateMask.fieldPaths=created',
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, {
    fields: {
      email: { stringValue: email.toLowerCase() },
      fullname: { stringValue: displayName },
      role: { stringValue: role },
      roleType: { stringValue: roleType },
      created: { stringValue: new Date().toISOString() }
    }
  });
  console.log(`✅ Saved Firestore user profile doc`);
}

async function main() {
  console.log('\n🔧 NXA Talent — Admin Account Seeder (Direct REST API)\n');
  
  try {
    const token = await getAccessToken();
    console.log('🔑 Successfully authenticated with Google OAuth2 API.\n');
    
    for (const adminDef of adminsToSeed) {
      await seedAdmin(token, adminDef);
      console.log('');
    }
    
    console.log('🎉 Seeding successfully completed! Admins can now log in.\n');
  } catch (err) {
    console.error('Fatal error during execution:', err);
    process.exit(1);
  }
}

main();
