const mongoose = require('mongoose');
const { Resend } = require('resend');
const { EmailOTP } = require('../backend/models');
const connectDB = require('../backend/db');
const crypto = require('node:crypto');
const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Resend (Runs once per Cold Start)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Initialize Firebase Admin (Runs once per Cold Start)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replaceAll(String.raw`\n`, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL
            })
        });
        console.log("Firebase Admin Initialized");
    } catch (error) {
        console.error("Firebase Admin Init Error:", error.message);
    }
}

// Helper: Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Hash OTP
function hashOTP(otp, salt) {
    return crypto.createHash('sha256').update(otp + salt).digest('hex');
}

// Helper: Send Email
async function sendEmail(email, otp) {
    console.log(`\nSending OTP to ${email}: ${otp}\n`);

    if (resend && process.env.RESEND_API_KEY) {
        try {
            const { error } = await resend.emails.send({
                from: 'AgriChain <noreply@agrichain.tech>',
                to: [email],
                subject: 'Your AgriChain Verification Code',
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <div style="background-color: #1e293bff; padding: 32px 20px; text-align: center;">
                             <div style="font-size: 26px; font-weight: bold; display: flex; align-items: center; justify-content: center;">
                                <img src="https://agrichain.tech/logo.png" alt="AgriChain" style="height: 48px; width: auto; display: block; margin-right: 16px;">
                                <span style="color: #10b981; font-weight: bold;">AgriChain Insurance</span>
                             </div>
                        </div>
                        
                        <!-- Body -->
                        <div style="padding: 40px 32px; background-color: #ebebebff;">
                            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Verification Code</h2>
                            <p style="color: #64748b; margin: 0 0 24px 0; font-size: 16px;">Your one-time verification code is:</p>
                            
                            <div style="background-color: #25b688ff; color: #fefefeff; font-size: 32px; font-weight: bold; text-align: center; padding: 24px; border-radius: 8px; letter-spacing: 12px; margin-bottom: 24px;">
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
            throw new Error("Failed to send email via Resend Provider");
        }
    } else {
        console.warn("Resend Not Configured. Check Console for OTP. (Dev Mode)");
        return true;
    }
}

// Helper: Verify Kickbox
async function verifyKickbox(email) {
    if (process.env.KICKBOX_API_KEY) {
        try {
            const kRes = await axios.get(`https://api.kickbox.com/v2/verify?email=${encodeURIComponent(email)}&apikey=${process.env.KICKBOX_API_KEY}`);
            if (kRes.data.result === 'undeliverable') return false;
        } catch (error_) {
            console.warn("Kickbox skipped due to error:", error_.message);
        }
    }
    return true;
}

// Main Vercel Serverless Handler
const sendEmailOtpHandler = async (req, res) => {
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

    const { email, purpose } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
        // 2. CHECK USER EXISTENCE (Login Flow Only)
        if (purpose === 'login') {
            try {
                // Determine if configured (Skip if dev/missing keys)
                if (admin.apps.length) {
                    await admin.auth().getUserByEmail(email.toLowerCase());
                    console.log(`User exists: ${email}`);
                } else {
                    console.warn("Firebase Admin not configured, skipping user check.");
                }
            } catch (error) {
                if (error.code === 'auth/user-not-found') {
                    console.warn(`Login attempt for non-existent user: ${email}`);
                    return res.status(404).json({
                        error: "No account found with this email address. Please sign up first."
                    });
                }
                console.error("Error checking user existence:", error);
                // On system error, we might choose to fail open or closed. 
                // Failing open (allowing OTP) is safer for UX if Firebase Admin is just misconfigured temporarily.
            }
        }

        // 3. Optional: Kickbox Verification
        const isDeliverable = await verifyKickbox(email);
        if (!isDeliverable) {
            return res.status(400).json({ error: "Undeliverable Email" });
        }

        // 4. Generate Logic
        const otp = generateOTP();
        const salt = crypto.randomBytes(16).toString('hex');
        const hashedOTP = hashOTP(otp, salt);

        // 5. Send Email FIRST
        await sendEmail(email, otp);

        // 6. Connect to MongoDB & Store
        try {
            console.log("Connecting to MongoDB to store OTP...");
            await connectDB();

            await EmailOTP.findOneAndUpdate(
                { email: email.toLowerCase() },
                {
                    hashedOTP,
                    salt,
                    attempts: 0,
                    createdAt: new Date()
                },
                { upsert: true, new: true }
            );
            console.log("OTP stored in MongoDB");

        } catch (dbError) {
            console.error("CRITICAL: Email sent, but MongoDB storage failed:", dbError);
            return res.status(500).json({
                error: "Service Warning: OTP Email sent, but verification system is temporarily unavailable. Please try again later.",
                details: dbError.message
            });
        }

        // 7. Return Success
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

module.exports = sendEmailOtpHandler;
