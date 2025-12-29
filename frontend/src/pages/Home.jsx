import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="login-container" style={{ flexDirection: 'column', justifyContent: 'center' }}>
            {/* Ambient Background Animation - Reusing from Login */}
            <div className="animated-bg">
                <div className="circle c1"></div>
                <div className="circle c2"></div>
                <div className="circle c3"></div>
            </div>

            {/* Main Glassmorphic Dashboard Container */}
            <div className="glass-card" style={{
                width: '90%',
                maxWidth: '1000px',
                height: '80vh',
                display: 'flex',
                flexDirection: 'row', // Side navigation would go here if we were doing sidebar, but design is hero+grid
                flexDirection: 'column', // Stack Hero top, Grid bottom
                padding: '0',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 10,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px' // Extra rounded
            }}>

                {/* 1. Hero Section (Top 60%) */}
                <div style={{
                    flex: '3',
                    padding: '50px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.02), transparent)',
                    position: 'relative'
                }}>
                    {/* Inner Nav */}
                    <div style={{
                        position: 'absolute',
                        top: '30px',
                        left: '40px',
                        right: '40px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        zIndex: 20
                    }}>
                        {/* LEFT SIDE: Login / Sign Up Button (User Requested) */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => navigate('/login')} className="primary-btn" style={{
                                width: 'auto',
                                borderRadius: '50px',
                                padding: '10px 25px',
                                fontSize: '0.9rem',
                                marginBottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span>Login / Sign Up</span>
                                <span style={{ fontSize: '1.2em' }}>→</span>
                            </button>
                        </div>

                        {/* RIGHT SIDE: Logo and Nav Items */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            {/* Kshema-style simple nav */}
                            {['Products', 'Claims', 'Support'].map(item => (
                                <button key={item} style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#94a3b8',
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}>{item}</button>
                            ))}
                            <div className="logo-title" style={{ fontSize: '1.8rem', marginLeft: '10px' }}>AgriChain</div>
                        </div>
                    </div>

                    {/* Hero Content - Adapted for "Agri Insurance" Authority */}
                    <div style={{ maxWidth: '650px', marginTop: '40px', zIndex: 10 }}>
                        <h1 style={{
                            fontSize: '3.5rem',
                            lineHeight: '1.2',
                            marginBottom: '20px',
                            fontWeight: '300', // Kshema style lighter weight
                            color: '#ffffff'
                        }}>
                            Secure Your Harvest,<br />
                            <span style={{ fontWeight: '600', color: '#10b981' }}>Insure Your Future.</span>
                        </h1>
                        <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: '35px', maxWidth: '500px', lineHeight: '1.6' }}>
                            Comprehensive protection against non-preventable risks.
                            Covering standing crops, prevented sowing, and post-harvest losses.
                            <br /><span style={{ fontSize: '0.9rem', color: '#64748b', display: 'block', marginTop: '10px' }}>Aligned with PMFBY Standards • Powered by Blockchain</span>
                        </p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={() => navigate('/signup')} className="primary-btn" style={{
                                width: 'auto',
                                borderRadius: '50px',
                                padding: '15px 35px',
                                fontSize: '1rem',
                                marginBottom: 0
                            }}>
                                Get Protected
                            </button>
                            <button className="secondary-btn" style={{
                                width: 'auto',
                                borderRadius: '50px',
                                padding: '15px 35px',
                                fontSize: '1rem',
                                marginTop: 0,
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#e2e8f0'
                            }}>
                                View Plans
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Grid Section (Bottom 40%) - Bringing in Essential details */}
                <div style={{
                    flex: '2',
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1fr', // First col slightly wider for text
                    gap: '1px',
                    background: 'rgba(255, 255, 255, 0.08)', // Faint border
                    paddingTop: '1px'
                }}>

                    {/* Card 1: Essential Coverage (From SBI Research) */}
                    <div style={{ background: '#0f172a', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h3 style={{ color: '#e2e8f0', marginBottom: '20px', fontSize: '1.2rem', fontWeight: '500' }}>Comprehensive Coverage</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
                            <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#10b981' }}>✓</span> Standing Crop (Yield Loss)
                            </li>
                            <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#10b981' }}>✓</span> Prevented Sowing/Planting
                            </li>
                            <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#10b981' }}>✓</span> Mid-Season Adversity
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#10b981' }}>✓</span> Post-Harvest Losses
                            </li>
                        </ul>
                    </div>

                    {/* Card 2: Simple Process (Kshema Style + Blockchain speed) */}
                    <div style={{ background: '#0f172a', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h3 style={{ color: '#e2e8f0', marginBottom: '20px', fontSize: '1.2rem', fontWeight: '500' }}>Simple Process</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ minWidth: '24px', height: '24px', borderRadius: '50%', background: '#1e293b', color: '#fff', textAlign: 'center', lineHeight: '24px', fontSize: '0.8rem' }}>1</div>
                                <div>
                                    <div style={{ color: '#e2e8f0', fontSize: '0.95rem' }}>Select Crop</div>
                                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Choose from authenticated list</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ minWidth: '24px', height: '24px', borderRadius: '50%', background: '#1e293b', color: '#fff', textAlign: 'center', lineHeight: '24px', fontSize: '0.8rem' }}>2</div>
                                <div>
                                    <div style={{ color: '#e2e8f0', fontSize: '0.95rem' }}>Smart Monitor</div>
                                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>AI & Satellite tracking</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ minWidth: '24px', height: '24px', borderRadius: '50%', background: '#10b981', color: '#fff', textAlign: 'center', lineHeight: '24px', fontSize: '0.8rem' }}>3</div>
                                <div>
                                    <div style={{ color: '#e2e8f0', fontSize: '0.95rem' }}>Instant Payout</div>
                                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Direct to wallet</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Trust & Stats (Validation) */}
                    <div style={{ background: '#0f172a', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981', lineHeight: '1' }}>24h</div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '5px' }}>Claim Settlement</div>
                        </div>
                        <div style={{ width: '50px', height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0ea5e9', lineHeight: '1' }}>100%</div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '5px' }}>Transparent Process</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Home;