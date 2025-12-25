const admin = require('firebase-admin');

// Initialize Firebase Admin (Vercel env vars)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        })
    });
}

// Load env only in development (Vercel uses its own env vars)
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: require('path').join(__dirname, '../keys/.env') });
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ethers } = require('ethers');
const axios = require('axios');
const { Policy, OracleReport, Payout, EmailOTP, MobileOTP } = require('./models');

const CONTRACT_ABI = require('./abis/AgriChainPolicy.json');
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";

// MongoDB connection function for serverless (per-request)
async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        return;
    }
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/agrichain');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Error:', err);
        throw err;
    }
}

const app = express();
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'https://agrichain.tech',
        'https://www.agrichain.tech',
        'https://agrichain-mu.vercel.app',
        'https://*.vercel.app' // Allow Vercel preview/production domains
    ],
    credentials: true
}));
app.use(express.json());

// Note: Ethers event listeners disabled for Vercel serverless (stateless; run separately for production events)
// Uncomment for local/dev with persistent server
/*
const provider = new ethers.JsonRpcProvider(RPC_URL);
let contract;

if (CONTRACT_ADDRESS) {
    try {
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        console.log(`Listening for events on ${CONTRACT_ADDRESS}...`);

        contract.on("PolicyCreated", async (policyId, farmer, indexId, threshold, premium, event) => {
            console.log(`New Policy: ${policyId}`);
            try {
                await connectDB();
                await Policy.create({
                    policyId: Number(policyId),
                    farmer: farmer,
                    indexId: indexId,
                    threshold: Number(threshold),
                    premium: premium.toString(),
                    txHash: event.log.transactionHash
                });
            } catch (e) { console.error("Error saving policy:", e); }
        });

        contract.on("PayoutExecuted", async (policyId, farmer, amount, event) => {
            console.log(`Payout: ${policyId}`);
            try {
                await connectDB();
                await Payout.create({
                    policyId: Number(policyId),
                    farmer: farmer,
                    amount: amount.toString(),
                    txHash: event.log.transactionHash
                });
                await Policy.updateOne({ policyId: Number(policyId) }, { active: false, paidOut: true });
            } catch (e) { console.error("Error saving payout:", e); }
        });

        contract.on("OracleReportReceived", async (indexId, rainfall, timestamp, event) => {
            try {
                await connectDB();
                await OracleReport.create({
                    indexId: indexId,
                    rainfall: Number(rainfall),
                    timestamp: Number(timestamp),
                    txHash: event.log.transactionHash
                });
            } catch (e) { console.error("Error saving oracle report:", e); }
        });
    } catch (error) {
        console.log("Blockchain connection failed, event listeners disabled:", error.message);
    }
} else {
    console.log("CONTRACT_ADDRESS not set, event listener disabled.");
}
*/

app.get('/', (req, res) => res.send('AgriChain Backend Running'));

