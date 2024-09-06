let uuid = '';
let username = '';
let email = '';
let ban = false;
let verified = false;
let balance = '';
let refCode = '';
let referred = null;
let role = '';

async function fetchUserData() {
    try {
        console.log('Fetching user data...');
        const response = await fetch('/access/user', { method: 'GET' });

        const contentType = response.headers.get('content-type');
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();

            if (data.success) {
                uuid = data.user.uuid || '';
                username = data.user.username || '';
                email = data.user.email || '';
                ban = data.user.ban || false;
                verified = data.user.verified || false;
                balance = data.user.balance || '';
                refCode = data.user.refCode || '';
                referred = data.user.referred || null;
                role = data.user.role || '';

                console.log('User data fetched:', data.user);
            } else {
                console.error('Failed to retrieve valid user data.');
            }

            return data;
        } else {
            throw new Error('Unexpected content type: ' + contentType);
        }
    } catch (error) {
        console.error('Fetch user data failed:', error);
        return null;
    }
}
