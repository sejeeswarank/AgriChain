const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { getOTPRecord } = require('../utils/otp');

router.post('/', async (req, res) => {
    const { name, email, mobile, password, otp } = req.body;
    if (!name || !email || !mobile || !password || !otp) {
        return res.status(400).json({ error: 'All fields and OTP required' });
    }

    // OTP must be verified first
    const record = getOTPRecord(email);
    if (record) return res.status(400).json({ error: 'OTP not verified yet' });

    // Check uniqueness
    try {
        await admin.auth().getUserByEmail(email);
        return res.status(409).json({ error: 'Email already exists' });
    } catch {}
    try {
        await admin.auth().getUserByPhoneNumber(mobile);
        return res.status(409).json({ error: 'Mobile already exists' });
    } catch {}

    // Create user in Firebase Auth
    try {
        const userRecord = await admin.auth().createUser({
            email,
            phoneNumber: mobile,
            password,
            displayName: name
        });
        // Store profile in Firestore
        await admin.firestore().collection('users').doc(userRecord.uid).set({
            name,
            email,
            mobile,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ success: true, uid: userRecord.uid });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

module.exports = router;
