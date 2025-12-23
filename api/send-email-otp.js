const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { Resend } = require('resend');
const {
    canRequestOTP, setRateLimit, storeOTP, OTP_EXPIRY_MS
} = require('../utils/otp');

const resend = new Resend('re_M84Ph2vj_MxQshsiZvx7vkHhu24jvij4S');

router.post('/', async (req, res) => {
    const { email, mobile } = req.body;
    let targetEmail = email;

    if (!email && !mobile) {
        return res.status(400).json({ error: 'Email or mobile required' });
    }

    // If mobile, fetch email from Firebase
    if (mobile && !email) {
        try {
            const user = await admin.auth().getUserByPhoneNumber(mobile);
            targetEmail = user.email;
            if (!targetEmail) throw new Error();
        } catch {
            return res.status(404).json({ error: 'Mobile not found or no email linked' });
        }
    }

    // Rate limit check
    if (!canRequestOTP(targetEmail)) {
        return res.status(429).json({ error: 'OTP recently sent. Please wait before requesting again.' });
    }

    // Generate and store OTP
    const otp = storeOTP(targetEmail);
    setRateLimit(targetEmail);

    // Send OTP email via Resend
    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: targetEmail,
            subject: 'Your AgriChain OTP Code',
            html: `
                <div style="font-family:sans-serif">
                  <h2>Your AgriChain OTP</h2>
                  <p style="font-size:2em;letter-spacing:0.2em;"><strong>${otp}</strong></p>
                  <p>This OTP is valid for 5 minutes. Do not share it with anyone.</p>
                  <p>If you did not request this OTP, please ignore this email.</p>
                </div>
            `
        });
        res.json({ success: true, message: 'OTP sent to email' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to send OTP email' });
    }
});

module.exports = router;
