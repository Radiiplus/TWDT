document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', async (event) => {
        if (event.target.classList.contains('send-icon')) {
            const inputField = document.querySelector('.input-field');
            const message = inputField.value.trim();
            if (isValidMessage(message)) {
                const username = sessionStorage.getItem('username');
                await sendMessage(username, message);
                inputField.value = ''; 
            }
        }
    });
});

function isValidMessage(message) {
    if (message.length > 3000) {
        showToast('Message exceeds 3000 characters.', 3000);
        return false;
    }

    const linkPattern = /(https?:\/\/|www\.|\.com|\.org|\.net|\.io|\.edu|\.gov|\.mil|\.int)/i;
    if (linkPattern.test(message)) {
        showToast('No Links Allowed', 3000);
        return false;
    }

    const sanitizedMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (sanitizedMessage !== message) {
        showToast('Invalid characters detected.', 3000);
        return false;
    }

    return true;
}

async function sendMessage(username, message) {
    try {
        const response = await fetch('/access/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, message })
        });

        if (response.ok) {
            console.log('Message sent:', message);
        } else {
            showToast('Failed to send message.', 3000);
        }
    } catch (error) {
        showToast('Error while sending message.', 3000);
    }
}
