require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Tell Express to trust Render's reverse proxy (fixes rate-limiter bugs)
app.set('trust proxy', 1);

// Allow CORS for the Netlify frontend and Localhost
const allowedOrigins = [
    'http://localhost:3000', 
    'http://127.0.0.1:5500', 
    'http://localhost:5500', 
    'https://graceful-treacle-8cb142.netlify.app',
    'https://nimbus-w3fa.onrender.com'
];
app.use(cors({
    origin: function(origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if(!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error(`Blocked by CORS: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json());

// Serve the frontend static files (only relevant for local testing now)
app.use(express.static(__dirname));

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('Connected to MongoDB successfully!'))
        .catch((err) => console.error('MongoDB connection error:', err));
} else {
    console.warn('MONGO_URI is not set in environment. Database connection skipped.');
}

// Define Subscriber Schema
const subscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    city: { type: String, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
});

const Subscriber = mongoose.model('Subscriber', subscriberSchema);

// Rate limiter for subscriptions (Max 5 requests per 15 minutes per IP)
const subscribeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5,
    message: { error: 'Too many subscription requests from this IP, please try again later.' }
});

// API Endpoint to Subscribe
app.post('/api/subscribe', subscribeLimiter, async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(500).json({ error: 'Database connection is not available. Please check environment variables.' });
    }

    const { email, city } = req.body;
    if (!email || !city) {
        return res.status(400).json({ error: 'Email and city are required' });
    }
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    try {
        // Geocode the city using Open-Meteo
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            return res.status(400).json({ error: 'City not found' });
        }

        const exactCity = geoData.results[0].name;
        const lat = geoData.results[0].latitude;
        const lon = geoData.results[0].longitude;

        // Add or update subscriber in DB
        await Subscriber.findOneAndUpdate(
            { email }, 
            { city: exactCity, lat, lon }, 
            { upsert: true, returnDocument: 'after' }
        );
        
        // Send an immediate welcome email
        sendWelcomeEmail(email, exactCity, lat, lon).catch(console.error);
        
        res.status(200).json({ message: 'Successfully subscribed!', city: exactCity });
    } catch (err) {
        console.error('Error in subscription:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API Endpoint to Unsubscribe
app.get('/api/unsubscribe', async (req, res) => {
    const email = req.query.email;
    if (!email) {
        return res.status(400).send('Email is required');
    }
    if (mongoose.connection.readyState !== 1) {
        return res.status(500).send('Database connection error. Try later.');
    }
    try {
        await Subscriber.findOneAndDelete({ email });
        res.send(`<h1>Unsubscribed</h1><p>You have successfully unsubscribed <b>${email}</b> from Nimbus weather reports.</p>`);
    } catch(err) {
        res.status(500).send('Error processing unsubscribe request.');
    }
});

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send a welcome email
const sendWelcomeEmail = async (email, city, lat, lon) => {
    try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherData = await weatherRes.json();
        
        let temp = 'N/A';
        if (weatherData && weatherData.current_weather) {
            temp = weatherData.current_weather.temperature;
        } else {
            console.warn(`Open-Meteo error for Welcome Email:`, weatherData);
        }
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Welcome to Nimbus Weather! - ${city}`,
            html: `
                <h2>Welcome to Nimbus!</h2>
                <p>You have successfully subscribed to daily weather updates for <strong>${city}</strong>.</p>
                <h3>Current Temperature: ${temp}°C</h3>
                <p>You will now receive a weather report every day at 8 AM.</p>
                <br/>
                <small>Sent from your Nimbus Weather App</small>
                <br/>
                <small><a href="https://nimbus-w3fa.onrender.com/api/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe from daily reports</a></small>
            `
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
            console.log(`Welcome email sent to ${email}`);
        } else {
            console.log(`Mock send: Would send welcome email to ${email} (${temp}°C in ${city})`);
        }
    } catch (error) {
        console.error(`Failed to send welcome email to ${email}:`, error);
    }
};

// Function to send reports
const sendDailyReports = async () => {
    console.log('Running weather report job...');
    
    try {
        const subscribers = await Subscriber.find({});

        for (const sub of subscribers) {
            try {
                // Fetch weather from open-meteo
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${sub.lat}&longitude=${sub.lon}&current_weather=true`);
                const weatherData = await weatherRes.json();
                
                let temp = 'N/A';
                if (weatherData && weatherData.current_weather) {
                    temp = weatherData.current_weather.temperature;
                } else {
                    console.warn(`Open-Meteo error for ${sub.email}:`, weatherData);
                }
                
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: sub.email,
                    subject: `Daily Weather Report for ${sub.city} - Nimbus`,
                    html: `
                        <h2>Good Morning!</h2>
                        <p>Here is your daily weather update for <strong>${sub.city}</strong>.</p>
                        <h3>Current Temperature: ${temp}°C</h3>
                        <p>Stay prepared and have a great day!</p>
                        <br/>
                        <small>Sent from your Nimbus Weather App</small>
                        <br/>
                        <small><a href="https://nimbus-w3fa.onrender.com/api/unsubscribe?email=${encodeURIComponent(sub.email)}">Unsubscribe from daily reports</a></small>
                    `
                };

                if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                    await transporter.sendMail(mailOptions);
                    console.log(`Email sent to ${sub.email}`);
                } else {
                    console.log(`Mock send: Would send email to ${sub.email} (${temp}°C in ${sub.city})`);
                }
            } catch (error) {
                console.error(`Failed to generate/send report to ${sub.email}:`, error);
            }
        }
    } catch (err) {
        console.error('Failed to fetch subscribers from DB:', err);
    }
};

// Daily Job at 8 AM
cron.schedule('0 8 * * *', sendDailyReports);

// Middleware to verify CRON API Key
const requireCronKey = (req, res, next) => {
    if (!process.env.CRON_SECRET_KEY || req.query.key !== process.env.CRON_SECRET_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
    next();
};

// API Endpoint to Manually Trigger Emails (For Testing or External Cron)
app.post('/api/send-now', requireCronKey, (req, res) => {
    // Trigger in the background so cron-job doesn't timeout
    sendDailyReports().catch(err => console.error('Background report failure:', err));
    res.status(200).json({ message: 'Reports are being sent out in the background!' });
});

// GET version for easier external triggering (e.g., cron-job.org or UptimeRobot)
app.get('/api/send-now', requireCronKey, (req, res) => {
    // Trigger in the background so cron-job doesn't timeout
    sendDailyReports().catch(err => console.error('Background report failure:', err));
    res.status(200).json({ message: 'Reports are being sent out in the background!' });
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Make sure to set EMAIL_USER and EMAIL_PASS in your .env file to enable actual emails.`);
});
