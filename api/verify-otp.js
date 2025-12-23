const express = require('express');
const router = express.Router();
const {
    getOTPRecord, incrementAttempt, deleteOTP, MAX_ATTEMPTS
} = require('../utils/otp');

router.post('/', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const record = getOTPRecord(email);
    if (!record) return res.status(400).json({ error: 'No OTP found or already used' });

    if (Date.now() > record.expiresAt) {
        deleteOTP(email);
        return res.status(410).json({ error: 'OTP expired' });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
        deleteOTP(email);
        return res.status(429).json({ error: 'Maximum OTP attempts exceeded' });
    }

    if (record.otp !== otp) {
        incrementAttempt(email);
        return res.status(401).json({ error: 'Incorrect OTP' });
    }

    // Success: delete OTP (single-use)
    deleteOTP(email);
    res.json({ success: true });
});

module.exports = router;
