const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const socketio = require('socket.io');

const DATA_FOLDER = path.join(__dirname, '..', 'data');
const CHAT_FILE = path.join(DATA_FOLDER, 'chat.jsonl');
let clientCount = 0;

console.log('Server started: /socketio route registered.');

const readMessages = async () =>
    (await fs.readFile(CHAT_FILE, 'utf8').catch(() => '')).split('\n')
        .filter(line => line.trim())
        .map(line => {
            try {
                const { uuid, ...filteredMessage } = JSON.parse(line);
                return filteredMessage;
            } catch { return null; }
        })
        .filter(Boolean);

module.exports = async (fastify) => {
    const io = socketio(fastify.server, { cors: { origin: '*', methods: ['GET'] } });
    io.of('/socket').on('connection', async (socket) => {
        clientCount++;
        let lastMessageCount = 0;
        const messages = await readMessages();
        lastMessageCount = messages.length;
        messages.forEach(message => socket.emit('message', message));

        const watcher = chokidar.watch(CHAT_FILE, { persistent: true });
        watcher.on('change', async () => {
            const newMessages = (await readMessages()).slice(lastMessageCount);
            lastMessageCount += newMessages.length;
            newMessages.forEach(message => socket.emit('message', message));
        });

        socket.on('disconnect', () => { clientCount--; watcher.close(); });
    });

    fastify.addHook('onRequest', (req, reply, done) =>
        req.raw.url === '/socket' && req.raw.method !== 'GET'
            ? reply.status(405).send({ error: 'Method Not Allowed' }) : done());
};
