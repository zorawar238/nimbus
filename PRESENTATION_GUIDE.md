# Nimbus Weather - Presentation & Viva Guide

This document is designed to help you confidently present your Nimbus Weather App to your teacher and answer any technical questions they might ask during your viva/presentation.

---

## 1. Project Overview (The High-Level Flow)

**What is it?**
Nimbus Weather is a full-stack web application that provides real-time weather forecasts, historical weather data, and an automated daily weather report sent directly to users' emails.

**How does it work?**
1. **Frontend (The Face):** Built with pure HTML, CSS (Glassmorphism design), and JavaScript. It fetches live data via Open-Meteo and renders interactive charts with Chart.js.
2. **Backend (The Brain):** Built with Node.js and Express.js to act as a secure middleman and automation hub.
3. **Database (The Memory):** MongoDB stores subscriber information securely.
4. **Automation (The Routine):** `node-cron` runs on the backend. Every day at exactly 8:00 AM, it pulls subscribers from MongoDB, fetches their local weather, and uses Nodemailer to send personalized email reports.

---

## 2. Deep Dive: Exactly How Every Feature Works

If your teacher asks you to explain the mechanical flow of your code, use these breakdowns.

### The Foundation: How the Project was Created
1. **Frontend Separation:** The UI was built using Vanilla DOM manipulation (`document.getElementById`) to keep the app lightweight and fast, without relying on heavy frameworks like React. The premium aesthetic uses a Glassmorphism design pattern (`backdrop-filter: blur()`).
2. **Backend Setup:** Initialized a Node.js environment (`npm init`) and used Express.js to spin up a web server.
3. **Database Connection:** Connected the backend to a cloud MongoDB cluster using the Mongoose library. Mongoose allows defining a "Schema" (a strict blueprint) for what a subscriber document should look like.

### Feature 1: Live Weather Search & Automatic Location
1. **User Action:** The user types a city and presses Enter, OR clicks the location pin icon.
2. **Location APIs:** 
   - If they click the pin, JavaScript uses the browser's native `navigator.geolocation` API to get raw coordinates. It then sends those to the **BigDataCloud API** (Reverse Geocoding) to turn "Lat/Lon" into a city name.
   - If they manually typed a city, the code sends the name to the **Open-Meteo Geocoding API** to turn the city name into Lat/Lon coordinates.
3. **Weather Fetching:** With exact coordinates, the app makes a `fetch()` request to the **Open-Meteo Forecast API**.
4. **DOM Manipulation:** The API returns a large JSON object. JavaScript extracts variables like `current_weather.temperature` and injects them directly into the HTML using `.textContent`.
5. **The Chart:** The `hourly.temperature_2m` array from the API response is fed into **Chart.js**, dynamically drawing the 24-hour graph.
6. **Local Storage:** The city is saved to the browser's `localStorage` so the user's last search loads automatically on refresh.

### Feature 2: The "Time Machine" (Historical Weather)
1. **User Action:** The user types a city, selects "X Years Ago", and submits.
2. **Date Math:** JavaScript takes today's date, subtracts the selected number of years using `Date.setFullYear()`, and calculates a 7-day window around that past date.
3. **Archive API:** The app sends those specific dates and coordinates to the **Open-Meteo Historical Archive API**.
4. **Dynamic Rendering:** The API returns 7 days of historical temperatures. JavaScript uses a `for loop` to iterate through the data, creates HTML `<div>` cards on the fly using `document.createElement`, and appends them to the DOM.

### Feature 3: The Daily Email Subscription (The Backend)
1. **Security First (Rate Limiting):** A `POST` request is sent to `/api/subscribe`. Before Express reads it, the `express-rate-limit` middleware checks if that IP has submitted 5 times in 15 minutes. If so, it blocks them to prevent bot spam.
2. **Data Validation:** The server runs a Regular Expression (Regex) to strictly ensure the provided email is a real format.
3. **Database Saving:** The server uses Mongoose's `findOneAndUpdate` with `upsert: true`. This logic dictates: "Find this email. If it exists, update their city. If not, create a new subscriber record."
4. **The Welcome Email:** The server immediately uses the **Nodemailer** library to log into the configured Gmail account (via secure App Passwords) and sends an HTML welcome email.
5. **The Automation Loop:** `node-cron` is scheduled with `'0 8 * * *'` (Run at exactly 8:00 AM daily). At 8 AM, the server fetches an array of all subscribers from MongoDB, loops through every user, fetches their individual weather, and tells Nodemailer to send out their personalized reports.

---

## 3. Tech Stack (Why We Chose It)

- **Frontend:** Vanilla JS, HTML, CSS. *(Why? To build strong fundamentals without heavy frameworks, ensuring maximum speed).*
- **Backend:** Node.js with Express. *(Why? Unified JavaScript across the entire stack).*
- **Database:** MongoDB. *(Why? Document-oriented NoSQL scales easily and pairs perfectly with Node.js).*
- **APIs:** Open-Meteo & BigDataCloud. *(Why? Open-Meteo has no API keys and high limits. BigDataCloud allows reverse geocoding).*
- **Email:** Nodemailer. *(Why? Industry standard for secure email delivery).*

---

## 4. Major Problems Faced & How We Solved Them

### Challenge 1: The Render Hosting IPv6 Email Bug
* **The Problem:** When deployed, automated emails threw an `ENETUNREACH` error because Render’s free tier blocks IPv6 connections for SMTP ports.
* **The Solution:** We wrote a script forcing Node.js to use IPv4 for DNS resolution (`dns.setDefaultResultOrder('ipv4first');`), which instantly fixed delivery.

### Challenge 2: Securing the Cron Job Endpoint
* **The Problem:** We created an endpoint `/api/send-now` to manually trigger emails, but anyone who found the URL could spam our database.
* **The Solution:** We implemented API Key Middleware. The server now checks if incoming requests possess the correct `CRON_SECRET_KEY`. If not, it returns a `401 Unauthorized` error.

### Challenge 3: Rate Limiter Breaking Behind a Proxy
* **The Problem:** Render uses a reverse proxy. The rate limiter saw the proxy's IP instead of the user's IP, meaning if one user got blocked, everyone did.
* **The Solution:** We added `app.set('trust proxy', 1);` to Express, telling it to identify the true IP address of the user submitting the form.

---

## 5. Potential Viva Questions & Answers

**Q: Where are the user passwords stored?**
**A:** Currently, the app is a subscription service, not a full user-account system. We only collect emails and cities, so no passwords are stored. If we implement accounts, we would hash passwords using `bcrypt` before saving them to MongoDB.

**Q: What happens if the weather API goes down?**
**A:** We wrapped our API calls in `try...catch` blocks. If the API fails, the backend catches the error, logs it so the server doesn't crash, and the frontend displays a polite "Error fetching weather data" toast notification to the user instead of breaking the UI.

**Q: How do you prevent people from entering fake emails?**
**A:** We use two layers of validation. First, the HTML `type="email"` input tag forces basic validation. Second, the Express backend uses Regex to strictly verify the email format before allowing it into the database.
