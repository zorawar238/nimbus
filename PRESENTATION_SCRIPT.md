# 🎙️ Nimbus Weather: Class Presentation Script

*Use this script as a guide when presenting to your class. Words in **[BRACKETS]** are actions you should take on the screen.*

---

## 1. Introduction
"Good morning everyone. My name is Nishant Kumar, and along with Pratik and Rishab, we built **Nimbus Weather**." 

"Nimbus is a full-stack weather application. Our goal was to build something that isn't just functional, but also beautiful and highly automated. Instead of using heavy frameworks, we built the entire frontend from scratch using Vanilla JavaScript, HTML, and CSS, and we powered the backend with a Node.js Express server."

---

## 2. Live Demo: The Interface & Live Data
**[ACTION: Open the app on `localhost:3000` or your live URL. Show the Homepage.]**

"As you can see, we focused heavily on modern UI/UX, utilizing a 'Glassmorphism' design pattern. 

Let's do a live search."

**[ACTION: Type 'Paris' or 'Tokyo' into the search bar and hit Enter]**

"When I search for a city, our Vanilla JavaScript intercepts the input and hits the Open-Meteo Geocoding API to translate the city name into exact coordinates. Then, it fetches the live weather data. 

We used a library called Chart.js to dynamically draw this 24-hour temperature trend graph, and we used Lucide icons to dynamically update the weather conditions. 

Also, if I click this location pin..."
**[ACTION: Click the location pin icon]**
"...the app uses the browser's native Geolocation API to find my exact coordinates, and then reverse-geocodes it to show the weather exactly where we are sitting right now."

---

## 3. The "Time Machine" Feature
**[ACTION: Click on the 'History' tab in the navigation bar]**

"One of the unique features we added is a weather 'Time Machine'. If you've ever wondered what the weather was like exactly one or five years ago today, you can look it up."

**[ACTION: Type 'New York', select '1 Year Ago', and click Search]**

"Under the hood, JavaScript is taking today's date, subtracting exactly one year, and requesting a 7-day window of historical data from the Open-Meteo Archive API. It then loops through the data to build these daily cards on the fly."

---

## 4. The Backend Automation (The Star Feature)
**[ACTION: Click on the 'Subscribe' tab]**

"While the frontend is cool, the real magic happens on our backend. We didn't just want users to *check* the weather; we wanted the weather to come to *them*. 

This is our Daily Report subscription page. If you enter your email and city here..."
**[ACTION: Point to the form, you don't necessarily have to fill it out unless you want to show the welcome email]**
"...it sends a `POST` request to our Express server."

"First, our server passes the request through an IP Rate Limiter to stop bots from spamming us. Second, it runs a Regex validation to ensure the email is real. Finally, it saves the user's data into a cloud **MongoDB** database. 

The moment you subscribe, our backend uses a library called `Nodemailer` to log into a secure Gmail account and instantly send you a Welcome email."

**[ACTION: Switch to your code editor, or just explain it to the class]**
"But the best part is the automation. We implemented a library called `node-cron` on our server. Every single morning at exactly 8:00 AM, our server wakes up, pulls the massive list of subscribers from MongoDB, individually fetches the weather for each person's city, and automatically emails them their daily report. It's completely hands-off."

---

## 5. Overcoming Challenges
"Building a full-stack app came with real-world deployment challenges. 

For example, when we deployed our backend to Render, our automated emails completely broke. We discovered that Render's free tier blocks IPv6 connections for SMTP email ports. We had to dig into the Node.js documentation and write a script to force our server to use IPv4 DNS resolution—and that instantly fixed the bug. 

We also had to learn how to manage CORS errors between our Netlify frontend and Render backend, and how to secure our automated Cron endpoints with secret API keys so malicious users couldn't trigger thousands of emails."

---

## 6. Conclusion
**[ACTION: Go back to the 'Home' page or the 'Team' page]**

"By building Nimbus, our team learned how to connect a beautiful, raw JavaScript frontend to a robust, secure, database-driven backend. We're really proud of the result. 

Thank you for listening, and we'd be happy to answer any questions you have!"
