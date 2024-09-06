const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const DATA_FOLDER = path.join(__dirname, '..', 'data');
const AUTH_FILE = path.join(DATA_FOLDER, 'auth.jsonl');
const KEYS_FILE = path.join(DATA_FOLDER, 'keys.json');

const getFirebaseApiKey = async () => (JSON.parse(await fs.readFile(KEYS_FILE, 'utf-8'))).FIREBASE_API_KEY;

const validateHandler = async (request, reply) => {
  try {
    const authToken = request.cookies.authToken;
    if (!authToken) return reply.status(401).send({ success: false, message: 'Auth token is missing' });

    const authDataArray = (await fs.readFile(AUTH_FILE, 'utf-8')).trim().split('\n').map(JSON.parse);
    const tokenData = authDataArray.find(data => data.authToken === authToken);
    if (!tokenData) return reply.status(401).send({ success: false, message: 'Invalid auth token' });

    const FIREBASE_API_KEY = await getFirebaseApiKey();
    const FIREBASE_API_URL = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`;
    const { data: { users } } = await axios.post(FIREBASE_API_URL, { idToken: tokenData.idToken }, { headers: { 'Content-Type': 'application/json' } });

    if (!users[0]) return reply.status(401).send({ success: false, message: 'Invalid auth token' });

    return reply.send({ success: true, message: 'Token is valid'});
  } catch (error) {
    console.error('Error validating token:', error.response ? error.response.data : error.message);
    return reply.status(500).send({ success: false, message: 'Internal server error' });
  }
};

module.exports = async (fastify, opts) => {
  console.log('Server started: /validate route registered.'); 
  fastify.get('/validate', { config: { tag: 'validate' }, handler: validateHandler });
};
