const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const recentContainer = document.getElementById('recent-searches');

const loadingEl = document.getElementById('loading');
const weatherContent = document.getElementById('weather-content');
const cityNameEl = document.getElementById('city-name');
const tempEl = document.getElementById('temp');
const conditionEl = document.getElementById('condition');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const weatherIconEl = document.getElementById('weather-icon');

let forecastChart = null;

// Weather codes mapping for Open-Meteo
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

document.addEventListener("DOMContentLoaded", () => {
    // Try to load last searched city or default to London
    const lastStr = localStorage.getItem("recentSearches");
    let initialLat = 51.5085;
    let initialLon = -0.1257;
    let initialName = "London";

    if (lastStr) {
        let recents = JSON.parse(lastStr);
        if (recents.length > 0) {
            initialLat = recents[0].lat;
            initialLon = recents[0].lon;
            initialName = recents[0].name;
        }
    }
    
    fetchWeather(initialLat, initialLon, initialName);
});

searchBtn.addEventListener('click', () => {
    let q = searchInput.value.trim();
    if(q) searchCity(q);
});

searchInput.addEventListener('keyup', (e) => {
    if(e.key === 'Enter') {
        let q = searchInput.value.trim();
        if(q) searchCity(q);
    }
});

locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser.');
        return;
    }

    loadingEl.style.display = 'block';
    weatherContent.style.display = 'none';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            // Reverse geocode to get city name is complex with open-meteo alone without reverse API, 
            // but we can query big-data-cloud free API for reverse geocoding
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
                .then(res => res.json())
                .then(data => {
                    let city = data.city || data.locality || "Your Location";
                    fetchWeather(lat, lon, city);
                })
                .catch(() => {
                    fetchWeather(lat, lon, "Your Location");
                });
        },
        () => {
            showToast('Unable to retrieve your location.');
            loadingEl.style.display = 'none';
        }
    );
});

async function searchCity(query) {
    try {
        loadingEl.style.display = 'block';
        weatherContent.style.display = 'none';
        
        let res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
        let data = await res.json();
        
        if (!data.results || data.results.length === 0) {
            showToast("City not found. Please try again.");
            loadingEl.style.display = 'none';
            weatherContent.style.display = 'grid'; // restore
            return;
        }
        
        let city = data.results[0];
        saveRecentSearch(city.name, city.latitude, city.longitude);
        fetchWeather(city.latitude, city.longitude, city.name);
        searchInput.value = '';
    } catch (err) {
        console.error(err);
        showToast("Error searching for city.");
        loadingEl.style.display = 'none';
    }
}

function saveRecentSearch(name, lat, lon) {
    let recents = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    // Filter out existing
    recents = recents.filter(r => r.name !== name);
    recents.unshift({ name, lat, lon });
    if(recents.length > 5) recents.pop();
    localStorage.setItem('recentSearches', JSON.stringify(recents));
}

async function fetchWeather(lat, lon, name) {
    try {
        loadingEl.style.display = 'block';
        weatherContent.style.display = 'none';

        let res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`);
        let data = await res.json();
        
        updateUI(name, data);
    } catch(err) {
        console.error(err);
        showToast('Error fetching weather data.');
        loadingEl.style.display = 'none';
    }
}

function updateUI(city, data) {
    loadingEl.style.display = 'none';
    weatherContent.style.display = 'grid';

    const current = data.current_weather;
    const hourly = data.hourly;

    // Current weather
    cityNameEl.textContent = city;
    tempEl.textContent = `${Math.round(current.temperature)}°C`;
    
    // Condition mapping
    let wcode = current.weathercode;
    let mapped = weatherCodes[wcode] || { label: 'Unknown', icon: 'cloud' };
    conditionEl.textContent = mapped.label;
    
    weatherIconEl.setAttribute('data-lucide', mapped.icon);
    lucide.createIcons();

    // Humidity/Wind (taking next hour's data as approx)
    let currTimeParsed = new Date(current.time);
    // Find closest hour
    let idx = hourly.time.findIndex(t => new Date(t) >= currTimeParsed);
    if(idx === -1) idx = 0;
    
    humidityEl.textContent = `${hourly.relative_humidity_2m[idx]}%`;
    windEl.textContent = `${hourly.wind_speed_10m[idx]} km/h`;

    // Chart
    renderChart(hourly);
}

function renderChart(hourly) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    
    // Get next 24 hours
    const labels = hourly.time.slice(0, 24).map(t => {
        let d = new Date(t);
        return `${d.getHours()}:00`;
    });
    const temps = hourly.temperature_2m.slice(0, 24);

    if (forecastChart) {
        forecastChart.destroy();
    }

    Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();

    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temps,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointBackgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { maxTicksLimit: 8 }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}
