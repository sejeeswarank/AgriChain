require('dotenv').config({ path: '../keys/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ethers } = require('ethers');
const axios = require('axios');
const { Policy, OracleReport, Payout } = require('./models');

const CONTRACT_ABI = require('./abis/AgriChainPolicy.json');
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

// 5. Active Policies for Oracle
app.get('/api/active-policies', async (req, res) => {
    try {
        const policies = await Policy.find({ active: true });
        res.json(policies);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Advanced Features Endpoints ---

// 1. Geocoding (OpenStreetMap Nominatim)
app.get('/api/geocode', async (req, res) => {
    const { location } = req.query;
    if (!location) return res.status(400).json({ error: "Location required" });

    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: { q: location, format: 'json', limit: 1 },
            headers: { 'User-Agent': 'AgriChain/1.0' }
        });
        if (response.data && response.data.length > 0) {
            res.json(response.data[0]);
        } else {
            res.status(404).json({ error: "Location not found" });
        }
    } catch (error) {
        console.error("Geocode Error:", error.message);
        res.status(500).json({ error: "Failed to fetch location" });
    }
});

// 2. Historical Rainfall (Open-Meteo)
app.get('/api/historical-rainfall', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Lat/Lon required" });

    try {
        // Fetch last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);

        const formatDate = (date) => date.toISOString().split('T')[0];

        const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
            params: {
                latitude: lat,
                longitude: lon,
                start_date: formatDate(startDate),
                end_date: formatDate(endDate),
                daily: 'rain_sum',
                timezone: 'auto'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Weather Error:", error.message);
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
});

// 3. ETH Price (CoinGecko)
app.get('/api/eth-price', async (req, res) => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,inr');
        res.json(response.data.ethereum);
    } catch (error) {
        console.error("Price Error:", error.message);
        res.status(500).json({ error: "Failed to fetch ETH price" });
    }
});

// 4. Policy Recommendation Engine
app.post('/api/recommend-policy', async (req, res) => {
    const { lat, lon } = req.body;
    if (!lat || !lon) return res.status(400).json({ error: "Lat/Lon required" });

    try {
        // 1. Fetch Historical Data (Last 60 days for better trend)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 60);
        const formatDate = (date) => date.toISOString().split('T')[0];

        const weatherRes = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
            params: {
                latitude: lat,
                longitude: lon,
                start_date: formatDate(startDate),
                end_date: formatDate(endDate),
                daily: 'rain_sum',
                timezone: 'auto'
            }
        });

        const rainData = weatherRes.data.daily.rain_sum || [];

        // 2. Calculate Stats
        const totalRainfall = rainData.reduce((a, b) => a + b, 0);
        const avgRainfall = totalRainfall / rainData.length;
        const dryDays = rainData.filter(r => r < 1.0).length;

        // 3. Determine Risk & Policy
        let riskLevel = "Low";
        let suggestedThreshold = 50; // default mm
        let suggestedPremiumETH = "0.001";
        let reason = "Normal rainfall patterns detected.";

        if (avgRainfall < 2.0 || dryDays > 45) {
            riskLevel = "High";
            suggestedThreshold = 10; // Trigger payout if VERY dry
            suggestedPremiumETH = "0.005"; // Higher risk, higher premium
            reason = "High drought risk! 60-day rainfall is critically low.";
        } else if (avgRainfall < 5.0) {
            riskLevel = "Medium";
            suggestedThreshold = 30;
            suggestedPremiumETH = "0.002";
            reason = "Moderate rainfall. Standard drought protection recommended.";
        }

        res.json({
            riskLevel,
            suggestedThreshold,
            suggestedDuration: 30, // Default 30 days
            suggestedPremiumETH,
            reason,
            stats: {
                avgRainfall: avgRainfall.toFixed(2),
                totalRainfall: totalRainfall.toFixed(1),
                dryDays
            }
        });

    } catch (error) {
        console.error("Recommendation Error:", error.message);
        res.status(500).json({ error: "Failed to generate recommendation" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
