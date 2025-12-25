const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    const uri = process.env.MONGO_URI;

    if (!uri) {
        throw new Error("❌ MONGO_URI is missing. MongoDB Atlas is REQUIRED on Vercel.");
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            bufferCommands: false,
        }).then((mongoose) => {
            return mongoose;
        });
    }

    cached.conn = await cached.promise;
    console.log("✅ MongoDB Atlas Connected");
    return cached.conn;
}

module.exports = connectDB;
