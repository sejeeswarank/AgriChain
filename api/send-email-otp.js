const mongoose = require('mongoose');
const { Resend } = require('resend');
const { EmailOTP } = require('../backend/models');
const crypto = require('crypto');
const axios = require('axios');

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Reusable variables
let isConnected = false;

// 1. Database Connection (Cached)
async function connectDB() {
    if (isConnected) return;
    if (mongoose.connection.readyState === 1) {
        isConnected = true;
        return;
    }

    if (!process.env.MONGO_URI) {
        throw new Error("AgriChain Fatal: MONGO_URI is missing in production");
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        isConnected = true;
        console.log('MongoDB Connected (Serverless)');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        throw err;
    }
}

// 2. Helper: Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 3. Helper: Hash OTP
function hashOTP(otp, salt) {
    return crypto.createHash('sha256').update(otp + salt).digest('hex');
}

// 4. Helper: Send Email
async function sendEmail(email, otp) {
    console.log(`\n📧 Sending OTP to ${email}: ${otp}\n`);

    if (resend && process.env.RESEND_API_KEY) {
        try {
            const { data, error } = await resend.emails.send({
                from: 'AgriChain <noreply@agrichain.tech>',
                to: [email],
                subject: 'Your AgriChain Verification Code',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #1e293b;">Verification Code</h2>
                        <div style="background: #1e293b; color: #10b981; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            ${otp}
                        </div>
                        <p>Expires in 5 minutes.</p>
                    </div>
                `
            });
            if (error) throw new Error(error.message);
            console.log(`✅ Email sent via Resend to ${email}`);
            return true;
        } catch (e) {
            console.error("Resend Error:", e.message);
            throw new Error("Failed to send email via Resend Provider");
        }
    } else {
        console.log("⚠️ Resend Not Configured. Check Console for OTP.");
        return true; // Dev mode success
    }
}

// 5. Main Vercel Serverless Handler
module.exports = async (req, res) => {
    // Enable CORS for this function specifically (or rely on Vercel headers if configured, but better to be safe)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust for production if needed
    // Simple preflight handling
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        await connectDB();

        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });

        // Kickbox Verification (Optional - Copied from server.js for parity)
        if (process.env.KICKBOX_API_KEY) {
            try {
                const kRes = await axios.get(`https://api.kickbox.com/v2/verify?email=${encodeURIComponent(email)}&apikey=${process.env.KICKBOX_API_KEY}`);
                if (kRes.data.result === 'undeliverable') return res.status(400).json({ error: "Undeliverable Email" });
            } catch (kErr) { console.error("Kickbox skipped:", kErr.message); }
        }

        // Logic
        const otp = generateOTP();
        const salt = crypto.randomBytes(16).toString('hex');
        const hashedOTP = hashOTP(otp, salt);

        // Store
        await EmailOTP.findOneAndUpdate(
            { email: email.toLowerCase() },
            { hashedOTP, salt, attempts: 0, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // Send
        await sendEmail(email, otp);

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            expiresIn: 300
        });

    } catch (error) {
        console.error("Serverless OTP Error:", error);
        return res.status(500).json({
            error: "Failed to send OTP",
            details: error.message
        });
    }
};
