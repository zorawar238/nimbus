# Nimbus Weather

Nimbus Weather is a beautiful, full-stack weather application featuring a modern glassmorphism UI. It provides real-time weather data, historical trends, and an automated daily weather report subscription service.

## 🌟 Features

- **Real-Time Weather Data:** Fetches current temperature, humidity, wind speed, and weather conditions using the Open-Meteo API.
- **Hourly Forecast Chart:** Interactive line chart showing the temperature trend for the next 24 hours.
- **Historical Weather Data:** Look back at the weather for any given city exactly 1 to 5 years ago.
- **Daily Weather Subscription:** Users can subscribe with their email and city to receive automated weather reports every morning at 8:00 AM.
- **Modern UI/UX:** Clean, responsive glassmorphism design with light and dark mode support.
- **Rate Limiting & Security:** Backend endpoints are protected against spam with IP-based rate limiting.

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3 (Vanilla)
- JavaScript (ES6+)
- [Chart.js](https://www.chartjs.org/) for data visualization
- [Lucide Icons](https://lucide.dev/) for crisp, scalable iconography

### Backend
- [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) (Mongoose) for subscriber data storage
- [Nodemailer](https://nodemailer.com/) for automated email delivery
- [Node-Cron](https://github.com/node-cron/node-cron) for scheduling daily tasks

### APIs Used
- [Open-Meteo](https://open-meteo.com/) (Geocoding, Current Weather, Historical Weather)
- [BigDataCloud](https://www.bigdatacloud.com/) (Reverse Geocoding for user location)

## 🚀 Getting Started

### Prerequisites
- Node.js installed on your machine
- A MongoDB database URI
- An Email account (like Gmail) with App Passwords enabled for Nodemailer

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd "WEATHER APP"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Rename `.env.example` to `.env` (or create a new `.env` file) and configure the following variables:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   CRON_SECRET_KEY=your_secret_key_for_manual_cron_triggers
   ```

4. **Run the application:**
   ```bash
   npm start
   ```

5. **View the App:**
   Open your browser and navigate to `http://localhost:3000`.

## 🤝 Team
Developed by:
- **Nishant Kumar** - Lead Full-Stack Developer
- **Pratik** - UI/UX Designer
- **Rishab** - Software Engineer
