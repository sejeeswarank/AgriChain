import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import PolicyCard from './components/PolicyCard';
import { AgriChain } from './abis/AgriChain';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function App() {
    const [account, setAccount] = useState(null);
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(false);

    const [lat, setLat] = useState("35.68");
    const [lon, setLon] = useState("139.76");
    const [threshold, setThreshold] = useState("10");
    const [duration, setDuration] = useState("30");
    const [premium, setPremium] = useState("0.001");

    useEffect(() => {
        if (account) fetchPolicies();
    }, [account]);

    const connectWallet = async () => {
        if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(accounts[0]);
        } else {
            alert("Please install MetaMask!");
        }
    };

    const fetchPolicies = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, AgriChain, provider);

            const loadedPolicies = [];

            try {
                const res = await axios.get(`http://localhost:5000/api/policies/${account}`);
                setPolicies(res.data);
            } catch (e) {
                console.log("Backend not reachable, showing empty or mock");
            }
        } catch (e) {
            console.error("Fetch error", e);
        }
    };

    const buyPolicy = async () => {
        if (!account) return;
        setLoading(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, AgriChain, signer);

            const indexIdStr = `RAINFALL:${lat}:${lon}`;
            const indexId = ethers.id(indexIdStr);
            const thresholdScaled = Math.floor(Number(threshold) * 100);
            const start = Math.floor(Date.now() / 1000);
            const end = start + (Number(duration) * 24 * 60 * 60);
            const value = ethers.parseEther(premium);

            const tx = await contract.createPolicy(indexId, thresholdScaled, start, end, { value });
            await tx.wait();

            alert("Policy Created!");
            fetchPolicies();

            await axios.post('http://localhost:5000/api/policies', {
                policyId: Date.now(),
                farmer: account,
                indexId: indexIdStr,
                threshold: thresholdScaled,
                premium: value.toString(),
                startTimestamp: start,
                endTimestamp: end,
                txHash: tx.hash
            });

        } catch (e) {
            console.error(e);
            alert("Error creating policy: " + e.message);
        }
        setLoading(false);
    };

    return (
        <div className="container">
            <header className="header">
                <h1>🌱 AgriChain Insurance</h1>
                {!account ? (
                    <button className="btn btn-primary" onClick={connectWallet}>Connect Wallet</button>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>{account.substring(0, 6)}...{account.substring(38)}</span>
                    </div>
                )}
            </header>

            <div className="grid">
                <div className="card">
                    <h2>Protect Your Crops</h2>
                    <div className="form-group">
                        <label>Latitude</label>
                        <input value={lat} onChange={e => setLat(e.target.value)} placeholder="35.68" />
                    </div>
                    <div className="form-group">
                        <label>Longitude</label>
                        <input value={lon} onChange={e => setLon(e.target.value)} placeholder="139.76" />
                    </div>
                    <div className="form-group">
                        <label>Rainfall Threshold (mm)</label>
                        <input value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="10" />
                        <small>Payout if rainfall is LESS than this.</small>
                    </div>
                    <div className="form-group">
                        <label>Duration (Days)</label>
                        <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="30" />
                    </div>
                    <div className="form-group">
                        <label>Premium (ETH)</label>
                        <input value={premium} onChange={e => setPremium(e.target.value)} placeholder="0.001" />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={buyPolicy} disabled={loading || !account}>
                        {loading ? "Processing..." : `Pay ${premium} ETH & Activate`}
                    </button>
                </div>

                <div>
                    <h2>Your Policies</h2>
                    {policies.length === 0 ? (
                        <p>No policies found. Create one!</p>
                    ) : (
                        policies.map((p, i) => <PolicyCard key={i} policy={p} index={i} />)
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
