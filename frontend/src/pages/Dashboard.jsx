import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import logo from '../assets/logo.png';
import { useWallet } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ethers } from 'ethers';
import axios from 'axios';
import { AgriChain } from '../abis/AgriChain';
import useMediaQuery from '../hooks/useMediaQuery';
import DashboardSidebar from '../components/DashboardSidebar';
import DashboardHeader from '../components/DashboardHeader';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const Dashboard = () => {
    const { user, userProfile, logout } = useAuth();
    const { walletAddress, isWalletConnected, connectWallet, disconnectWallet } = useWallet();
    const navigate = useNavigate();
    const { currentLanguage: language, switchLanguage: changeLanguage } = useLanguage();
    const isMobile = useMediaQuery('(max-width: 768px)');


    // --- UI State ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Collapsed by default

    // --- State from InsuranceDashboard logic ---
    const [activeTab, setActiveTab] = useState('overview'); // overview, policies, claims
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [ethRates, setEthRates] = useState({});

    // Purchase Form State
    const [lat, setLat] = useState("");
    const [lon, setLon] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [threshold, setThreshold] = useState("100");
    const [duration] = useState("30");
    const [premiumUSD, setPremiumUSD] = useState("");
    const [premiumETH, setPremiumETH] = useState("");
    const [recommendation, setRecommendation] = useState(null);
    const [loadingRec, setLoadingRec] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        if (!user) navigate('/');
        fetchEthPrice();
        if (isWalletConnected) {
            fetchPolicies();
        }
    }, [user, isWalletConnected]);

    const fetchEthPrice = async () => {
        try {
            const res = await axios.get(`/api/eth-price`);
            setEthRates(res.data);
        } catch (error) { console.error("Price fetch error", error); }
    };

    const fetchPolicies = async () => {
        try {
            const res = await axios.get(`/api/policies/${walletAddress}`);
            setPolicies(res.data);
        } catch (error) { console.error("Backend offline or no policies", error); }
    };

    // --- Location & Recommendation Logic ---
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
        } catch (error) { console.error(error); alert('Location not found'); }
        setLoadingRec(false);
    };

    const getRecommendation = async (latitude, longitude) => {
        try {
            const res = await axios.post(`/api/recommend-policy`, { lat: latitude, lon: longitude });
            setRecommendation(res.data);
            setThreshold(res.data.suggestedThreshold);
            setPremiumUSD(res.data.suggestedPremiumUSD);
            updateEthPremium(res.data.suggestedPremiumUSD);
        } catch (e) { console.error(e); }
    };

    const updateEthPremium = (usdAmount) => {
        if (ethRates.usd > 0) {
            setPremiumETH((usdAmount / ethRates.usd).toFixed(5));
        }
    };

    // Recalc ETH if USD changes
    useEffect(() => {
        if (premiumUSD && ethRates.usd) updateEthPremium(premiumUSD);
    }, [premiumUSD, ethRates]);


    const buyPolicy = async () => {
        if (!isWalletConnected) return alert("Connect Wallet first!");
        setLoading(true);
        try {
            const provider = new ethers.BrowserProvider(globalThis.ethereum);
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

            alert("Policy Purchased Successfully!");
            fetchPolicies();
            // Optional: Backend sync call here
        } catch (e) {
            console.error(e);
            alert("Transaction Failed: " + (e.reason || e.message));
        }
        setLoading(false);
    };


    return (
        <div className="dashboard-layout" style={{
            display: 'flex',
            height: '100vh',
            minHeight: '100dvh', // Use dynamic viewport height
            background: '#020617',
            overflow: 'hidden'
        }}>

            <DashboardSidebar
                isMobile={isMobile}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                language={language}
                changeLanguage={changeLanguage}
                logout={logout}
                navigate={navigate}
                logo={logo}
            />


            {/* --- MAIN CONTENT (Bento Grid) --- */}
            <main style={{ flex: 1, padding: isMobile ? '20px' : '30px', overflowY: 'auto' }}>

                <DashboardHeader
                    isMobile={isMobile}
                    userProfile={userProfile}
                    walletAddress={walletAddress}
                    isWalletConnected={isWalletConnected}
                    connectWallet={connectWallet}
                    disconnectWallet={disconnectWallet}
                    setIsSidebarOpen={setIsSidebarOpen}
                    logo={logo}
                />


                <div className="bento-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)',
                    gridTemplateRows: 'repeat(auto-fill, minmax(100px, auto))',
                    gap: '20px'
                }}>

                    {/* WIDGET 1: WEATHER ORACLE (Top Center) - Span 4 */}
                    <div style={{
                        gridColumn: isMobile ? 'span 1' : 'span 4',
                        background: '#0f172a',
                        borderRadius: '24px',
                        padding: '24px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, padding: '10px', background: 'rgba(14, 165, 233, 0.2)', borderBottomLeftRadius: '16px', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                            LIVE ORACLE
                        </div>
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '10px' }}>RAINFALL DATA</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
                            {recommendation ? `${recommendation.stats.totalRainfall}mm` : '-- mm'}
                        </div>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '5px' }}>
                            {recommendation ? `Recorded in ${locationQuery}` : 'Select region to view details'}
                        </p>
                    </div>

                    {/* WIDGET 2: STATS (Top Right) - Span 4 */}
                    <div style={{
                        gridColumn: isMobile ? 'span 1' : 'span 4',
                        background: '#0f172a',
                        borderRadius: '24px',
                        padding: '24px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '15px' }}>ACTIVE POLICIES</h3>
                        <div style={{ display: 'flex', alignItems: 'end', gap: '10px' }}>
                            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', lineHeight: 1 }}>{policies.length}</div>
                            <div style={{ color: '#10b981', paddingBottom: '8px', fontWeight: 'bold' }}>running</div>
                        </div>
                    </div>

                    {/* WIDGET 3: WALLET BALANCE (Top Right) - Span 4 */}
                    <div style={{
                        gridColumn: isMobile ? 'span 1' : 'span 4',
                        background: 'linear-gradient(135deg, #059669, #10b981)',
                        borderRadius: '24px',
                        padding: '24px',
                        color: 'white'
                    }}>
                        <h3 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '15px' }}>ESTIMATED PAYOUT</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>0.00 ETH</div>
                        <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '5px' }}>No triggers active yet.</p>
                    </div>


                    {/* WIDGET 4: NEW POLICY ACTION (Middle Left) - Span 8 */}
                    <div style={{
                        gridColumn: isMobile ? 'span 1' : 'span 8',
                        gridRow: 'span 2',
                        background: 'rgba(30, 41, 59, 0.4)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '24px',
                        padding: '30px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            Get New Protection
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>

                            {/* Step 1: Location */}
                            <div>
                                <label htmlFor="region-input" style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>1. Select Region</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        id="region-input"
                                        placeholder="Enter City/District"
                                        value={locationQuery}
                                        onChange={e => setLocationQuery(e.target.value)}
                                        style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#020617', border: '1px solid #334155', color: 'white' }}
                                    />
                                    <button onClick={handleLocationSearch} disabled={loadingRec} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', padding: '0 20px', cursor: 'pointer' }}>
                                        Check
                                    </button>
                                </div>
                                {recommendation && (
                                    <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                        <div style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '0.9rem' }}>Analyzed Risk: {recommendation.riskLevel}</div>
                                        <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>Rec. Threshold: {recommendation.suggestedThreshold}mm</div>
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Payment */}
                            <div style={{ opacity: recommendation ? 1 : 0.5, pointerEvents: recommendation ? 'all' : 'none' }}>
                                <label htmlFor="policy-pay" style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>2. Confirm & Pay</label>
                                <div style={{ background: '#020617', padding: '15px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: '5px' }}>
                                        <span>Duration</span>
                                        <span>{duration} Days</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                        <span>Premium</span>
                                        <span>{premiumETH || '0.00'} ETH</span>
                                    </div>
                                </div>
                                <button id="policy-pay" onClick={buyPolicy} disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                                    {loading ? 'Processing...' : 'Purchase Policy'}
                                </button>
                            </div>

                        </div>
                    </div>


                    {/* WIDGET 5: POLICY LIST (Middle Right) - Span 4 */}
                    <div style={{
                        gridColumn: isMobile ? 'span 1' : 'span 4',
                        gridRow: 'span 2',
                        background: '#0f172a',
                        borderRadius: '24px',
                        padding: '24px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        overflowY: 'auto',
                        maxHeight: '400px'
                    }}>
                        <h3 style={{ color: '#e2e8f0', fontSize: '1.1rem', marginBottom: '15px', position: 'sticky', top: 0, background: '#0f172a', paddingBottom: '10px' }}>Recent Policies</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {policies.length === 0 ? (
                                <div style={{ color: '#64748b', textAlign: 'center', marginTop: '50px' }}>No active policies</div>
                            ) : (
                                policies.map((p, i) => (
                                    <div key={p.id ?? p._id ?? `policy-${i}`} style={{ padding: '15px', background: '#1e293b', borderRadius: '16px' }}>
                                        <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px' }}>ACTIVE</div>
                                        <div style={{ color: 'white', fontSize: '0.9rem' }}>Threshold: {p.threshold}mm</div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Ends: {new Date(p.endTimestamp * 1000).toLocaleDateString()}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Dashboard;