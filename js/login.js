const subscribeForm = document.getElementById('subscribe-form');
const emailInput = document.getElementById('email');
const cityInput = document.getElementById('city');
const submitBtn = document.getElementById('submit-btn');

// Define dynamic backend URL based on environment
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000' 
    // TODO: Update THIS URL once you deploy your backend to Render!
    : 'https://your-backend-app.onrender.com';

document.addEventListener("DOMContentLoaded", () => {
    // Pre-fill city from localStorage if they have a recents
    const lastStr = localStorage.getItem("recentSearches");
    if (lastStr) {
        let recents = JSON.parse(lastStr);
        if (recents.length > 0) {
            cityInput.value = recents[0].name;
        }
    }
});

subscribeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const city = cityInput.value.trim();

    if (!email || !city) return;

    // Loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="width: 1rem; height: 1rem; border-width: 2px;"></span> Subscribing...';

    try {
        // Send to our Node.js backend
        const response = await fetch(`${BACKEND_URL}/api/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, city })
        });

        const data = await response.json();

        if (response.ok) {
            showToast(`Successfully subscribed for ${data.city}!`);
            emailInput.value = '';
        } else {
            showToast(data.error || 'Failed to subscribe.');
        }
    } catch (err) {
        console.error(err);
        showToast('Error connecting to the server. Is it running?');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="send"></i> Subscribe Now';
        lucide.createIcons();
    }
});
