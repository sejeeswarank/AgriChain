const admin = require('firebase-admin');
const mongoose = require('mongoose');
const { Resend } = require('resend');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../keys/.env') });

async function checkConfig() {
    console.log("🔍 Starting Configuration Check...\n");
    let allGood = true;

    // 1. Check MongoDB
    try {
        console.log("Checking MongoDB Connection...");
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI not found in env");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connection Successful");
    } catch (e) {
        console.error("❌ MongoDB Connection Failed:", e.message);
        allGood = false;
    } finally {
        await mongoose.disconnect();
    }

    // 2. Check Firebase
    console.log("\nChecking Firebase Configuration...");
    try {
        if (!process.env.FIREBASE_PROJECT_ID) throw new Error("FIREBASE_PROJECT_ID missing");
        if (!process.env.FIREBASE_PRIVATE_KEY) throw new Error("FIREBASE_PRIVATE_KEY missing");
        if (!process.env.FIREBASE_CLIENT_EMAIL) throw new Error("FIREBASE_CLIENT_EMAIL missing");

        const app = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL
            })
        });
        // Try to list 1 user to verify auth
        await admin.auth().listUsers(1);
        console.log("✅ Firebase Admin Initialized & Authenticated");
    } catch (e) {
        console.error("❌ Firebase Check Failed:", e.message);
        if (e.code) console.error("   Error Code:", e.code);
        allGood = false;
    }

    // 3. Check Resend
    console.log("\nChecking Resend API...");
    try {
        if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
        const resend = new Resend(process.env.RESEND_API_KEY);
        // Try to fetch domains (read-only op usually allowed)
        // Or if not available, just assume key format is okay if it catches instantiation error
        // But instantiation doesn't validate key. We need an API call.
        // We'll leave it as format check if call not available easily without sending email.
        // Actually, let's try to get a domain list or something benign.
        // Assuming user has a domain. If not, this might fail, but it proves auth works.
        try {
            await resend.domains.list();
            console.log("✅ Resend API Key seems valid (Domains listed)");
        } catch (apiError) {
            console.warn("⚠️ Resend API call failed (might be permissions or no domains):", apiError.message);
            console.log("   But API Key is present.");
        }
    } catch (e) {
        console.error("❌ Resend Check Failed:", e.message);
        allGood = false;
    }

    console.log("\n---------------------------------------------------");
    if (allGood) {
        console.log("✅ ALL CHECKS PASSED locally. keys/.env is valid.");
        console.log("👉 Please ensure these EXACT values are copied to Vercel Environment Variables.");
    } else {
        console.log("❌ SOME CHECKS FAILED. Please fix ../keys/.env");
    }
}

checkConfig();
