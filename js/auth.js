let isLoginMode = true;
const authFormContainer = document.getElementById('auth-form-container');
const logoutContainer = document.getElementById('logout-container');

const form = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnIcon = document.getElementById('btn-icon');
const title = document.getElementById('form-title');
const subtitle = document.getElementById('form-subtitle');
const switchModeText = document.getElementById('switch-mode-text');

const navLoginLink = document.getElementById('nav-login-link');
const logoutBtn = document.getElementById('logout-btn');

document.addEventListener("DOMContentLoaded", () => {
    checkAuthStatus();
});

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        authFormContainer.style.display = 'none';
        logoutContainer.style.display = 'block';
        if(navLoginLink) navLoginLink.textContent = 'My Account';
    } else {
        authFormContainer.style.display = 'block';
        logoutContainer.style.display = 'none';
        if(navLoginLink) navLoginLink.textContent = 'Login';
    }
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        showToast('Logged out successfully');
        checkAuthStatus();
    });
}

if (switchModeText) {
    switchModeText.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            title.textContent = 'Login';
            subtitle.textContent = 'Welcome back! Log in to save your searches.';
            btnText.textContent = 'Login';
            btnIcon.setAttribute('data-lucide', 'log-in');
            switchModeText.innerHTML = `Don't have an account? <span>Register here</span>`;
        } else {
            title.textContent = 'Register';
            subtitle.textContent = 'Create an account to save your search history.';
            btnText.textContent = 'Create Account';
            btnIcon.setAttribute('data-lucide', 'user-plus');
            switchModeText.innerHTML = `Already have an account? <span>Login here</span>`;
        }
        lucide.createIcons();
    });
}

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'
    ? 'http://localhost:3000' 
    : 'https://nimbus-w3fa.onrender.com';

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if(!email || !password) return;

        submitBtn.disabled = true;
        const originalText = btnText.textContent;
        btnText.textContent = 'Processing...';

        const endpoint = isLoginMode ? '/api/login' : '/api/register';

        try {
            const res = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                if (isLoginMode) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userEmail', data.email);
                    showToast('Logged in successfully!');
                    checkAuthStatus();
                } else {
                    showToast('Registration successful! Please log in.');
                    // Switch to login mode
                    switchModeText.click();
                }
            } else {
                showToast(data.error || 'An error occurred.');
            }
        } catch (err) {
            console.error(err);
            showToast('Network error.');
        } finally {
            submitBtn.disabled = false;
            btnText.textContent = originalText;
        }
    });
}
