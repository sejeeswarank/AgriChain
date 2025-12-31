import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import logo from '../assets/logo.png';
import { useWallet } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ethers } from 'ethers';
import axios from 'axios';
import { AgriChain } from '../abis/AgriChain';
import PolicyCard from '../components/PolicyCard';
import useMediaQuery from '../hooks/useMediaQuery';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const Dashboard = () => {
    const { user, userProfile, logout } = useAuth();
    const { walletAddress, isWalletConnected, connectWallet, isConnecting, disconnectWallet } = useWallet();
    const navigate = useNavigate();
    const { t, language, changeLanguage } = useLanguage();
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
    const [duration, setDuration] = useState("30");
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
        } catch (e) { console.error("Price fetch error", e); }
    };

    const fetchPolicies = async () => {
        try {
            const res = await axios.get(`/api/policies/${walletAddress}`);
            setPolicies(res.data);
        } catch (e) { console.log("Backend offline or no policies"); }
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
        } catch (e) { alert('Location not found'); }
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

            {/* --- SIDEBAR --- */}
            <aside style={{
                position: isMobile ? 'absolute' : 'relative',
                zIndex: 50,
                height: '100%',
                width: isMobile ? (isSidebarOpen ? '100%' : '0px') : (isSidebarOpen ? '260px' : '80px'), // Dynamic Width
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(10px)',
                backdropFilter: 'blur(10px)',
                borderRight: (isMobile && !isSidebarOpen) ? 'none' : '1px solid rgba(255,255,255,0.05)',
                padding: (isMobile && !isSidebarOpen) ? '0' : '30px 10px 10px 10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'width 0.3s ease', // Smooth transition
                overflow: 'hidden',
                boxSizing: 'border-box' // Ensure padding is included in height
            }}>
                <div>
                    {/* Toggle Button & Logo Container */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', paddingLeft: isSidebarOpen ? '10px' : '0', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0'
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                        </button>

                        <div className="logo" style={{
                            fontSize: '1.8rem',
                            fontWeight: 'bold',
                            color: 'transparent', // Make text transparent for gradient
                            background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginLeft: isSidebarOpen ? '15px' : '0',
                            width: isSidebarOpen ? 'auto' : '0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            opacity: isSidebarOpen ? 1 : 0,
                            visibility: isSidebarOpen ? 'visible' : 'hidden',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden'
                        }}>
                            <img src={logo} alt="Logo" style={{ height: '32px', width: 'auto', minWidth: '32px' }} />
                            AgriChain
                        </div>
                    </div>

                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            { name: 'Overview', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
                            { name: 'My Policies', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
                            { name: 'Claims', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> },
                            { name: 'Settings', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> }
                        ].map(item => {
                            const key = item.name.toLowerCase().replace(' ', '');
                            const isActive = activeTab === key || (key === 'overview' && activeTab === 'overview');
                            return (
                                <button key={item.name}
                                    onClick={() => setActiveTab(key)}
                                    title={!isSidebarOpen ? item.name : ''} // Tooltip when collapsed
                                    style={{
                                        background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                        color: isActive ? '#10b981' : '#94a3b8',
                                        border: 'none',
                                        padding: '12px',
                                        width: '100%',
                                        textAlign: 'left',
                                        borderRadius: '12px',
                                        fontSize: '1rem',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: isSidebarOpen ? 'flex-start' : 'center', // Center icon when collapsed
                                        gap: '12px',
                                        marginBottom: '8px'
                                    }}>
                                    <div style={{ minWidth: '20px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                                    {isSidebarOpen && <span style={{ whiteSpace: 'nowrap', opacity: isSidebarOpen ? 1 : 0, transition: 'opacity 0.2s' }}>{item.name}</span>}
                                </button>
                            )
                        })}
                    </nav>

                    {/* Language Switcher (Sidebar) */}
                    <div style={{ marginTop: 'auto', marginBottom: '10px' }}>
                        <button
                            onClick={() => {
                                const langs = ['en', 'ta', 'hi', 'ml'];
                                const nextIndex = (langs.indexOf(language) + 1) % langs.length;
                                changeLanguage(langs[nextIndex]);
                            }}
                            title={isSidebarOpen ? 'Click to change language' : `Language: ${(language || 'en').toUpperCase()}`}
                            style={{
                                background: 'transparent',
                                color: '#94a3b8',
                                border: 'none',
                                padding: '12px',
                                width: '100%',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'flex-start' : 'center', gap: '12px',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.color = '#10b981'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                        >
                            <div style={{ minWidth: '20px', display: 'flex', justifyContent: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                            </div>
                            {isSidebarOpen && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                                    <span style={{ fontSize: '1rem' }}>Language</span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{language === 'en' ? 'English' : language === 'ta' ? 'Tamil' : language === 'hi' ? 'Hindi' : 'Malayalam'}</span>
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                <button onClick={() => { logout(); navigate('/'); }} title={!isSidebarOpen ? 'Logout' : ''} style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: 'none',
                    padding: '12px',
                    width: '100%',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'flex-start' : 'center', gap: '8px'
                }}>
                    <div style={{ minWidth: '20px', display: 'flex', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </div>
                    {isSidebarOpen && <span>Logout</span>}
                </button>
            </aside>


            {/* --- MAIN CONTENT (Bento Grid) --- */}
            <main style={{ flex: 1, padding: isMobile ? '20px' : '30px', overflowY: 'auto' }}>

                {/* Header (Profile + Connect) */}
                {/* Header (Profile + Connect) */}
                {
                    isMobile ? (
                        /* MOBILE HEADER */
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {/* Hamburger Trigger */}
                                    <button
                                        onClick={() => setIsSidebarOpen(true)}
                                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', padding: 0, cursor: 'pointer' }}
                                    >
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                                    </button>
                                    {/* Language Icon (Mobile) */}
                                    <button style={{ background: 'transparent', border: 'none', color: '#94a3b8', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                    </button>
                                    {/* Mobile Logo */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '1.4rem',
                                        fontWeight: 'bold',
                                        background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        color: 'transparent'
                                    }}>
                                        <img src={logo} alt="Logo" style={{ height: '28px', width: 'auto' }} />
                                        AgriChain
                                    </div>
                                </div>

                                {/* Mobile Connect Button */}
                                <button onClick={isWalletConnected ? disconnectWallet : connectWallet} className={isWalletConnected ? 'secondary-btn' : 'primary-btn'} style={{
                                    borderRadius: '50px', padding: '8px 16px', fontSize: '0.85rem', marginBottom: 0, marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px'
                                }}>
                                    {isWalletConnected ? (
                                        <>
                                            <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div>
                                            {walletAddress.substring(0, 4)}...
                                        </>
                                    ) : (
                                        <>Connect</>
                                    )}
                                </button>
                            </div>

                            {/* Welcome Text Mobile */}
                            <div>
                                <h1 style={{ fontSize: '1.6rem', color: 'white', marginBottom: '4px', lineHeight: 1.2 }}>Welcome back, <br />{userProfile?.fullName || 'Farmer'}</h1>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Here's what's happening today.</p>
                            </div>
                        </div>
                    ) : (
                        /* DESKTOP HEADER (UNCHANGED) */
                        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
                            <div>
                                <h1 style={{ fontSize: '2rem', color: 'white', marginBottom: '5px' }}>Welcome back, {userProfile?.fullName || 'Farmer'}</h1>
                                <p style={{ color: '#94a3b8' }}>Here's what's happening with your crops today.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button onClick={isWalletConnected ? disconnectWallet : connectWallet} className={isWalletConnected ? 'secondary-btn' : 'primary-btn'} style={{
                                    borderRadius: '50px', padding: '10px 25px', marginBottom: 0, marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    {isWalletConnected ? (
                                        <>
                                            <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                                            {walletAddress.substring(0, 6)}...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                            Connect Wallet
                                        </>
                                    )}
                                </button>
                            </div>
                        </header>
                    )
                }


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
                                <label style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>1. Select Region</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
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
                                <label style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>2. Confirm & Pay</label>
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
                                <button onClick={buyPolicy} disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
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
                                    <div key={i} style={{ padding: '15px', background: '#1e293b', borderRadius: '16px' }}>
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