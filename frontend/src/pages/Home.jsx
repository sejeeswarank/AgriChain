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
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.05), transparent)',
                    position: 'relative'
                }}>
                    {/* Inner Nav (Top aligned) */}
                    <div style={{
                        position: 'absolute',
                        top: '30px',
                        left: '40px',
                        right: '40px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="logo-title" style={{ fontSize: '1.5rem', marginRight: '20px' }}>AgriChain</div>
                            {/* Pill Nav Items */}
                            {['Dashboard', 'Policies', 'Risks'].map(item => (
                                <button key={item} className="secondary-btn" style={{
                                    width: 'auto',
                                    padding: '8px 20px',
                                    borderRadius: '50px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#e2e8f0',
                                    marginTop: 0
                                }}>{item}</button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => navigate('/login')} className="secondary-btn" style={{
                                width: 'auto',
                                borderRadius: '50px',
                                marginTop: 0,
                                borderColor: '#10b981',
                                color: '#10b981'
                            }}>Login</button>
                        </div>
                    </div>

                    {/* Hero Content */}
                    <div style={{ maxWidth: '600px', marginTop: '40px' }}>
                        <h1 style={{
                            fontSize: '3.5rem',
                            lineHeight: '1.1',
                            marginBottom: '20px',
                            background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Decentralized <br />
                            <span style={{ color: '#10b981', WebkitTextFillColor: '#10b981' }}>Crop Protection</span>
                        </h1>
                        <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '30px', maxWidth: '450px' }}>
                            Instant, transparent, parametric insurance powered by blockchain technology. Protect your harvest against climate risks.
                        </p>
                        <button onClick={() => navigate('/signup')} className="primary-btn" style={{
                            width: 'auto',
                            borderRadius: '50px',
                            padding: '15px 40px',
                            fontSize: '1.1rem',
                            display: 'inline-flex'
                        }}>
                            Get Protected →
                        </button>
                    </div>
                </div>

                {/* 2. Grid Section (Bottom 40%) */}
                <div style={{
                    flex: '2',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '2px', // Thin gaps for border effect
                    background: 'rgba(255, 255, 255, 0.05)', // Border color
                    paddingTop: '1px' // Top border line
                }}>

                    {/* Card 1: How It Works */}
                    <div style={{ background: '#0f172a', padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <h3 style={{ color: '#e2e8f0', margin: 0 }}>How It Works</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#94a3b8', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', width: '24px', height: '24px', borderRadius: '50%', textAlign: 'center', lineHeight: '24px', fontSize: '0.8rem' }}>1</span>
                                Select Crop Policy
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', width: '24px', height: '24px', borderRadius: '50%', textAlign: 'center', lineHeight: '24px', fontSize: '0.8rem' }}>2</span>
                                Automated Monitoring
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', width: '24px', height: '24px', borderRadius: '50%', textAlign: 'center', lineHeight: '24px', fontSize: '0.8rem' }}>3</span>
                                Instant Payout
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Essential Feature (Smart Oracle) */}
                    <div style={{ background: '#0f172a', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ color: '#e2e8f0', margin: 0, marginBottom: '10px' }}>Smart Monitoring</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                                Real-time weather data integration via Chainlink oracles ensures purely objective claim triggers.
                            </p>
                        </div>
                        <div style={{
                            height: '60px',
                            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0) 100%)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 15px',
                            marginTop: '20px'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>🛰️</span>
                            <span style={{ marginLeft: '10px', color: '#10b981', fontWeight: 'bold' }}>Active</span>
                        </div>
                    </div>

                    {/* Card 3: Trust Stats */}
                    <div style={{ background: '#0f172a', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffffff' }}>100%</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Payout Reliability</div>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', width: '100%' }}></div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>&lt; 24h</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Settlement Time</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Home;