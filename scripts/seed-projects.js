/**
 * NXA Talent — Project Matrix Seeder (Zero Dependencies)
 * 
 * Uses Google API REST endpoints to authenticate with service account
 * and seed realistic industrial project listings into the Firestore 'projects' collection.
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

const projectsToSeed = [
  {
    title: "Neural Traffic Flow Optimisation Engine",
    image: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=600&q=80",
    info: "An AI-driven real-time video telemetry analysis pipeline that optimizes city traffic grid timings based on edge camera density metrics.",
    source: "https://github.com/topics/traffic-control",
    dataset: "https://www.kaggle.com/datasets?search=traffic+sensor"
  },
  {
    title: "Predictive Smart Grid Asset Maintenance",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80",
    info: "High-throughput telemetry ingestion platform utilizing Random Forest modeling to predict substation transformer failures before critical load faults.",
    source: "https://github.com/topics/smart-grid",
    dataset: "https://www.kaggle.com/datasets?search=electrical+grid"
  },
  {
    title: "Supply Chain Logistics Route Optimizer",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
    info: "Genetic algorithm routing model executing dynamic VRP solving to optimize final-mile truck cargo drops under fluctuating highway transit conditions.",
    source: "https://github.com/topics/route-optimization",
    dataset: "https://www.kaggle.com/datasets?search=vehicle+routing"
  },
  {
    title: "Holographic Audio Waveform Enhancer",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
    info: "Deep learning convolution models to de-noise industrial microphone logs and reconstruct lost spatial sound vectors in high-decibel workspaces.",
    source: "https://github.com/topics/audio-denoising",
    dataset: "https://www.kaggle.com/datasets?search=industrial+noise"
  },
  {
    title: "Cyber-Threat Ingestion & Profiling Firewall",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
    info: "Real-time Netflow ingestion script extracting host attributes, packet size ratios, and clustering vectors to automatically detect zero-day root port sweeps.",
    source: "https://github.com/topics/intrusion-detection",
    dataset: "https://www.kaggle.com/datasets?search=network+security"
  }
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

// Seed a single project document
async function seedProject(token, proj) {
  const projId = serviceAccount.project_id;
  const docId = proj.title.toLowerCase().replace(/\s+/g, '_');
  const docPath = `/v1/projects/${projId}/databases/(default)/documents/projects/${encodeURIComponent(docId)}`;

  console.log(`Writing project: ${proj.title}...`);

  await request({
    hostname: 'firestore.googleapis.com',
    path: docPath + '?updateMask.fieldPaths=title&updateMask.fieldPaths=image&updateMask.fieldPaths=info&updateMask.fieldPaths=source&updateMask.fieldPaths=dataset',
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, {
    fields: {
      title: { stringValue: proj.title },
      image: { stringValue: proj.image },
      info: { stringValue: proj.info },
      source: { stringValue: proj.source },
      dataset: { stringValue: proj.dataset }
    }
  });

  console.log(`✅ Seeded project: ${proj.title}`);
}

async function main() {
  console.log('\n🔧 NXA Talent — Project Matrix Seeder\n');
  
  try {
    const token = await getAccessToken();
    console.log('🔑 Successfully authenticated with Google OAuth2 API.\n');
    
    for (const proj of projectsToSeed) {
      await seedProject(token, proj);
      console.log('');
    }
    
    console.log('🎉 Seeding successfully completed! Projects are now live in the matrix.\n');
  } catch (err) {
    console.error('Fatal error during execution:', err);
    process.exit(1);
  }
}

main();
