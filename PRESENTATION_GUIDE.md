# Nimbus Weather - Presentation & Viva Guide

This document is designed to help you confidently present your Nimbus Weather App to your teacher and answer any technical questions they might ask during your viva/presentation.

---

## 1. Project Overview & Architecture (How it Works)

**What is it?**
Nimbus Weather is a full-stack web application that provides real-time weather forecasts, historical weather data, and an automated daily weather report sent directly to users' emails.

**How does it work? (The Flow)**
1. **Frontend (The Face of the App):** Built with pure HTML, CSS (using modern Glassmorphism design), and JavaScript. When a user opens the app, JavaScript fetches their coordinates and uses the Open-Meteo API to get live weather data. The UI then updates dynamically, rendering temperature, conditions, and a 24-hour interactive chart (using Chart.js).
2. **Backend (The Brain of the App):** Built with Node.js and Express.js. It acts as the secure middleman. 
3. **Database (The Memory):** We use MongoDB to store subscriber information securely. When a user subscribes on the frontend, their email and city coordinates are saved here.
4. **Automation (The Daily Routine):** A tool called `node-cron` runs on the backend. Every day at exactly 8:00 AM, it wakes up, pulls the list of subscribers from MongoDB, fetches the weather for each subscriber's city, and uses Nodemailer to send them a personalized email report.

---

## 2. Tech Stack (How it was Made)

If your teacher asks "Why did you choose these technologies?", here is how to answer:

- **Frontend:** **Vanilla JS, HTML, CSS.** *(Why? To build strong fundamentals without relying on heavy frameworks like React, ensuring the app is lightweight and extremely fast).*
- **Backend:** **Node.js with Express.** *(Why? Because it allows using JavaScript on both the frontend and backend, making the codebase unified and easier to manage).*
- **Database:** **MongoDB (NoSQL).** *(Why? Because weather data and user profiles are flexible and document-oriented. MongoDB scales easily and pairs perfectly with Node.js via Mongoose).*
- **APIs:** **Open-Meteo & BigDataCloud.** *(Why? Open-Meteo does not require API keys, has high rate limits, and provides excellent historical data. BigDataCloud is used for reverse geocoding to turn coordinates into city names).*
- **Email Service:** **Nodemailer.** *(Why? It’s the industry standard for sending emails from Node.js securely).*

---

## 3. Major Problems Faced & How We Solved Them

Teachers **love** asking about challenges. Discussing these shows you actually did the work and understand the deeper mechanics of web development.

### Challenge 1: The Render Hosting IPv6 Email Bug
* **The Problem:** When deploying the backend to Render, the automated emails suddenly stopped working and threw an `ENETUNREACH` error, even though it worked locally.
* **The Solution:** Render’s free tier blocks IPv6 connections for standard SMTP ports. We had to write a script forcing Node.js to use IPv4 for DNS resolution (`dns.setDefaultResultOrder('ipv4first');`). This instantly fixed the email delivery issue.

### Challenge 2: Securing the Cron Job Endpoint
* **The Problem:** We created an endpoint `/api/send-now` to trigger emails manually or via external ping services (like cron-job.org). However, anyone who found that URL could spam our database with requests and exhaust our email limits.
* **The Solution:** We implemented API Key Middleware. We created a `CRON_SECRET_KEY` in our environment variables. Now, the server checks if the incoming request has the correct `?key=` parameter. If it doesn't, it blocks the request with a `401 Unauthorized` error.

### Challenge 3: Rate Limiter Breaking Behind a Proxy
* **The Problem:** We added a rate limiter to prevent bots from spamming the subscription form. However, when deployed, Render uses a reverse proxy. The rate limiter saw the proxy's IP address instead of the actual user's IP, meaning if one user got blocked, everyone got blocked!
* **The Solution:** We added `app.set('trust proxy', 1);` to our Express server. This tells Express to look past the proxy and identify the true IP address of the user submitting the form.

### Challenge 4: CORS Errors Connecting Frontend to Backend
* **The Problem:** When the Netlify frontend tried to send subscription data to the Render backend, the browser blocked it citing a "CORS Policy" error (Cross-Origin Resource Sharing).
* **The Solution:** We configured the `cors` middleware on the Express server to explicitly allow traffic originating from our specific Netlify domain and local development ports, while rejecting unknown traffic.

---

## 4. Potential Viva Questions & Answers

**Q: How does the app know my location when I open it?**
**A:** We use the browser's native HTML5 Geolocation API (`navigator.geolocation`). It asks the user for permission, grabs their latitude and longitude, and then we use the BigDataCloud reverse-geocoding API to turn those coordinates into a readable city name before fetching the weather.

**Q: Where are the user passwords stored?**
**A:** Currently, the app is a subscription service, not a full user-account system. We only collect emails and cities, so no passwords are stored. *If you add the login feature later:* We hash the passwords using a library called `bcrypt` before saving them to MongoDB. We never store plain-text passwords.

**Q: What happens if the weather API goes down?**
**A:** We wrapped our API calls in `try...catch` blocks. If the Open-Meteo API fails, the backend catches the error, logs it so the server doesn't crash, and the frontend displays a polite "Error fetching weather data" toast notification to the user instead of breaking the UI.

**Q: How do you prevent people from entering fake emails?**
**A:** We have two layers of validation. First, the HTML `type="email"` input tag forces basic validation on the frontend. Second, the Express backend uses a Regular Expression (Regex) to strictly verify the email format before allowing it to interact with the MongoDB database. 

---

**Good luck with your presentation! You have built a robust, highly-functional application with real-world security practices. Be proud of it!**