app.get('/api/policies/:farmer', async (req, res) => {
    try {
        // Case-insensitive search for the farmer's address
        const farmerAddress = req.params.farmer;
        const policies = await Policy.find({
            farmer: { $regex: new RegExp(`^${farmerAddress}$`, 'i') }
        });
        res.json(policies);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/policies', async (req, res) => {
    try {
        const { policyId, farmer, indexId, threshold, premium, startTimestamp, endTimestamp, txHash } = req.body;
        const policy = await Policy.findOneAndUpdate(
            { policyId },
            { farmer, indexId, threshold, premium, startTimestamp, endTimestamp, txHash, active: true, paidOut: false },
            { upsert: true, new: true }
        );
        res.json(policy);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/payouts/:farmer', async (req, res) => {
    const payouts = await Payout.find({ farmer: req.params.farmer });
    res.json(payouts);
});

// 5. Active Policies for Oracle
app.get('/api/active-policies', async (req, res) => {
    try {
        const policies = await Policy.find({ active: true });
        res.json(policies);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Advanced Features Endpoints ---

// 1. Geocoding (OpenStreetMap Nominatim)
app.get('/api/geocode', async (req, res) => {
    const { location } = req.query;
    if (!location) return res.status(400).json({ error: "Location required" });

    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: { q: location, format: 'json', limit: 1 },
            headers: { 'User-Agent': 'AgriChain/1.0' }
        });
        if (response.data && response.data.length > 0) {
            res.json(response.data[0]);
        } else {
            res.status(404).json({ error: "Location not found" });
        }
    } catch (error) {
        console.error("Geocode Error:", error.message);
        res.status(500).json({ error: "Failed to fetch location" });
    }
});

// 2. Historical Rainfall (Open-Meteo)
app.get('/api/historical-rainfall', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Lat/Lon required" });

    try {
        // Fetch last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);

        const formatDate = (date) => date.toISOString().split('T')[0];

        const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
            params: {
                latitude: lat,
                longitude: lon,
                start_date: formatDate(startDate),
                end_date: formatDate(endDate),
                daily: 'rain_sum',
                timezone: 'auto'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Weather Error:", error.message);
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
});

// 3. ETH Price (CoinGecko)
app.get('/api/eth-price', async (req, res) => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,inr');
        res.json(response.data.ethereum);
    } catch (error) {
        console.error("Price Error:", error.message);
        res.status(500).json({ error: "Failed to fetch ETH price" });
    }
});

// 4. Policy Recommendation Engine
app.post('/api/recommend-policy', async (req, res) => {
    const { lat, lon } = req.body;
    if (!lat || !lon) return res.status(400).json({ error: "Lat/Lon required" });

    try {
        // 1. Fetch Historical Data (Last 60 days for better trend)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 60);
        const formatDate = (date) => date.toISOString().split('T')[0];

        const weatherRes = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
            params: {
                latitude: lat,
                longitude: lon,
                start_date: formatDate(startDate),
                end_date: formatDate(endDate),
                daily: 'rain_sum',
                timezone: 'auto'
            }
        });

        const rainData = weatherRes.data.daily.rain_sum || [];

        // 2. Calculate Stats
        const totalRainfall = rainData.reduce((a, b) => a + b, 0);
        const avgRainfall = totalRainfall / rainData.length;
        const dryDays = rainData.filter(r => r < 1.0).length;

        // 3. Determine Risk & Policy
        let riskLevel = "Low";
        let suggestedThreshold = 50; // default mm
        let suggestedPremiumETH = "0.001";
        let reason = "Normal rainfall patterns detected.";

        if (avgRainfall < 2.0 || dryDays > 45) {
            riskLevel = "High";
            suggestedThreshold = 10;
            suggestedPremiumUSD = 50; // $50 for high risk
            reason = "High drought risk! 60-day rainfall is critically low.";
        } else if (avgRainfall < 5.0) {
            riskLevel = "Medium";
            suggestedThreshold = 30;
            suggestedPremiumUSD = 20; // $20 for medium
            reason = "Moderate rainfall. Standard drought protection recommended.";
        } else {
            suggestedPremiumUSD = 10; // $10 for low risk
        }

        res.json({
            riskLevel,
            suggestedThreshold,
            suggestedDuration: 30,
            suggestedPremiumUSD, // Sending USD now
            reason,
            stats: {
                avgRainfall: avgRainfall.toFixed(2),
                totalRainfall: totalRainfall.toFixed(1),
                dryDays
            }
        });

    } catch (error) {
        console.error("Recommendation Error:", error.message);
        res.status(500).json({ error: "Failed to generate recommendation" });
    }
});

// Mobile OTP Verification Endpoints

// MongoDB storage for Mobile OTPs (serverless compatible)

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash OTP with salt for security
function hashOTP(otp, salt) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(otp + salt).digest('hex');
}

// Mock SMS sending (replace with real SMS gateway like MSG91, Twilio, etc.)
async function sendSMS(phoneNumber, otp) {
    // In production, integrate with SMS gateway
    console.log(`📱 SMS sent to ${phoneNumber}: Your AgriChain OTP is: ${otp}`);
    console.log(`🔒 OTP will expire in 5 minutes`);

    // For demo purposes, we'll log the OTP so you can see it
    console.log(`🎯 Demo OTP: ${otp} (use this in the app)`);

    return true;
}

