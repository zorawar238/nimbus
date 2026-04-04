const form = document.getElementById('history-form');
const cityInput = document.getElementById('hist-city');
const yearSelect = document.getElementById('hist-year');
const submitBtn = document.querySelector('.submit-btn');

const loadingEl = document.getElementById('loading');
const historyContent = document.getElementById('history-content');
const historyResults = document.getElementById('history-results');
const historyHeader = document.getElementById('history-header');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    const yearsAgo = parseInt(yearSelect.value);
    
    if(!city) return;

    // UI state
    submitBtn.disabled = true;
    loadingEl.style.display = 'block';
    historyContent.style.display = 'none';
    
    try {
        // Step 1: Geocoding
        let geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        let geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            showToast("City not found. Please try again.");
            resetUI();
            return;
        }

        let loc = geoData.results[0];

        // Step 2: Calculate date range (same week, N years ago)
        let end = new Date();
        end.setFullYear(end.getFullYear() - yearsAgo);
        
        let start = new Date(end);
        start.setDate(start.getDate() - 6); // 7 days inclusive

        let startDateStr = formatDate(start);
        let endDateStr = formatDate(end);

        // Step 3: Fetch Historical
        let histRes = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${loc.latitude}&longitude=${loc.longitude}&start_date=${startDateStr}&end_date=${endDateStr}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
        
        if (!histRes.ok) {
            showToast('Premium feature or data unavailable for this date range.');
            resetUI();
            return;
        }

        let histData = await histRes.json();

        if (!histData.daily) {
            showToast('No historical data available for this range.');
            resetUI();
            return;
        }

        renderHistory(loc.name, yearsAgo, histData.daily);

    } catch(err) {
        console.error(err);
        showToast("Error retrieving historical data.");
    } finally {
        resetUI();
    }
});

function resetUI() {
    submitBtn.disabled = false;
    loadingEl.style.display = 'none';
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

const weatherCodes = {
    0: { label: 'Clear sky', icon: 'sun' },
    1: { label: 'Mainly clear', icon: 'sun' },
    2: { label: 'Partly cloudy', icon: 'cloud-sun' },
    3: { label: 'Overcast', icon: 'cloud' },
    45: { label: 'Fog', icon: 'cloud-fog' },
    48: { label: 'Depositing rime fog', icon: 'cloud-fog' },
    51: { label: 'Light Drizzle', icon: 'cloud-drizzle' },
    53: { label: 'Moderate Drizzle', icon: 'cloud-drizzle' },
    55: { label: 'Dense Drizzle', icon: 'cloud-drizzle' },
    61: { label: 'Slight Rain', icon: 'cloud-rain' },
    63: { label: 'Moderate Rain', icon: 'cloud-rain' },
    65: { label: 'Heavy Rain', icon: 'cloud-rain' },
    71: { label: 'Slight Snow', icon: 'cloud-snow' },
    73: { label: 'Moderate Snow', icon: 'cloud-snow' },
    75: { label: 'Heavy Snow', icon: 'cloud-snow' },
    95: { label: 'Thunderstorm', icon: 'cloud-lightning' }
};

function renderHistory(cityName, yearsAgo, daily) {
    historyContent.style.display = 'block';
    historyHeader.textContent = `${cityName} — ${yearsAgo} Year${yearsAgo > 1 ? 's' : ''} Ago`;
    historyResults.innerHTML = '';

    for (let i = 0; i < daily.time.length; i++) {
        let t = new Date(daily.time[i]);
        let max = Math.round(daily.temperature_2m_max[i]);
        let min = Math.round(daily.temperature_2m_min[i]);
        let code = daily.weathercode[i];
        
        let mapped = weatherCodes[code] || { label: 'Unknown', icon: 'cloud' };

        let card = document.createElement('div');
        card.className = 'daily-card glass';
        
        card.innerHTML = `
            <div class="date">${t.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            <i data-lucide="${mapped.icon}" style="margin: 0.75rem 0; width: 40px; height: 40px; color: var(--accent-color);"></i>
            <div style="font-weight: 500;">${mapped.label}</div>
            <div class="min-max">H: ${max}° &nbsp; L: ${min}°</div>
        `;
        
        historyResults.appendChild(card);
    }
    
    // Re-init newly added icons
    lucide.createIcons();
}
