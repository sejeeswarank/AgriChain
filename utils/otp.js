const crypto = require('crypto');

// In-memory OTP store (for production, use Redis or another external store)
const OTP_STORE = new Map();
const RATE_LIMIT = new Map();

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute between requests

function generateNumericOTP() {
    // Secure 6-digit numeric OTP
    return crypto.randomInt(100000, 1000000).toString();
}

function canRequestOTP(identifier) {
    const lastRequest = RATE_LIMIT.get(identifier);
    if (!lastRequest) return true;
    return Date.now() - lastRequest > RATE_LIMIT_WINDOW_MS;
}

function setRateLimit(identifier) {
    RATE_LIMIT.set(identifier, Date.now());
}

function storeOTP(email) {
    const otp = generateNumericOTP();
    OTP_STORE.set(email, {
        otp,
        expiresAt: Date.now() + OTP_EXPIRY_MS,
        attempts: 0
    });
    return otp;
}

function getOTPRecord(email) {
    return OTP_STORE.get(email);
}

function incrementAttempt(email) {
    const record = OTP_STORE.get(email);
    if (record) {
        record.attempts += 1;
        OTP_STORE.set(email, record);
    }
}

function deleteOTP(email) {
    OTP_STORE.delete(email);
}

module.exports = {
    canRequestOTP,
    setRateLimit,
    storeOTP,
    getOTPRecord,
    incrementAttempt,
    deleteOTP,
    OTP_EXPIRY_MS,
    MAX_ATTEMPTS
};
