async function validateRequest() {
    try {
        const response = await fetch('/access/validate');
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                console.log('Token is valid');
            } else {
                console.log('Token is invalid:', result.message);
                window.location.href = '/about';
            }
        } else {
            throw new Error('Error validating request');
        }
    } catch (error) {
        console.error('Request failed:', error);
        window.location.href = '/about';
    }
}
document.addEventListener('DOMContentLoaded', validateRequest);
