const mongoose = require('mongoose');
const { Resend } = require('resend');
const { EmailOTP } = require('../backend/models');
const connectDB = require('../backend/db');
const crypto = require('crypto');
const axios = require('axios');

// Initialize Resend (Runs once per Cold Start)
// This is safe to keep top-level as it doesn't IO, just config.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Helper: Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Hash OTP
function hashOTP(otp, salt) {
    return crypto.createHash('sha256').update(otp + salt).digest('hex');
}

// Helper: Send Email
// REFACTOR: This function is now fully independent of MongoDB.
// It relies only on Resend API.
async function sendEmail(email, otp) {
    console.log(`\nSending OTP to ${email}: ${otp}\n`);

    if (resend && process.env.RESEND_API_KEY) {
        try {
            const { data, error } = await resend.emails.send({
                from: 'AgriChain <noreply@agrichain.tech>',
                to: [email],
                subject: 'Your AgriChain Verification Code',
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <div style="background-color: #15201dff; padding: 32px 20px; text-align: center;">
                             <div style="font-size: 26px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 12px;">
                                <img src="https://agrichain.tech/logo.png" alt="AgriChain" style="height: 40px; width: auto; display: block;">
                                <span>
                                    <span style="color: #10b981;">AgriChain</span>
                                    <span style="color: #0ea5e9;">Insurance</span>
                                </span>
                             </div>
                        </div>
                        
                        <!-- Body -->
                        <div style="padding: 40px 32px; background-color: #ffffff;">
                            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Verification Code</h2>
                            <p style="color: #64748b; margin: 0 0 24px 0; font-size: 16px;">Your one-time verification code is:</p>
                            
                            <div style="background-color: #1e293b; color: #10b981; font-size: 32px; font-weight: bold; text-align: center; padding: 24px; border-radius: 8px; letter-spacing: 12px; margin-bottom: 24px;">
                                ${otp}
                            </div>
                            
                            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">This code expires in 5 minutes.</p>
                        </div>
                    </div>
                `
            });

            if (error) {
                console.error("Resend API returned error:", error);
                throw new Error(error.message);
            }

            console.log(`Email sent via Resend to ${email}`);
            return true;
        } catch (e) {
            console.error("Resend Execution Error:", e.message);
            // Critical fail: If we can't send email, we stop here.
            throw new Error("Failed to send email via Resend Provider");
        }
    } else {
        console.warn("Resend Not Configured. Check Console for OTP. (Dev Mode)");
        // In local dev without key, this counts as success so we can test DB flow
        return true;
    }
}

// Main Vercel Serverless Handler
module.exports = async (req, res) => {
    // 1. CORS & Methods
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
        // 2. Optional: Kickbox Verification (No DB dependency)
        if (process.env.KICKBOX_API_KEY) {
            try {
                const kRes = await axios.get(`https://api.kickbox.com/v2/verify?email=${encodeURIComponent(email)}&apikey=${process.env.KICKBOX_API_KEY}`);
                if (kRes.data.result === 'undeliverable') return res.status(400).json({ error: "Undeliverable Email" });
            } catch (kErr) {
                console.warn("Kickbox skipped due to error:", kErr.message);
            }
        }

        // 3. Generate Logic
        const otp = generateOTP();
        const salt = crypto.randomBytes(16).toString('hex');
        const hashedOTP = hashOTP(otp, salt);

        // 4. Send Email FIRST
        // CRITICAL: We attempt email delivery BEFORE any database connection.
        // This ensures bad DB config doesn't block email (though success requires both).
        await sendEmail(email, otp);

        // 5. Connect to MongoDB & Store
        try {
            console.log("Connecting to MongoDB to store OTP...");
            await connectDB(); // Utilizing cached connection pattern from backend/db.js

            // Store with Upsert (Update if exists, Insert if new)
            await EmailOTP.findOneAndUpdate(
                { email: email.toLowerCase() },
                {
                    hashedOTP,
                    salt,
                    attempts: 0,
                    createdAt: new Date() // Resets TTL
                },
                { upsert: true, new: true }
            );
            console.log("OTP stored in MongoDB");

        } catch (dbError) {
            console.error("CRITICAL: Email sent, but MongoDB storage failed:", dbError);
            // Scenario: User has OTP, but DB is down. 
            // We return 500 because the OTP is effectively invalid (cannot be verified).
            // Frontend should handle this instructions to User ("Service degraded, please try again").
            return res.status(500).json({
                error: "Service Warning: OTP Email sent, but verification system is temporarily unavailable. Please try again later.",
                details: dbError.message
            });
        }

        // 6. Return Success
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            expiresIn: 300
        });

    } catch (error) {
        console.error("Serverless OTP Internal Error:", error);
        return res.status(500).json({
            error: "Failed to send OTP",
            details: error.message
        });
    }
};
