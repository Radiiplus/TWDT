const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { getItem, updateItem } = require('../module/supabase');
const { generate128BitToken } = require('../module/tGen.js');

const DATA_FOLDER = path.join(__dirname, '..', 'data');
const AUTH_FILE = path.join(DATA_FOLDER, 'auth.jsonl');
const KEYS_FILE = path.join(DATA_FOLDER, 'keys.json');

let FIREBASE_API_KEY;

const loadFirebaseKey = async () => {
  if (!FIREBASE_API_KEY) {
    const keys = JSON.parse(await fs.readFile(KEYS_FILE, 'utf-8'));
    FIREBASE_API_KEY = keys.FIREBASE_API_KEY;
  }
  return FIREBASE_API_KEY;
};

const firebaseApi = axios.create({
  baseURL: 'https://identitytoolkit.googleapis.com/v1',
  params: async () => {
    const key = await loadFirebaseKey();
    return { key };
  }
});

const ensureDataFolderExists = async () => {
  try {
    await fs.mkdir(DATA_FOLDER, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
};

const loginHandler = async (request, reply) => {
  const { usernameOrEmail, password } = request.body;
  try {
    if (!usernameOrEmail || !password) throw new Error('Invalid input');

    const userData = await getUserData(usernameOrEmail);
    if (!userData) throw new Error('User not found');

    const { idToken, localId, expiresIn } = await signInWithFirebase(userData.email, password);
    const isVerified = await verifyIdToken(idToken);
    if (!isVerified) return reply.send({ success: false, message: 'Email not verified', verified: false });

    if (!userData.verified) {
      await updateItem('users', { firebaseId: localId }, { verified: true });
    }

    const authToken = await createAndSaveAuthToken(userData, idToken, expiresIn);
    setAuthCookie(reply, authToken, expiresIn);

    reply.send({ success: true, message: 'Login successful', verified: true });
  } catch (error) {
    handleError(reply, error);
  }
};

const getUserData = async (usernameOrEmail) => {
  const field = usernameOrEmail.includes('@') ? 'email' : 'username';
  return await getItem('users', field, field === 'username' ? usernameOrEmail.toLowerCase() : usernameOrEmail);
};

const signInWithFirebase = async (email, password) => {
  try {
    const apiKey = await loadFirebaseKey();
    const { data } = await firebaseApi.post('/accounts:signInWithPassword', 
      { email, password, returnSecureToken: true },
      { params: { key: apiKey } }
    );
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Firebase authentication failed');
  }
};

const verifyIdToken = async (idToken) => {
  const decodedToken = jwt.decode(idToken, { complete: true });
  return decodedToken?.payload?.email_verified || false;
};

const createAndSaveAuthToken = async (userData, idToken, expiresIn) => {
  const authToken = generate128BitToken();
  const uuid = (await getItem('users', 'email', userData.email)).uuid;
  const authData = { uuid, username: userData.username, expiresIn: parseInt(expiresIn), idToken, authToken, createdAt: Date.now() };

  await ensureDataFolderExists();
  await overwriteAuthToken(uuid, authData);
  return authToken;
};

const overwriteAuthToken = async (uuid, authData) => {
  let authDataArray = [];
  try {
    const authDataLines = await fs.readFile(AUTH_FILE, 'utf-8');
    authDataArray = authDataLines.trim().split('\n').map(line => JSON.parse(line));
  } catch (err) {
  }

  const updatedAuthData = authDataArray.filter(data => data.uuid !== uuid);
  updatedAuthData.push(authData);
  await fs.writeFile(AUTH_FILE, updatedAuthData.map(data => JSON.stringify(data)).join('\n') + '\n');
};

const setAuthCookie = (reply, authToken, expiresIn) => {
  reply.setCookie('authToken', authToken, {
    httpOnly: true,
    maxAge: parseInt(expiresIn),
    path: '/',
    sameSite: 'strict'
  });
};

const handleError = (reply, error) => {
  reply.status(400).send({ success: false, message: error.message || 'An unexpected error occurred' });
};

module.exports = async (fastify) => {
  fastify.post('/login', { config: { tag: 'login' }, handler: loginHandler });
  console.log('Server started: /login route registered.');
};
