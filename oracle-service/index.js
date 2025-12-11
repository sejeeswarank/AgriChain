require('dotenv').config({ path: '../keys/.env' });
const axios = require('axios');
const { ethers } = require('ethers');

const PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_ABI = require('../keys/abis/AgriChainPolicy.json');

const WEATHER_API = process.env.WEATHER_API_URL;

async function main() {
    if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
        console.error("Missing Env Vars");
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    console.log(`Oracle started. Wallet: ${wallet.address}`);

    const policiesRes = await axios.get('http://localhost:5000/api/active-policies');
    const policies = policiesRes.data;

    console.log(`[${new Date().toISOString()}] Found ${policies.length} active policies.`);

    // Deduplicate locations to avoid spamming API
    const uniqueIndices = [...new Set(policies.map(p => p.indexId))];

    for (const indexIdStr of uniqueIndices) {
        try {
            console.log(`Processing ${indexIdStr}...`);
            const parts = indexIdStr.split(':');
            if (parts.length < 3) continue;

            const lat = parts[1];
            const lon = parts[2];

            // Fetch Weather Logic (same as before)
            const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&timezone=UTC&past_days=1`);
            const rainfall = response.data.daily.precipitation_sum[0];
            const timestamp = Math.floor(Date.now() / 1000);

            console.log(`Rainfall for ${lat},${lon}: ${rainfall}mm`);
            const scaledRainfall = Math.floor(rainfall * 100);
            const indexIdBytes = ethers.id(indexIdStr);

            // Construct and Sign
            const messageHash = ethers.solidityPackedKeccak256(
                ["bytes32", "uint256", "uint256"],
                [indexIdBytes, scaledRainfall, timestamp]
            );
            const messageBytes = ethers.getBytes(messageHash);
            const signature = await wallet.signMessage(messageBytes);

            // Submit
            console.log(`Signed report. Submitting...`);
            const tx = await contract.submitOracleReport(indexIdBytes, scaledRainfall, timestamp, signature);
            console.log(`Tx sent: ${tx.hash}`);
            await tx.wait();
            console.log(`Report Confirmed!`);

        } catch (e) {
            console.error(`Error processing ${indexIdStr}:`, e.message);
        }
    }
}

// Run every 60 seconds
setInterval(main, 60000);
main(); // Run immediately on start
