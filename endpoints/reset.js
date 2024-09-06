const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const DATA_FOLDER = path.join(__dirname, '..', 'data');
const KEYS_FILE = path.join(DATA_FOLDER, 'keys.json');
const FIREBASE_API_URL = 'https://identitytoolkit.googleapis.com/v1';

// Global variables
let FIREBASE_API_KEY;

// Load Firebase API Key
const loadFirebaseKey = async () => {
  if (!FIREBASE_API_KEY) {
    const keys = JSON.parse(await fs.readFile(KEYS_FILE, 'utf-8'));
    FIREBASE_API_KEY = keys.FIREBASE_API_KEY;
  }
  return FIREBASE_API_KEY;
};

// Create Axios instance for Firebase API
const firebaseApi = axios.create({
  baseURL: FIREBASE_API_URL,
  params: async () => {
    const key = await loadFirebaseKey();
    return { key };
  }
});

// Handler to send password reset email
const resetPasswordHandler = async (request, reply) => {
  const { email } = request.body;
  try {
    if (!email) throw new Error('Email is required');

    const apiKey = await loadFirebaseKey();
    const resetPasswordUrl = 'http://localhost:3000/resetpass'; // Localhost URL

    await firebaseApi.post('/accounts:sendOobCode', 
      { 
        email, 
        requestType: 'PASSWORD_RESET',
        continueUrl: resetPasswordUrl 
      },
      { params: { key: apiKey } }
    );

    reply.send({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    reply.status(400).send({ success: false, message: error.message || 'An unexpected error occurred' });
  }
};

// Handler to confirm password reset
const confirmResetPasswordHandler = async (request, reply) => {
  const { oobCode, newPassword } = request.body;
  try {
    if (!oobCode || !newPassword) throw new Error('Invalid input');

    const apiKey = await loadFirebaseKey();

    await firebaseApi.post('/accounts:resetPassword', 
      { oobCode, newPassword },
      { params: { key: apiKey } }
    );

    reply.send({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    reply.status(400).send({ success: false, message: error.message || 'An unexpected error occurred' });
  }
};

// Register routes with Fastify
module.exports = async (fastify) => {
  fastify.post('/reset-password', { config: { tag: 'reset-password' }, handler: resetPasswordHandler });
  fastify.post('/confirm-reset-password', { config: { tag: 'confirm-reset-password' }, handler: confirmResetPasswordHandler });

  console.log('Server started: /reset-password and /confirm-reset-password routes registered.');
};
