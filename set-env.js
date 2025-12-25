const fs = require('fs');
const dotenv = require('dotenv');

// Load env vars from .env
dotenv.config();

// Helper to get value
const getVal = (key) => process.env[key] || '';

// Template for environment.ts (Development)
const envConfigDev = `export const environment = {
  production: false,
  firebase: {
    apiKey: '${getVal('FIREBASE_API_KEY')}',
    authDomain: '${getVal('FIREBASE_AUTH_DOMAIN')}',
    projectId: '${getVal('FIREBASE_PROJECT_ID')}',
    storageBucket: '${getVal('FIREBASE_STORAGE_BUCKET')}',
    messagingSenderId: '${getVal('FIREBASE_MESSAGING_SENDER_ID')}',
    appId: '${getVal('FIREBASE_APP_ID')}',
    measurementId: '${getVal('FIREBASE_MEASUREMENT_ID')}',
  },
  apiUrl: '${getVal('API_URL')}', /* Uses API_URL */
  auth: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    tokenExpiryKey: 'token_expiry'
  }
};
`;

// Template for environment.prod.ts (Production)
const envConfigProd = `export const environment = {
  production: true,
  firebase: {
    apiKey: '${getVal('FIREBASE_API_KEY')}',
    authDomain: '${getVal('FIREBASE_AUTH_DOMAIN')}',
    projectId: '${getVal('FIREBASE_PROJECT_ID')}',
    storageBucket: '${getVal('FIREBASE_STORAGE_BUCKET')}',
    messagingSenderId: '${getVal('FIREBASE_MESSAGING_SENDER_ID')}',
    appId: '${getVal('FIREBASE_APP_ID')}',
    measurementId: '${getVal('FIREBASE_MEASUREMENT_ID')}',
  },
  apiUrl: '${getVal('API_URL_PROD')}', /* Uses API_URL_PROD */
  auth: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    tokenExpiryKey: 'token_expiry'
  }
};
`;

// Ensure directory exists
const dir = './src/environments';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// Write environment.ts
fs.writeFile('./src/environments/environment.ts', envConfigDev, (err) => {
    if (err) {
        console.error(err);
        throw err;
    }
    console.log('environment.ts generated successfully (using API_URL)');
});

// Write environment.prod.ts
fs.writeFile('./src/environments/environment.prod.ts', envConfigProd, (err) => {
    if (err) {
        console.error(err);
        throw err;
    }
    console.log('environment.prod.ts generated successfully (using API_URL_PROD)');
});
