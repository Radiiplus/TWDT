const admin = require('firebase-admin');
const axios = require('axios');
const { addItem, getItem } = require('../module/supabase');
const { generateUUID, generate32BitToken } = require('../module/tGen.js');
const fs = require('fs').promises;
const path = require('path');
const edc = require('email-domain-check');
const { verifyEmail } = require('@ph7/real-email-validation');
const utf8 = require('utf8');

const DATA_FOLDER = path.join(__dirname, '..', 'data');
const KEYS_FILE = path.join(DATA_FOLDER, 'keys.json');
const FIREBASE_API_URL = `https://identitytoolkit.googleapis.com/v1`;

admin.apps.length || admin.initializeApp({ credential: admin.credential.applicationDefault() });

const getFirebaseApiKey = async () => (JSON.parse(await fs.readFile(KEYS_FILE, 'utf-8'))).FIREBASE_API_KEY;

const hasWhitespace = (input) => /\s/.test(input);

const isValidUsername = (username) => /^[a-zA-Z0-9]+$/.test(username);

function areEmailsSimilar(email1, email2) {
  const [username1, domain1] = email1.toLowerCase().split('@');
  const [username2, domain2] = email2.toLowerCase().split('@');

  if (domain1 === domain2 || levenshteinDistance(domain1, domain2) <= 2) {
    return username1 === username2 || levenshteinDistance(username1, username2) <= 2;
  }
  return false;
}

function levenshteinDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return costs[s2.length];
}

const isValidUTF8 = (str) => {
  try {
    utf8.decode(str);
    return true;
  } catch (error) {
    return false;
  }
};

const validateEmail = async (email) => {
  try {
    const isDomainValid = await edc(email);
    if (!isDomainValid) {
      return { valid: false, reason: 'Invalid email domain' };
    }

    const [, domain] = email.split('@');
    if (/\d/.test(domain)) {
      return { valid: false, reason: 'Domain contains invalid chars' };
    }

    const { validFormat, validMx, validSmtp } = await verifyEmail({
      emailAddress: email,
      verifyMx: true,
      verifySmtp: true,
      timeout: 3000
    });

    if (!validFormat || !validMx || validSmtp === false) {
      return {
        valid: false,
        reason: validSmtp === false ? 'SMTP check failed' : 'Invalid email format or MX records'
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error during email validation:', error);
    return { valid: false, reason: 'An unexpected error occurred during email validation' };
  }
};

const signupHandler = async (request, reply) => {
  try {
    const { username, email, password } = request.body;

    if (!isValidUTF8(username) || !isValidUTF8(email) || !isValidUTF8(password)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid input encoding, must be UTF-8'
      });
    }

    if (!isValidUsername(username)) {
      return reply.status(400).send({
        success: false,
        message: 'Username contains invalid characters. Only letters and numbers are allowed.'
      });
    }

    if (hasWhitespace(username) || hasWhitespace(email)) {
      return reply.status(400).send({
        success: false,
        message: 'Username or email contains invalid whitespace'
      });
    }

    const validationResult = await validateEmail(email);
    if (!validationResult.valid) {
      return reply.status(400).send({
        success: false,
        message: `Invalid email: ${validationResult.reason}`
      });
    }

    const existingUsername = await getItem('users', 'username', username.toLowerCase());
    if (existingUsername) {
      return reply.status(400).send({
        success: false,
        message: 'Username already exists'
      });
    }

    const existingEmail = await getItem('users', 'email', email.toLowerCase());
if (existingEmail) {
  return reply.status(400).send({
    success: false,
    message: 'Email already exists'
  });
}

    const FIREBASE_API_KEY = await getFirebaseApiKey();

    const { data: { idToken, localId, refreshToken } } = await axios.post(`${FIREBASE_API_URL}/accounts:signUp?key=${FIREBASE_API_KEY}`, {
      email,
      password,
      returnSecureToken: true
    });

    await axios.post(`${FIREBASE_API_URL}/accounts:sendOobCode?key=${FIREBASE_API_KEY}`, {
      requestType: "VERIFY_EMAIL",
      idToken
    });

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

    await addItem('users', userObj, true, 'email', email);

    return reply.send({
      success: true,
      message: 'User created successfully. Verification email sent.',
      userId: localId,
      refCode: userObj.refCode
    });
  } catch (error) {
    console.error('Error during signup:', error.response?.data?.error?.message || error.message);
    return reply.status(400).send({
      success: false,
      message: error.response?.data?.error?.message || error.message
    });
  }
};

module.exports = async (fastify, opts) => {
  console.log('Server started: /signup route registered.');
  fastify.post('/signup', { config: { tag: 'signup' }, handler: signupHandler });
};
