const fs = require('fs').promises;
const path = require('path');
const { generate32BitToken } = require('../module/tGen.js');
const validator = require('validator');
const xss = require('xss');

const DATA_FOLDER = path.join(__dirname, '..', 'data');
const AUTH_FILE = path.join(DATA_FOLDER, 'auth.jsonl');
const CHAT_FILE = path.join(DATA_FOLDER, 'chat.jsonl');

const validateAuthToken = async (authToken) => {
  try {
    const authDataArray = (await fs.readFile(AUTH_FILE, 'utf-8')).trim().split('\n').map(line => JSON.parse(line));
    const tokenData = authDataArray.find(data => data.authToken === authToken);
    return (!tokenData || new Date(tokenData.expiresAt) < new Date()) ? { valid: false } : { valid: true, uuid: tokenData.uuid, username: tokenData.username };
  } catch { return { valid: false }; }
};

const ensureMessageLimit = async () => {
  try {
    const lines = (await fs.readFile(CHAT_FILE, 'utf8')).split('\n').filter(line => line.trim() !== '');
    if (lines.length > 10000) await fs.writeFile(CHAT_FILE, lines.slice(-10000).join('\n') + '\n', 'utf8');
  } catch { throw new Error('Failed to manage message limit'); }
};

const saveMessageHandler = async (request, reply) => {
  const { username, message } = request.body;
  const authToken = request.cookies.authToken;
  if (!message || !message.trim()) return;

  if (!authToken) return reply.status(400).send({ success: false, message: 'Message and auth token required' });
  if (message.length > 3000) return reply.status(400).send({ success: false, message: 'Message exceeds limit' });
  if (validator.isURL(message, { require_protocol: false })) return reply.status(400).send({ success: false, message: 'Links not allowed' });

  const sanitizedMessage = xss(message);
  const { valid, uuid, username: tokenUsername } = await validateAuthToken(authToken);
  if (!valid || username !== tokenUsername) return reply.status(401).send({ success: false, message: 'Unauthorized' });

  await ensureMessageLimit();
  const messageId = generate32BitToken();
  await fs.appendFile(CHAT_FILE, JSON.stringify({
    id: messageId,
    username,
    message: sanitizedMessage,
    timestamp: new Date().toISOString(),
    uuid
  }) + '\n', 'utf8');

  return reply.status(201).send({ success: true, message: 'Message saved', id: messageId });
};

const deleteMessageHandler = async (request, reply) => {
  const { id, username } = request.body;
  const authToken = request.cookies.authToken;
  if (!id || !authToken || !username) return reply.status(400).send({ success: false, message: 'ID, auth token, and username required' });
  const { valid, uuid, username: tokenUsername } = await validateAuthToken(authToken);
  if (!valid || username !== tokenUsername) return reply.status(401).send({ success: false, message: 'Unauthorized' });
  const updatedLines = (await fs.readFile(CHAT_FILE, 'utf8')).split('\n').filter(line => line.trim() !== '').filter(line => JSON.parse(line).id !== id);
  if (updatedLines.length === (await fs.readFile(CHAT_FILE, 'utf8')).split('\n').filter(line => line.trim() !== '').length) return reply.status(404).send({ success: false, message: 'Message not found' });
  await fs.writeFile(CHAT_FILE, updatedLines.join('\n') + '\n', 'utf8');
  return reply.status(200).send({ success: true, message: 'Message deleted' });
};

module.exports = async (fastify) => {
  fastify.post('/message', { config: { tag: 'message' }, handler: saveMessageHandler });
  fastify.post('/message/delete', { config: { tag: 'message-delete' }, handler: deleteMessageHandler });
  console.log('Script started: /message and /message/delete routes registered.');
};
