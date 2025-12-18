const mongoose = require('mongoose');

const PolicySchema = new mongoose.Schema({
    policyId: { type: Number, unique: true },
    farmer: { type: String, required: true, index: true },
    indexId: { type: String, required: true },
    threshold: Number,
    premium: String,
    startTimestamp: Number,
    endTimestamp: Number,
    active: { type: Boolean, default: true },
    paidOut: { type: Boolean, default: false },
    txHash: String,
    createdAt: { type: Date, default: Date.now }
});

const OracleReportSchema = new mongoose.Schema({
    indexId: String,
    rainfall: Number,
    timestamp: Number,
    signature: String,
    txHash: String
});

const PayoutSchema = new mongoose.Schema({
    policyId: Number,
    farmer: String,
    amount: String,
    txHash: String,
    timestamp: { type: Date, default: Date.now }
});

// Email OTP Schema for serverless persistence
const EmailOTPSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    hashedOTP: { type: String, required: true },
    salt: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, expires: 300 } // Auto-delete after 5 minutes (TTL index)
});

module.exports = {
    Policy: mongoose.model('Policy', PolicySchema),
    OracleReport: mongoose.model('OracleReport', OracleReportSchema),
    Payout: mongoose.model('Payout', PayoutSchema),
    EmailOTP: mongoose.model('EmailOTP', EmailOTPSchema)
};
