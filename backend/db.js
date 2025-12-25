const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
    if (isConnected || mongoose.connection.readyState === 1) {
        isConnected = true;
        return;
    }

    const uri = process.env.MONGO_URI;

    // Strict check for production
    if (!uri) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error("AgriChain Fatal: MONGO_URI is missing in Vercel Environment Variables");
        }
        console.warn("⚠️ MONGO_URI not found. Falling back to localhost for DEVELOPMENT only.");
    }

    const connectionString = uri || 'mongodb://localhost:27017/agrichain';

    try {
        await mongoose.connect(connectionString, {
            serverSelectionTimeoutMS: 5000,
            bufferCommands: false // Disable buffering for immediate feedback
        });
        isConnected = true;
        console.log(`MongoDB Connected to ${uri ? 'Atlas' : 'Localhost'}`);
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        throw err;
    }
}

module.exports = connectDB;
