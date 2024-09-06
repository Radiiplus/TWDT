let lastMessageId = sessionStorage.getItem('lastMessageId') || null;
let socket;

const connectToSocketIO = () => {
    console.log('Attempting to connect to Socket.IO...');
    socket = io('/socket');
    socket.on('connect', () => console.log('Socket.IO connection established successfully'));
    socket.on('message', data => {
        if (data.id !== lastMessageId) {
            lastMessageId = data.id;
            sessionStorage.setItem('lastMessageId', lastMessageId);
            updateChatCardContent(data.id, data.username || 'Unknown', data.message || '', data.timestamp || 'Unknown');
            checkInboxBadge();
        }
    });
    socket.on('connect_error', error => {
        console.error('Socket.IO connection error:', error);
        socket.disconnect();
        setTimeout(connectToSocketIO, 5000);
    });
    socket.on('disconnect', () => console.log('Socket.IO disconnected'));
};

const reconnectSocketIO = () => {
    console.log('Attempting to reconnect to Socket.IO...');
    socket?.disconnect();
    connectToSocketIO();
};

const updateChatCardContent = (id, username, message, timestamp) => {
    $('#chat-content').text(`${username}: ${message.substring(0, 10)}${message.length > 10 ? ' ...' : ''}`);
    console.log(`Chat card updated with: ${username}: ${message.substring(0, 10)}${message.length > 10 ? ' ...' : ''}`);
};

const checkInboxBadge = () => {
    document.getElementById('inbox-badge').style.display = localStorage.getItem('lastReadMessageId') !== lastMessageId ? 'block' : 'none';
};

document.addEventListener('DOMContentLoaded', connectToSocketIO);

const manualReconnect = () => {
    socket?.disconnect();
    connectToSocketIO();
};
