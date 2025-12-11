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

    const [lat, setLat] = useState("");
    const [lon, setLon] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [threshold, setThreshold] = useState("");
    const [duration, setDuration] = useState("30");
    const [premium, setPremium] = useState("0.001");

    // New Advanced State
    const [ethRates, setEthRates] = useState({});
    const [recommendation, setRecommendation] = useState(null);
    const [loadingRec, setLoadingRec] = useState(false);

    useEffect(() => {
        if (account) fetchPolicies();
        fetchEthPrice();
    }, [account]);

    const fetchEthPrice = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/eth-price`);
            setEthRates(res.data);
        } catch (e) { console.error("Price fetch error", e); }
    };

    const handleLocationSearch = async () => {
        if (!locationQuery) return;
        setLoadingRec(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/geocode?location=${locationQuery}`);
            if (res.data) {
                const { lat, lon } = res.data;
                setLat(lat);
                setLon(lon);
                await getRecommendation(lat, lon);
            }
        } catch (e) { alert("Location not found!"); }
        setLoadingRec(false);
    };

    const handleUseCurrentLocation = () => {
        if (navigator.geolocation) {
            setLoadingRec(true);
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                setLat(latitude);
                setLon(longitude);
                await getRecommendation(latitude, longitude);
                setLoadingRec(false);
            }, () => {
                alert("Geolocation failed");
                setLoadingRec(false);
            });
        }
    };

    const getRecommendation = async (latitude, longitude) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/recommend-policy`, { lat: latitude, lon: longitude });
            setRecommendation(res.data);
            setThreshold(res.data.suggestedThreshold);
            setPremium(res.data.suggestedPremiumETH);
            setDuration(res.data.suggestedDuration);
        } catch (e) { console.error("Rec error", e); }
    };

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
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/policies/${account}`);
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

            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/policies`, {
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
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', color: '#2c3e50' }}>🌱 AgriChain Insurance</h1>
                {!account ? (
                    <button className="btn btn-primary" onClick={connectWallet}>Connect Wallet</button>
                ) : (
                    <div style={{ background: '#f8f9fa', padding: '10px 20px', borderRadius: '30px', border: '1px solid #e9ecef' }}>
                        <span style={{ fontWeight: 'bold', color: '#2ecc71' }}>●</span> {account.substring(0, 6)}...{account.substring(38)}
                    </div>
                )}
            </header>

            <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div className="card">
                    <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #f1f2f6', paddingBottom: '10px' }}>1. Find Your Region</h2>

                    <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                        <input
                            value={locationQuery}
                            onChange={e => setLocationQuery(e.target.value)}
                            placeholder="Enter City, District..."
                            style={{ flex: 1 }}
                        />
                        <button className="btn" onClick={handleLocationSearch} disabled={loadingRec}>🔍</button>
                    </div>

                    <button className="btn" onClick={handleUseCurrentLocation} style={{ width: '100%', background: '#fff', color: '#2ecc71', border: '1px solid #2ecc71', marginTop: '10px' }}>
                        📍 Use My Current Location
                    </button>

                    {recommendation && (
                        <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '10px', marginTop: '20px', borderLeft: '5px solid #3498db' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#2980b9' }}>🤖 AI Policy Recommendation</h3>
                            <p><strong>Risk Level:</strong> {recommendation.riskLevel}</p>
                            <p><strong>Reason:</strong> {recommendation.reason}</p>
                            <p><strong>Avg Rainfall (30d):</strong> {recommendation.stats.avgRainfall}mm</p>
                        </div>
                    )}
                </div>

                <div className="card" style={{ opacity: lat ? 1 : 0.6, pointerEvents: lat ? 'all' : 'none' }}>
                    <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #f1f2f6', paddingBottom: '10px' }}>2. Customize Policy</h2>

                    <div className="form-group">
                        <label>Coordinates</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input value={lat} readOnly placeholder="Lat" style={{ background: '#f8f9fa' }} />
                            <input value={lon} readOnly placeholder="Lon" style={{ background: '#f8f9fa' }} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Rainfall Threshold (mm) {recommendation && <span style={{ color: '#27ae60' }}>(Auto-Filled)</span>}</label>
                        <input value={threshold} onChange={e => setThreshold(e.target.value)} type="number" />
                    </div>

                    <div className="form-group">
                        <label>Duration (Days)</label>
                        <select value={duration} onChange={e => setDuration(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                            <option value="15">15 Days (Short Term)</option>
                            <option value="30">30 Days (Standard)</option>
                            <option value="60">60 Days (Season)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Premium (ETH)</label>
                        <input value={premium} onChange={e => setPremium(e.target.value)} type="number" step="0.001" />
                        {ethRates.usd && (
                            <div style={{ fontSize: '0.9em', color: '#7f8c8d', marginTop: '5px' }}>
                                ≈ ${(premium * ethRates.usd).toFixed(2)} USD | ₹{(premium * ethRates.inr).toFixed(2)} INR
                            </div>
                        )}
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px', fontSize: '1.1em', padding: '15px' }} onClick={buyPolicy} disabled={loading || !account}>
                        {loading ? "Processing..." : `🛡️ Protect for ${premium} ETH`}
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '40px' }}>
                <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Your Active Policies</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    {policies.length === 0 ? (
                        <p style={{ color: '#7f8c8d' }}>No policies active. Use the tool above to create one.</p>
                    ) : (
                        policies.map((p, i) => <PolicyCard key={i} policy={p} index={i} />)
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
