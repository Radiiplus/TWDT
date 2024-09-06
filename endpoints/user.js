const axios = require('axios');
const fs = require('fs').promises;
const { getItem } = require('../module/supabase');
const path = require('path');

const DATA_FOLDER = path.join(__dirname, '..', 'data');
const AUTH_FILE = path.join(DATA_FOLDER, 'auth.jsonl');
const KEYS_FILE = path.join(DATA_FOLDER, 'keys.json');

const getFirebaseApiKey = async () => (JSON.parse(await fs.readFile(KEYS_FILE, 'utf-8'))).FIREBASE_API_KEY;

const validateAuthToken = async authToken => {
  try {
    const authDataArray = (await fs.readFile(AUTH_FILE, 'utf-8')).trim().split('\n').map(JSON.parse);
    const tokenData = authDataArray.find(data => data.authToken === authToken);
    if (!tokenData) return { valid: false };

    const FIREBASE_API_URL = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${await getFirebaseApiKey()}`;
    const { data: { users } } = await axios.post(FIREBASE_API_URL, { idToken: tokenData.idToken });

    return users[0] ? { valid: true, uuid: tokenData.uuid } : { valid: false };
  } catch (error) {
    console.error('Error validating token:', error.response?.data || error.message);
    return { valid: false };
  }
};

const getUserInfoHandler = async (request, reply) => {
  try {
    const authToken = request.cookies.authToken;
    if (!authToken) return reply.status(401).send({ success: false, message: 'Auth token is missing' });

    const validationResult = await validateAuthToken(authToken);
    if (!validationResult.valid) return reply.status(401).send({ success: false, message: 'Invalid auth token' });

    let userData = await getItem('users', 'uuid', validationResult.uuid);

    if (userData) {
      const { creationDate, firebaseId, refreshToken, id, ...filteredUserData } = userData;
      return reply.send({ success: true, user: filteredUserData });
    }

    return reply.status(404).send({ success: false, message: 'User not found' });
  } catch (error) {
    console.error('Error getting user info:', error.response?.data || error.message);
    return reply.status(500).send({ success: false, message: 'Internal server error' });
  }
};

module.exports = async (fastify, opts) => {
  console.log('Server started: /user route registered.'); 
  fastify.get('/user', { config: { tag: 'user' }, handler: getUserInfoHandler });
};
