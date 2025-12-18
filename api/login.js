const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { getOTPRecord } = require('../utils/otp');

router.post('/', async (req, res) => {
    const { email, mobile, otp } = req.body;
    let targetEmail = email;

    if (!email && !mobile) return res.status(400).json({ error: 'Email or mobile required' });

    // If mobile, fetch email
    if (mobile && !email) {
        try {
            const user = await admin.auth().getUserByPhoneNumber(mobile);
            targetEmail = user.email;
            if (!targetEmail) throw new Error();
        } catch {
            return res.status(404).json({ error: 'Mobile not found or no email linked' });
        }
    }

    // OTP must be verified first
    const record = getOTPRecord(targetEmail);
    if (record) return res.status(400).json({ error: 'OTP not verified yet' });

    // Authenticate user (session logic handled elsewhere)
    try {
        const user = await admin.auth().getUserByEmail(targetEmail);
        res.json({ success: true, uid: user.uid });
    } catch {
        res.status(404).json({ error: 'User not found' });
    }
});

module.exports = router;
