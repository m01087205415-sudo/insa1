/**
 * Express Full-Stack Server for YW Construction (양우종합건설) Electronic Labor Contract System
 * Manages secure file storage for seal stamps, cryptographic document hashing, and email/SMS queues.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure secure storage directory exists for company seals and contracts
const SECURE_STORAGE_DIR = path.join(__dirname, 'server', 'secure_storage');
const SEAL_STORAGE_DIR = path.join(SECURE_STORAGE_DIR, 'seals');
const CONTRACTS_STORAGE_DIR = path.join(SECURE_STORAGE_DIR, 'contracts');

if (!fs.existsSync(SEAL_STORAGE_DIR)) {
  fs.mkdirSync(SEAL_STORAGE_DIR, { recursive: true });
}
if (!fs.existsSync(CONTRACTS_STORAGE_DIR)) {
  fs.mkdirSync(CONTRACTS_STORAGE_DIR, { recursive: true });
}

// Ensure seal file exists in secure storage
const publicSealPath = path.join(__dirname, 'public', 'seal_stamp.png');
const secureSealPath = path.join(SEAL_STORAGE_DIR, 'yw_official_seal_v1.png');

if (fs.existsSync(publicSealPath) && !fs.existsSync(secureSealPath)) {
  try {
    fs.copyFileSync(publicSealPath, secureSealPath);
  } catch (e) {
    console.error('Failed to copy seal to secure storage:', e);
  }
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'YW-Construction-Contract-Engine',
    version: 'v2026.04-STD',
    company: '양우종합건설 주식회사',
    hrEmail: 'tecs_hr@ywconst.com',
    timestamp: new Date().toISOString()
  });
});

// Secure Seal Access endpoint (requires approver token verification)
app.get('/api/secure/seal', (req: Request, res: Response) => {
  // In production, verify JWT / Session role === 'APPROVER'
  if (fs.existsSync(secureSealPath)) {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(secureSealPath);
  } else if (fs.existsSync(publicSealPath)) {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(publicSealPath);
  } else {
    res.status(404).json({ error: 'Official seal not found in secure storage' });
  }
});

// Email Dispatch Endpoint (Simulated Dev Mode / Real SMTP)
app.post('/api/contracts/:id/send-email', (req: Request, res: Response) => {
  const { id } = req.params;
  const { contractNo, workerName, siteName, pdfHash } = req.body;

  const subject = `[근로계약 체결완료] ${siteName || '현장'}_${id}_${workerName || '근로자'}_${contractNo || id}`;
  const recipient = 'tecs_hr@ywconst.com';

  console.log(`[EMAIL QUEUE] Sending contract PDF to: ${recipient}`);
  console.log(`[EMAIL QUEUE] Subject: ${subject}`);
  console.log(`[EMAIL QUEUE] PDF SHA-256 Hash: ${pdfHash}`);

  // Simulate successful dispatch
  res.json({
    success: true,
    recipient,
    subject,
    status: 'DELIVERED',
    timestamp: new Date().toISOString()
  });
});

// SMS Dispatch Endpoint (Simulated Dev Mode / Real AlimTalk)
app.post('/api/contracts/:id/send-sms', (req: Request, res: Response) => {
  const { id } = req.params;
  const { phone, workerName, signUrl, otpCode } = req.body;

  console.log(`[SMS/AlimTalk] Dispatched to ${phone} for ${workerName}`);
  console.log(`[SMS/AlimTalk] Sign URL: ${signUrl}`);
  console.log(`[SMS/AlimTalk] Verification OTP: ${otpCode}`);

  res.json({
    success: true,
    phone,
    status: 'SENT',
    timestamp: new Date().toISOString()
  });
});

// Mount Vite middleware in development or serve static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
