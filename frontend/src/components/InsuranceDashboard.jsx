import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import axios from 'axios';
import PolicyCard from './PolicyCard';
import { AgriChain } from '../abis/AgriChain';
import { useLanguage } from '../context/LanguageContext';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function InsuranceDashboard() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Account from Login Page (fallback to null if accessed directly)
    const [account, setAccount] = useState(state?.wallet || null);
    const [vc, setVc] = useState(state?.vc || null);

    const [policies, setPolicies] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(false);

    const [lat, setLat] = useState("");
    const [lon, setLon] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [threshold, setThreshold] = useState("");
    const [duration, setDuration] = useState("30");
    const [premiumUSD, setPremiumUSD] = useState("");
    const [premiumETH, setPremiumETH] = useState("");

    // New Advanced State
    const [ethRates, setEthRates] = useState({});
    const [recommendation, setRecommendation] = useState(null);
    const [loadingRec, setLoadingRec] = useState(false);

    useEffect(() => {
        if (!account) {
            // Optional: Redirect to login if no account
            // navigate('/');
            checkWalletConnection();
        }
        fetchEthPrice();
    }, [account]);

    useEffect(() => {
        if (account) fetchPolicies();
    }, [account]);

    const checkWalletConnection = async () => {
        if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                setAccount(accounts[0]);
            }
        }
    };

    const fetchEthPrice = async () => {
        try {
            const res = await axios.get(`/api/eth-price`);
            setEthRates(res.data);
        } catch (e) { console.error("Price fetch error", e); }
    };

    const handleLocationSearch = async () => {
        if (!locationQuery) return;
        setLoadingRec(true);
        try {
            const res = await axios.get(`/api/geocode?location=${locationQuery}`);
            if (res.data) {
                const { lat, lon } = res.data;
                setLat(lat);
                setLon(lon);
                await getRecommendation(lat, lon);
            }
        } catch (e) { alert(t('error.unknown')); }
        setLoadingRec(false);
    };

    const handleUseCurrentLocation = () => {
        if (navigator.geolocation) {
            setLoadingRec(true);
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                setLat(latitude);
                setLon(longitude);
                await reverseGeocode(latitude, longitude);
                await getRecommendation(latitude, longitude);
                setLoadingRec(false);
            }, () => {
                alert("Geolocation failed");
                setLoadingRec(false);
            });
        }
    };

    const reverseGeocode = async (lat, lon) => {
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            if (res.data && res.data.display_name) {
                setLocationQuery(res.data.display_name.split(',')[0]); // Just city
            }
        } catch (e) {
            console.error("Reverse geocode failed", e);
        }
    };

    const getRecommendation = async (latitude, longitude) => {
        try {
            const res = await axios.post(`/api/recommend-policy`, { lat: latitude, lon: longitude });
            setRecommendation(res.data);

            // Auto-select "Standard" plan driven by recommendation
            setThreshold(res.data.suggestedThreshold);
            setDuration(res.data.suggestedDuration);
            setPremiumUSD(res.data.suggestedPremiumUSD);
            updateEthPremium(res.data.suggestedPremiumUSD);
        } catch (e) { console.error("Rec error", e); }
    };

    const updateEthPremium = (usdAmount) => {
        if (ethRates.usd > 0) {
            const ethVal = (usdAmount / ethRates.usd).toFixed(5);
            setPremiumETH(ethVal);
        }
    };

    // Recalculate if user changes USD manually
    useEffect(() => {
        if (premiumUSD && ethRates.usd) {
            updateEthPremium(premiumUSD);
        }
    }, [premiumUSD, ethRates]);

    const selectPlan = (planType) => {
        setSelectedPlan(planType);
        if (planType === 'BASIC') {
            setThreshold("10");
            setDuration("30");
            setPremiumUSD("10"); // Static low
        } else if (planType === 'PRO') {
            setThreshold("30");
            setDuration("30");
            setPremiumUSD("20");
        } else if (planType === 'RECOMMENDED' && recommendation) {
            setThreshold(recommendation.suggestedThreshold);
            setDuration(recommendation.suggestedDuration);
            setPremiumUSD(recommendation.suggestedPremiumUSD);
        }
    };


    const fetchPolicies = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, AgriChain, provider);

            const loadedPolicies = [];

            try {
                const res = await axios.get(`/api/policies/${account}`);
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
            const value = ethers.parseEther(premiumETH);

            const tx = await contract.createPolicy(indexId, thresholdScaled, start, end, { value });
            await tx.wait();

            alert(t('common.submit') + " Success!");
            fetchPolicies();

            await axios.post(`/api/policies`, {
                policyId: Date.now(),
                farmer: account,
                indexId: indexIdStr,
                threshold: thresholdScaled,
                premium: value.toString(), // Storing wei value
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
                <h1 style={{ fontSize: '2rem', color: '#ffffffff' }}>{t('dashboard.title')}</h1>
                {account && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {vc && (
                            <div style={{ background: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71', padding: '5px 15px', borderRadius: '20px', border: '1px solid #2ecc71', fontSize: '0.9em' }}>
                                ✅ {t('dashboard.verified')}
                            </div>
                        )}
                        <div style={{ background: '#f8f9fa', padding: '10px 20px', borderRadius: '30px', border: '1px solid #e9ecef', color: '#333' }}>
                            <span style={{ fontWeight: 'bold', color: '#2ecc71' }}>●</span> {account.substring(0, 6)}...{account.substring(38)}
                        </div>
                    </div>
                )}
            </header>

            <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div className="card">
                    <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #f1f2f6', paddingBottom: '10px' }}>1. {t('dashboard.findRegion')}</h2>

                    <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                        <input
                            value={locationQuery}
                            onChange={e => setLocationQuery(e.target.value)}
                            placeholder={t('dashboard.regionPlaceholder')}
                            style={{ flex: 1 }}
                        />
                        <button className="btn" onClick={handleLocationSearch} disabled={loadingRec}>🔍</button>
                    </div>

                    <button className="btn" onClick={handleUseCurrentLocation} style={{ width: '100%', background: 'transparent', color: '#2ecc71', border: '1px solid #2ecc71', marginTop: '10px' }}>
                        📍 {t('dashboard.useLocation')}
                    </button>

                    {loadingRec && <p style={{ marginTop: '10px', color: '#3498db' }}>{t('dashboard.fetchingLocation')}</p>}

                    {recommendation && (
                        <div>
                            <div style={{ background: 'rgba(52, 152, 219, 0.1)', padding: '15px', borderRadius: '10px', marginTop: '20px', marginBottom: '20px', borderLeft: '5px solid #3498db' }}>
                                <h3 style={{ margin: '0 0 10px 0', color: '#63b3ed' }}>{t('dashboard.analysisFor')} {locationQuery || "Region"}</h3>
                                <p><strong>{t('dashboard.riskLevel')}:</strong> {recommendation.riskLevel}</p>
                                <p><strong>{t('dashboard.reason')}:</strong> {recommendation.reason}</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                    <div style={{ background: 'var(--input-bg)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>🌧️ {t('dashboard.rain60d')}: <strong>{recommendation.stats.totalRainfall}mm</strong></div>
                                    <div style={{ background: 'var(--input-bg)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>☀️ {t('dashboard.dryDays')}: <strong>{recommendation.stats.dryDays}</strong></div>
                                </div>
                            </div>

                            <h4 style={{ marginBottom: '10px' }}>{t('dashboard.selectPlan')}:</h4>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <div
                                    onClick={() => selectPlan('BASIC')}
                                    style={{ border: selectedPlan === 'BASIC' ? '2px solid var(--primary)' : '1px solid var(--border-color)', background: selectedPlan === 'BASIC' ? 'var(--primary-glow)' : 'transparent', padding: '10px', borderRadius: '8px', cursor: 'pointer', flex: 1, textAlign: 'center' }}
                                >
                                    <strong>Basic</strong><br />$10<br /><small style={{ color: '#8b949e' }}>10mm / 30d</small>
                                </div>
                                <div
                                    onClick={() => selectPlan('RECOMMENDED')}
                                    style={{ border: selectedPlan === 'RECOMMENDED' ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)', background: selectedPlan === 'RECOMMENDED' ? 'rgba(14, 165, 233, 0.2)' : 'transparent', padding: '10px', borderRadius: '8px', cursor: 'pointer', flex: 1, textAlign: 'center', position: 'relative' }}
                                >
                                    {selectedPlan === 'RECOMMENDED' && <span style={{ position: 'absolute', top: '-10px', right: '-5px', background: 'var(--accent-blue)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>BEST</span>}
                                    <strong>Smart</strong><br />${recommendation.suggestedPremiumUSD}<br /><small style={{ color: '#8b949e' }}>{recommendation.stats.avgRainfall > 5 ? 'Standard' : 'High Risk'}</small>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="card" style={{ opacity: lat ? 1 : 0.6, pointerEvents: lat ? 'all' : 'none' }}>
                    <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #30363d', paddingBottom: '10px' }}>2. {t('dashboard.customizePay')}</h2>

                    <div className="form-group">
                        <label>{t('dashboard.coordinates')}</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input value={lat} readOnly placeholder="Lat" style={{ background: 'var(--input-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }} />
                            <input value={lon} readOnly placeholder="Lon" style={{ background: 'var(--input-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t('dashboard.rainfallThreshold')}</label>
                        <input value={threshold} onChange={e => setThreshold(e.target.value)} type="number" />
                    </div>

                    <div className="form-group">
                        <label>{t('dashboard.duration')}</label>
                        <select value={duration} onChange={e => setDuration(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-color)' }}>
                            <option value="15">15 Days</option>
                            <option value="30">30 Days</option>
                            <option value="60">60 Days</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('dashboard.premiumUSD')}</label>
                        <input value={premiumUSD} onChange={e => setPremiumUSD(e.target.value)} type="number" />
                    </div>

                    <div style={{ background: 'var(--input-bg)', padding: '15px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--text-color)' }}>{premiumETH || "0.00000"} ETH</div>
                        <div style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                            Rate: 1 ETH = ${ethRates.usd}
                        </div>
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px', fontSize: '1.2em', padding: '15px' }} onClick={buyPolicy} disabled={loading || !account || !premiumETH}>
                        {loading ? t('dashboard.processing') : `${t('dashboard.pay')} ${premiumETH} ETH`}
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '40px' }}>
                <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>{t('dashboard.activePolicies')}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    {policies.length === 0 ? (
                        <p style={{ color: '#7f8c8d' }}>{t('dashboard.noPolicies')}</p>
                    ) : (
                        policies.map((p, i) => <PolicyCard key={i} policy={p} index={i} />)
                    )}
                </div>
            </div>
        </div>
    );
}

export default InsuranceDashboard;
