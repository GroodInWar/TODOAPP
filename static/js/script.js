// Function to get a cookie by name
function getCookie(name) {
    const cookies = document.cookie.split('; ');
    for (let i = 0; i < cookies.length; i++) {
        const [key, value] = cookies[i].split('=');
        if (key === name) return decodeURIComponent(value);
    }
    return null;
}

// Ensure DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    const username = getCookie('username');
    const welcomeMessageElement = document.getElementById('welcome-message');
    const authButton = document.getElementById('auth-button');

    // Update welcome message
    if (welcomeMessageElement) {
        welcomeMessageElement.textContent = username
            ? `Welcome back, ${username}!`
            : 'Welcome, Guest!';
    } else {
        console.error('Element with ID "welcome-message" not found.');
    }

    // Login button functionality
    if (authButton) {
        if(username) {
            authButton.textContent = 'Logout';
            loginButton.addEventListener('click', () => {
                fetch('/logout')
                    .then(() => {
                        document.cookie = 'username=; Max-Age=0';
                        window.location.href = '/login';
                    })
                    .catch((err) => console.error('Error during logout:', err));
            });
        } else {
            authButton.textContent = 'Login';
            authButton.addEventListener('click', () => {
                window.location.href = '/home';
            });
        }
    } else {
        console.error('Element with ID "auth-button" not found.');
    }
});
