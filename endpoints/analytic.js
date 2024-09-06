const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const DATA_FOLDER = path.join(__dirname, '..', 'data');
const AUTH_FILE = path.join(DATA_FOLDER, 'auth.jsonl');
const TRACKER_FILE = path.join(DATA_FOLDER, 'tracker.jsonl');

const readData = async (file) => {
  try {
    const data = await fs.readFile(file, 'utf8');
    return data.trim().split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
};

const writeData = async (file, data) => {
  try {
    await fs.writeFile(file, data.map(entry => JSON.stringify(entry)).join('\n') + '\n', 'utf8');
  } catch (err) {
    throw err;
  }
};

const generateTrackingId = () => crypto.randomBytes(16).toString('hex');

const getUuidFromToken = async token => {
  const authTokens = await readData(AUTH_FILE);
  const authEntry = authTokens.find(auth => auth.authToken === token);
  return authEntry ? authEntry.uuid : null;
};

const validateToken = async token => (await getUuidFromToken(token)) !== null;

const authTokenMiddleware = async (request, reply) => {
  const token = request.cookies.authToken;
  if (!token) return reply.status(401).send({ error: 'Unauthorized: No token provided' });
  if (!(await validateToken(token))) return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
  request.uuid = await getUuidFromToken(token);
  if (!request.uuid) return reply.status(401).send({ error: 'Unauthorized: Invalid UUID' });
};

const analyticHandler = async (request, reply) => {
  const { uuid } = request;
  const { viewport, device, ip, country, ...rest } = request.body;

  if (!viewport || !device || !ip || !country) {
    return reply.status(400).send({ error: 'Viewport, device, IP, and country are required' });
  }

  try {
    await updateTrackerData({ uuid, ...rest, viewport, device });
    reply.status(200).send({ message: 'Noted' });
  } catch (error) {
    reply.status(500).send({ error: 'Failed to Note', details: error.message });
  }
};

const updateTrackerData = async data => {
  const trackerData = await readData(TRACKER_FILE);
  const existingRecord = trackerData.find(entry => entry.uuid === data.uuid);

  if (existingRecord) {
    Object.keys(data).forEach(key => {
      if (key === 'uuid') return;
      if (Array.isArray(existingRecord[key])) {
        if (!existingRecord[key].includes(data[key])) existingRecord[key].push(data[key]);
      } else if (existingRecord[key] !== data[key]) {
        existingRecord[key] = [existingRecord[key], data[key]];
      } else if (!(key in existingRecord)) {
        existingRecord[key] = data[key];
      }
    });
  } else {
    if (!data.trackingId) data.trackingId = generateTrackingId();
    trackerData.push(data);
  }

  await writeData(TRACKER_FILE, trackerData);
};

module.exports = async (fastify, opts) => {
  fastify.addHook('preHandler', authTokenMiddleware);
  fastify.post('/analytic', { config: { tag: 'analytic' }, handler: analyticHandler });
};
