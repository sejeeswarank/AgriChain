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

module.exports = {
    Policy: mongoose.model('Policy', PolicySchema),
    OracleReport: mongoose.model('OracleReport', OracleReportSchema),
    Payout: mongoose.model('Payout', PayoutSchema)
};