// Send OTP
app.post('/api/send-otp', async (req, res) => {
    await connectDB();
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number required" });
    }

    // Validate phone number format (Indian mobile numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ error: "Invalid phone number format" });
    }

    try {
        // Generate OTP
        const otp = generateOTP();
        const salt = require('crypto').randomBytes(16).toString('hex');
        const hashedOTP = hashOTP(otp, salt);

        // Store OTP in MongoDB (TTL handles expiry)
        await MobileOTP.findOneAndUpdate(
            { phoneNumber },
            { hashedOTP, salt, attempts: 0, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // Send SMS
        await sendSMS(phoneNumber, otp);

        console.log(`✅ OTP sent to +91${phoneNumber}`);

        res.json({
            success: true,
            message: "OTP sent successfully to your mobile number",
            expiresIn: 300 // 5 minutes
        });

    } catch (error) {
        console.error("Send OTP Error:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

// Verify OTP and Generate Mobile VC
app.post('/api/verify-mobile', async (req, res) => {
    await connectDB();
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(400).json({ error: "Phone number and OTP required" });
    }

    // Check if OTP exists for this phone number
    const otpData = await MobileOTP.findOne({ phoneNumber });
    if (!otpData) {
        return res.status(400).json({ error: "No OTP found. Please request a new OTP." });
    }

    // Check attempts (max 3)
    if (otpData.attempts >= 3) {
        await MobileOTP.deleteOne({ phoneNumber });
        return res.status(400).json({ error: "Too many failed attempts. Please request a new OTP." });
    }

    // Verify OTP
    const hashedInputOTP = hashOTP(otp, otpData.salt);
    if (hashedInputOTP !== otpData.hashedOTP) {
        await MobileOTP.updateOne({ phoneNumber }, { $inc: { attempts: 1 } });
        return res.status(400).json({ error: "Invalid OTP. Please try again." });
    }

    try {
        // OTP verified successfully
        await MobileOTP.deleteOne({ phoneNumber }); // Clean up

        // Generate Mobile VC (without wallet, will be added when connecting wallet)
        const vc = {
            mobileVerified: true,
            mobileHash: require('crypto').createHash('sha256').update(`+91${phoneNumber}`).digest('hex'),
            issuedAt: Math.floor(Date.now() / 1000),
            expiry: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
            issuer: "AgriChain",
            nonce: require('crypto').randomUUID()
        };

        // Compute vcHash
        const crypto = require('crypto');
        const canonicalJson = JSON.stringify(vc);
        const vcHash = '0x' + crypto.createHash('sha256').update(canonicalJson).digest('hex');

        // Mock signature (in production, use KMS)
        const signature = '0x' + crypto.randomBytes(65).toString('hex');

        console.log(`✅ Mobile verification successful for phone: +91${phoneNumber}`);

        res.json({
            vc,
            vcHash,
            signature,
            issuer: process.env.ISSUER_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            success: true,
            message: "Mobile number verified successfully!"
        });

    } catch (error) {
        console.error("Verify Mobile Error:", error);
        res.status(500).json({ error: "Verification failed" });
    }
});


// ==========================================
// EMAIL OTP VERIFICATION ENDPOINTS
// ==========================================

// Using MongoDB for Email OTP storage (required for Vercel serverless)

// Initialize Resend for email sending
const { Resend } = require('resend');
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Send Email OTP using Resend API
async function sendEmailOTP(email, otp) {
    // Always log to console for debugging
    console.log(`\n📧 ==========================================`);
    console.log(`📧 EMAIL OTP SENT TO: ${email}`);
    console.log(`📧 YOUR OTP CODE IS: ${otp}`);
    console.log(`📧 OTP expires in 5 minutes`);
    console.log(`📧 ==========================================\n`);

    // If Resend API key is configured, send real email
    if (resend && process.env.RESEND_API_KEY) {
        try {
            const { data, error } = await resend.emails.send({
                from: 'AgriChain <noreply@agrichain.tech>',
                to: [email],
                subject: 'Your AgriChain Verification Code',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0;">🌾 AgriChain Insurance</h1>
                        </div>
                        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
                            <h2 style="color: #1e293b;">Verification Code</h2>
                            <p style="color: #64748b;">Your one-time verification code is:</p>
                            <div style="background: #1e293b; color: #10b981; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
                                ${otp}
                            </div>
                            <p style="color: #64748b;">This code expires in <strong>5 minutes</strong>.</p>
                            <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
                        </div>
                    </div>
                `
            });

            if (error) {
                console.error('Resend error:', error);
                throw new Error(`Failed to send email: ${error.message}`);
            } else {
                console.log(`Real email sent to ${email} via Resend`);
            }
        } catch (error) {
            console.error('Email sending failed:', error.message);
            throw new Error('Failed to send verification email. Please try again.');
        }
    } else {
        console.log('Resend API not configured. Using console OTP only.');
    }

    return true;
}

// Send Email OTP endpoint
app.post('/api/send-email-otp', async (req, res) => {
    await connectDB();
    const { email, purpose } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email address required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    // For login purpose, check if user exists in Firebase Auth
    if (purpose === 'login') {
        try {
            await admin.auth().getUserByEmail(email.toLowerCase());
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                return res.status(404).json({ error: "No account found with this email address. Please sign up first." });
            }
            console.error("Error checking user existence:", error);
            // Don't block login on other errors, but log them
        }
    }

    try {
        // Verify email with Kickbox (if configured)
        if (process.env.KICKBOX_API_KEY) {
            try {
                const kickboxResponse = await axios.get(
                    `https://api.kickbox.com/v2/verify?email=${encodeURIComponent(email)}&apikey=${process.env.KICKBOX_API_KEY}`
                );

                const { result, reason } = kickboxResponse.data;
                console.log(`Kickbox verification for ${email}: ${result} (${reason})`);

                // Reject undeliverable or risky emails
                if (result === 'undeliverable') {
                    return res.status(400).json({
                        error: "This email address appears to be invalid or undeliverable. Please use a valid email.",
                        kickboxResult: result
                    });
                }

                if (result === 'risky' && reason === 'disposable') {
                    return res.status(400).json({
                        error: "Disposable email addresses are not allowed. Please use a permanent email.",
                        kickboxResult: result
                    });
                }
            } catch (kickboxError) {
                console.error('Kickbox verification error:', kickboxError.message);
                // Continue anyway if Kickbox fails (don't block user)
            }
        }

        // Generate OTP
        const otp = generateOTP();
        const salt = require('crypto').randomBytes(16).toString('hex');
        const hashedOTP = hashOTP(otp, salt);

        // Store OTP in MongoDB (TTL index handles expiry)
        await EmailOTP.findOneAndUpdate(
            { email: email.toLowerCase() },
            { hashedOTP, salt, attempts: 0, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // Send Email OTP
        await sendEmailOTP(email, otp);

        console.log(`Email OTP sent to ${email}`);

        res.json({
            success: true,
            message: "OTP sent successfully to your email address",
            expiresIn: 300 // 5 minutes
        });

    } catch (error) {
        console.error("Send Email OTP Error:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

// Verify Email OTP endpoint
app.post('/api/verify-email-otp', async (req, res) => {
    await connectDB();
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP required" });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if OTP exists for this email
    const otpData = await EmailOTP.findOne({ email: normalizedEmail });
    if (!otpData) {
        return res.status(400).json({ error: "No OTP found. Please request a new OTP." });
    }

    // Check attempts (max 3)
    if (otpData.attempts >= 3) {
        await EmailOTP.deleteOne({ email: normalizedEmail });
        return res.status(400).json({ error: "Too many failed attempts. Please request a new OTP." });
    }

    // Verify OTP
    const hashedInputOTP = hashOTP(otp, otpData.salt);
    if (hashedInputOTP !== otpData.hashedOTP) {
        await EmailOTP.updateOne({ email: normalizedEmail }, { $inc: { attempts: 1 } });
        return res.status(400).json({ error: "Invalid OTP. Please try again." });
    }

    try {
        // OTP verified successfully
        await EmailOTP.deleteOne({ email: normalizedEmail }); // Clean up

        console.log(`Email OTP verification successful for: ${email}`);

        res.json({
            success: true,
            message: "Email verified successfully!",
            email: normalizedEmail
        });

    } catch (error) {
        console.error("Verify Email OTP Error:", error);
        res.status(500).json({ error: "Verification failed" });
    }
});

const PORT = process.env.PORT || 5000;

// Only start the server if this file is run directly (not imported)
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
