require('dotenv').config({ path: '../keys/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ethers } = require('ethers');
const { Policy, OracleReport, Payout } = require('./models');

const CONTRACT_ABI = require('./abis/AgriChainPolicy.json').abi;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/agrichain')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Error:', err));

const provider = new ethers.JsonRpcProvider(RPC_URL);
let contract;

if (CONTRACT_ADDRESS) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    console.log(`Listening for events on ${CONTRACT_ADDRESS}...`);

    contract.on("PolicyCreated", async (policyId, farmer, indexId, threshold, premium, event) => {
        console.log(`New Policy: ${policyId}`);
        try {
            await Policy.create({
                policyId: Number(policyId),
                farmer: farmer,
                indexId: indexId,
                threshold: Number(threshold),
                premium: premium.toString(),
                txHash: event.log.transactionHash
            });
        } catch (e) { console.error("Error saving policy:", e); }
    });

    contract.on("PayoutExecuted", async (policyId, farmer, amount, event) => {
        console.log(`Payout: ${policyId}`);
        try {
            await Payout.create({
                policyId: Number(policyId),
                farmer: farmer,
                amount: amount.toString(),
                txHash: event.log.transactionHash
            });
            await Policy.updateOne({ policyId: Number(policyId) }, { active: false, paidOut: true });
        } catch (e) { console.error("Error saving payout:", e); }
    });

    contract.on("OracleReportReceived", async (indexId, rainfall, timestamp, event) => {
        try {
            await OracleReport.create({
                indexId: indexId,
                rainfall: Number(rainfall),
                timestamp: Number(timestamp),
                txHash: event.log.transactionHash
            });
        } catch (e) { console.error("Error saving oracle report:", e); }
    });
} else {
    console.log("CONTRACT_ADDRESS not set, event listener disabled.");
}

app.get('/', (req, res) => res.send('AgriChain Backend Running'));

app.get('/api/policies/:farmer', async (req, res) => {
    try {
        const policies = await Policy.find({ farmer: req.params.farmer });
        res.json(policies);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/policies', async (req, res) => {
    try {
        const { policyId, farmer, indexId, threshold, premium, startTimestamp, endTimestamp, txHash } = req.body;
        const policy = await Policy.findOneAndUpdate(
            { policyId },
            { farmer, indexId, threshold, premium, startTimestamp, endTimestamp, txHash, active: true, paidOut: false },
            { upsert: true, new: true }
        );
        res.json(policy);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/payouts/:farmer', async (req, res) => {
    const payouts = await Payout.find({ farmer: req.params.farmer });
    res.json(payouts);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
