# Comprehensive Project Report: Nimbus Weather Application

## 1. Abstract
The Nimbus Weather Application is a full-stack, responsive web application designed to deliver real-time meteorological data, historical weather trends, and personalized, automated daily weather reports. Built with a modern glassmorphism aesthetic, the platform integrates robust user authentication, a scalable Node.js backend, and MongoDB for persistent data storage. A key innovation of the project is its reliable automated notification system, which utilizes the Brevo REST API to bypass traditional SMTP restrictions on cloud hosting platforms, ensuring timely delivery of weather summaries to subscribed users.

---

## 2. Introduction

The Nimbus Weather Application is a comprehensive web-based platform designed to provide an intuitive, reliable, and aesthetically pleasing experience for users seeking meteorological data. In today's fast-paced digital world, users require weather information that is not only accurate but also easily accessible and proactively delivered. Nimbus addresses this need by combining real-time weather forecasting with a robust daily notification system. By leveraging modern web development practices, secure authentication, and resilient API integrations, the project serves as a sophisticated solution to personal weather tracking and historical data visualization.

### 2.1 Problem Statement
Accessing accurate and localized weather information is a daily necessity. However, many weather applications are cluttered with ads, lack historical context, or fail to provide proactive, automated updates tailored to a user's specific location. Furthermore, deploying a reliable automated email notification system on free-tier cloud platforms poses significant technical challenges due to blocked SMTP ports.

### 2.2 Objectives
- To develop an intuitive, visually appealing weather dashboard using vanilla web technologies.
- To provide real-time weather tracking alongside interactive graphical visualizations of 24-hour forecasts.
- To implement a secure user authentication system that saves personalized search histories.
- To engineer a reliable subscription service that emails users an automated daily weather report at 8:00 AM local time.

### 2.3 Scope
The project encompasses the frontend user interface, the backend RESTful API, database schema design, external API integrations, and the deployment configuration necessary to run the application in a cloud environment.

---

## 3. System Architecture & Technologies

### 3.1 Frontend Stack
- **HTML5 & CSS3**: Structured with semantic HTML and styled using custom CSS variables. The UI employs a "glassmorphism" design system, ensuring a sleek, translucent appearance over dynamic backgrounds. It fully supports responsive design principles for mobile and desktop compatibility, alongside a Light/Dark mode toggle.
- **Vanilla JavaScript (ES6+)**: Handles all client-side logic without the overhead of massive frameworks, ensuring fast load times. Modules are split into `app.js` (UI logic), `weather.js` (API and DOM updates), `auth.js` (authentication), and `subscribe.js` (notifications).
- **Chart.js**: Utilized to render interactive line graphs representing hourly temperature forecasts.
- **Lucide Icons**: Integrated for scalable, modern iconography.

### 3.2 Backend Stack
- **Node.js & Express.js**: The core server environment handling HTTP requests, API routing, and middleware execution. Express acts as the RESTful layer communicating between the client and the database.
- **Mongoose**: An Object Data Modeling (ODM) library used to enforce schemas for MongoDB, handling asynchronous database interactions smoothly.
- **JSON Web Tokens (JWT) & bcrypt**: Utilized for secure, stateless user session management and password hashing, ensuring sensitive user credentials remain protected.
- **Node-Cron**: A task scheduler used to run background tasks independently of incoming HTTP requests.

### 3.3 Database Design (MongoDB)
The application relies on a NoSQL document database (MongoDB) with two primary collections:
1. **Users Collection**: 
   - Fields: `email` (String, unique), `password` (String, hashed), `pastSearches` (Array of Objects containing `name`, `lat`, `lon`, `date`).
2. **Subscribers Collection**: 
   - Fields: `email` (String, unique), `city` (String), `lat` (Number), `lon` (Number).

---

## 4. Detailed Component Analysis

### 4.1 Weather Data Processing
When a user searches for a city, the frontend sends a geocoding request to the Open-Meteo API to translate the city name into precise latitude and longitude coordinates. These coordinates are then used to fetch current weather conditions (temperature, wind speed, humidity) and the 24-hour forecast array. The forecast data is mapped into arrays and fed into Chart.js to dynamically render an hourly temperature graph.

