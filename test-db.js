const mongoose = require('mongoose');

const uri = "mongodb+srv://nishantkr238_db_user:5s7SALdZRLJan4Pj@cluster0.wcuoex3.mongodb.net/?appName=Cluster0";

mongoose.connect(uri)
    .then(() => {
        console.log("SUCCESS! Connected to DB.");
        process.exit(0);
    })
    .catch(err => {
        console.error("FAILED to connect to DB:", err.message);
        process.exit(1);
    });
