const fs = require('fs').promises;
const path = require('path');

// Define global variables for folder paths and timers
const DATA_FOLDER = '../data';
const AUTH_FILE = `${DATA_FOLDER}/auth.jsonl`;

const userTimers = new Map(); // Track user timers globally

// Function to read auth data
const readAuthData = async () => {
    try {
        const data = await fs.readFile(AUTH_FILE, 'utf8');
        return data.trim().split('\n').map(line => JSON.parse(line));
    } catch (error) {
        console.error('Error reading auth file:', error);
        return [];
    }
};

// Function to write updated auth data
const writeAuthData = async (authData) => {
    try {
        const data = authData.map(entry => JSON.stringify(entry)).join('\n') + '\n';
        await fs.writeFile(AUTH_FILE, data, 'utf8');
    } catch (error) {
        console.error('Error writing auth file:', error);
    }
};

// Fastify handler for the /logout endpoint
async function logoutHandler(request, reply) {
    const authToken = request.cookies.authToken;

    if (!authToken) {
        return reply.status(400).send({ success: false, message: 'Auth token is required' });
    }

    try {
        // Read the auth data and filter out the record with the given authToken
        let authData = await readAuthData();
        const filteredAuthData = authData.filter(entry => entry.authToken !== authToken);

        // If the token was found and removed
        if (authData.length !== filteredAuthData.length) {
            // Update the auth file
            await writeAuthData(filteredAuthData);

            // Clear the auth token cookie
            reply.clearCookie('authToken', {
                httpOnly: true,
                path: '/'
            });

            // Stop the timer for the user if exists
            const user = authData.find(entry => entry.authToken === authToken);
            if (user && userTimers.has(user.uuid)) {
                clearTimeout(userTimers.get(user.uuid));
                userTimers.delete(user.uuid);
            }

            return reply.status(200).send({ success: true, message: 'Logged out successfully' });
        } else {
            return reply.status(404).send({ success: false, message: 'Auth token not found' });
        }
    } catch (error) {
        console.error('Error during logout:', error.message);
        return reply.status(500).send({ success: false, message: 'Failed to log out' });
    }
}

// Export the Fastify route
module.exports = async function (fastify, opts) {
    fastify.get('/logout', {
        config: { tag: 'logout' },
        handler: logoutHandler
    });
};
