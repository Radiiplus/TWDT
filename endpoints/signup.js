const admin = require('firebase-admin');
const axios = require('axios');
const { addItem } = require('../module/supabase');
const { generateUUID, generate32BitToken } = require('../module/tGen.js');
const fs = require('fs').promises;
const path = require('path');

const DATA_FOLDER = path.join(__dirname, '..', 'data');
const KEYS_FILE = path.join(DATA_FOLDER, 'keys.json');

const FIREBASE_API_URL = `https://identitytoolkit.googleapis.com/v1`;

admin.apps.length || admin.initializeApp({ credential: admin.credential.applicationDefault() });

const getFirebaseApiKey = async () => (JSON.parse(await fs.readFile(KEYS_FILE, 'utf-8'))).FIREBASE_API_KEY;

const signupHandler = async (request, reply) => {
  try {
    const { username, email, password } = request.body;
    const FIREBASE_API_KEY = await getFirebaseApiKey();

    const { data: { idToken, localId, refreshToken } } = await axios.post(`${FIREBASE_API_URL}/accounts:signUp?key=${FIREBASE_API_KEY}`, { email, password, returnSecureToken: true });
    await axios.post(`${FIREBASE_API_URL}/accounts:sendOobCode?key=${FIREBASE_API_KEY}`, { requestType: "VERIFY_EMAIL", idToken });

    const userObj = {
      username: username.toLowerCase(),
      firebaseId: localId,
      refreshToken,
      email,
      uuid: generateUUID(),
      refCode: generate32BitToken(),  
      creationDate: new Date().toISOString(),
      verified: false
    };

    await addItem('users', userObj);

    return reply.send({ success: true, message: 'User created successfully. Verification email sent.', userId: localId, refCode: userObj.refCode });
  } catch (error) {
    console.error('Error during signup:', error.response?.data?.error?.message || error.message);
    return reply.status(400).send({ success: false, message: error.response?.data?.error?.message || error.message });
  }
};

module.exports = async (fastify, opts) => {
  console.log('Server started: /signup route registered.');  
  fastify.post('/signup', { config: { tag: 'signup' }, handler: signupHandler });
};