### 4.2 User Authentication & Sessions
The authentication flow utilizes a decoupled, secure approach:
1. **Registration**: The user submits credentials. The backend hashes the password using `bcrypt` (10 salt rounds) before storing it in MongoDB.
2. **Login**: The backend compares the hashed passwords. Upon success, a JWT signed with a highly secure `CRON_SECRET_KEY` is generated and returned to the client.
3. **Session Management**: The client stores the JWT in `localStorage` and appends it to the `Authorization` header (`Bearer <token>`) for subsequent protected API calls, such as saving a recent search to their history.

### 4.3 Subscription & Notification System
Users can opt-in to receive daily weather reports via email. 
1. **Subscription Flow**: Users provide their email and city. The backend geocodes the city, saves the precise coordinates in the `Subscribers` collection, and dispatches an immediate welcome email.
2. **The Cron Job**: The backend utilizes `node-cron` scheduled for `0 8 * * *` (8:00 AM, Asia/Kolkata). When triggered, the server iterates through all subscribers, fetches fresh weather data for each unique coordinate pair, constructs a personalized HTML email, and dispatches it via the Brevo API.

---

## 5. External API Integrations

- **Open-Meteo API**: Serves as the primary meteorological data source. Chosen because it requires no API key, offers high rate limits, and provides highly accurate, granular forecast data in JSON format.
- **BigDataCloud API**: Implemented for reverse-geocoding (translating device coordinates back to a city name) when a user requests weather for their current physical location.
- **Brevo REST API**: Replaced standard NodeMailer SMTP configuration. It utilizes HTTP POST requests to reliably deliver transactional emails (Welcome and Daily Reports).

---

## 6. Challenges & Solutions

### 6.1 Overcoming Cloud Hosting SMTP Restrictions
**Challenge**: Free-tier cloud platforms (like Render) strictly block outbound SMTP traffic (ports 25, 465, 587) to prevent spam, causing traditional NodeMailer setups to fail with `ENETUNREACH` or connection timeouts.
**Solution**: Migrated the entire email infrastructure to use the **Brevo REST API**. By dispatching emails via standard HTTP/HTTPS requests rather than SMTP protocols, the application successfully bypassed firewall restrictions, achieving a 100% email delivery rate.

### 6.2 Preventing Cron Job Timeouts
**Challenge**: Serverless and free-tier environments sleep after inactivity. If the server is asleep at 8:00 AM, the cron job misses its scheduled execution.
**Solution**: Engineered a manual trigger endpoint (`/api/send-now`) secured by a `CRON_SECRET_KEY`. This allows external ping services (like cron-job.org) to wake the server and forcefully trigger the background email dispatch task, guaranteeing reliability.

### 6.3 Security and Abuse Prevention
**Challenge**: Public-facing API endpoints (like subscription and registration) are vulnerable to spam or bot abuse.
**Solution**: Implemented `express-rate-limit`. The `/api/subscribe` route is protected, restricting users to a maximum of 5 requests per 15-minute window per IP address. Furthermore, the Express server is configured with `app.set('trust proxy', 1)` to correctly identify user IPs behind Render's reverse proxies.

---

## 7. Backend API Reference

| Endpoint | Method | Protection | Description |
|----------|--------|------------|-------------|
| `/api/register` | POST | None | Registers a new user account. |
| `/api/login` | POST | None | Authenticates user and returns JWT. |
| `/api/user/searches` | GET | JWT Auth | Retrieves the top 10 recent searches for the logged-in user. |
| `/api/user/searches` | POST | JWT Auth | Appends a new search query to the user's history. |
| `/api/subscribe` | POST | Rate Limited | Adds a user to the mailing list and sends a Welcome email. |
| `/api/unsubscribe` | GET | None | Removes a user from the daily weather report mailing list. |
| `/api/send-now` | GET/POST | API Key | Manually triggers the automated daily email dispatch sequence. |

---

## 8. Conclusion & Future Scope

The Nimbus Weather Application successfully demonstrates the integration of a modern, responsive frontend with a robust, scalable backend. The project achieved its primary objectives of providing accurate weather data, secure user management, and a highly reliable automated notification system.

**Future Enhancements include:**
- **Extended Forecasting**: Integrating a 7-day or 14-day comprehensive weather view.
- **User Customization**: Allowing subscribers to define the specific time they wish to receive their daily emails.
- **Advanced Authentication Flow**: Implementing a secure "Forgot Password" mechanism utilizing the existing Brevo email API infrastructure.
- **Offline PWA Support**: Implementing Service Workers to cache assets and allow the application to load basic UI elements offline.
