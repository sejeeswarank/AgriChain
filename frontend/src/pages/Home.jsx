import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import useMediaQuery from '../hooks/useMediaQuery';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { language, changeLanguage } = useLanguage(); // Language Hook
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

    const LANGUAGES = [
        { code: 'en', label: 'English' },
        { code: 'ta', label: 'தமிழ்' },
        { code: 'hi', label: 'हिन्दी' },
        { code: 'ml', label: 'മലയാളം' }
    ];





    return (
        <div className="home-container" style={{
            minHeight: '100vh',
            width: '100%',
            background: '#020617', // Base dark bg
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px 20px',
            position: 'relative',
            overflowY: 'auto', // Allow scrolling for the whole page if needed
            overflowX: 'hidden'
        }}>
            {/* Ambient Background Animation */}
            <div className="animated-bg" style={{ position: 'fixed' }}>
                <div className="circle c1"></div>
                <div className="circle c2"></div>
                <div className="circle c3"></div>
            </div>

            {/* Main Floating Glass Interface (The "Window") */}
            <div className="main-interface" style={{
                width: '100%',
                maxWidth: '1200px',
                // We let height grow with content, but min-height gives the layout presence
                minHeight: '85vh',
                background: 'rgba(15, 23, 42, 0.6)', // Highly transparent slate
                backdropFilter: 'blur(20px)',
                borderRadius: '32px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                padding: '16px', // Padding for the specific bento gap
                zIndex: 10,
                position: 'relative',
                gap: '16px' // The "gap" between bento items
            }}>

                {/* --- TOP ROW: Navbar (Pill Shape) --- */}
                {isMobile ? (
                    /* MOBILE HEADER */
                    <header style={{
                        gridColumn: 'span 12',
                        background: 'rgba(30, 41, 59, 0.4)',
                        borderRadius: '24px',
                        padding: '0 20px',
                        height: '64px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        position: 'relative',
                        zIndex: 50
                    }}>
                        {/* Logo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={logo} alt="AgriChain" style={{ height: '28px', width: 'auto' }} />
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>AgriChain</span>
                        </div>

                        {/* Hamburger */}
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '5px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                        </button>

                        {/* Mobile Drawer */}
                        {isMobileMenuOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '70px',
                                left: 0,
                                right: 0,
                                background: '#0f172a',
                                borderRadius: '24px',
                                padding: '20px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px'
                            }}>
                                {['How It Works', 'Key Features', 'About'].map(item => (
                                    <a key={item} href={`#${item.replace(' ', '-').toLowerCase()}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '1rem', padding: '10px' }}>
                                        {item}
                                    </a>
                                ))}
                                {/* Language Selection (Mobile Drawer) */}
                                <div style={{ borderTop: '1px solid #334155', paddingTop: '10px', marginTop: '5px' }}>
                                    <div style={{ color: '#64748b', fontSize: '0.8rem', paddingLeft: '10px', marginBottom: '5px' }}>LANGUAGE</div>
                                    {[
                                        { code: 'en', label: 'English' },
                                        { code: 'ta', label: 'தமிழ்' },
                                        { code: 'hi', label: 'हिन्दी' },
                                        { code: 'ml', label: 'മലയാളം' }
                                    ].map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => changeLanguage(lang.code)}
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '10px',
                                                background: language === lang.code ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                                color: language === lang.code ? '#10b981' : '#94a3b8',
                                                border: 'none',
                                                fontSize: '0.95rem',
                                                cursor: 'pointer',
                                                fontWeight: language === lang.code ? 'bold' : 'normal',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ height: '1px', background: '#334155', margin: '5px 0' }}></div>
                                <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid #475569', color: 'white', borderRadius: '12px' }}>Login</button>
                                <button onClick={() => navigate('/signup')} style={{ width: '100%', padding: '12px', background: '#10b981', border: 'none', color: 'white', borderRadius: '12px', fontWeight: 'bold' }}>Sign Up</button>
                            </div>
                        )}
                    </header>
                ) : (
                    /* DESKTOP HEADER */
                    <header style={{
                        gridColumn: 'span 12',
                        background: 'rgba(30, 41, 59, 0.4)',
                        borderRadius: '24px',
                        padding: '0 30px',
                        height: '72px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        // overflow: 'hidden' // Removed to allow dropdown
                    }}>
                        {/* Left: Logo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '100%' }}>
                            <img src={logo} alt="AgriChain Logo" style={{ height: '40px', width: 'auto' }} />
                            <span style={{
                                fontSize: '1.8em',
                                fontWeight: 'bold',
                                letterSpacing: '-0.5px',
                                background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                lineHeight: 1.3, // Increased to show descenders (g, y, j)
                                paddingBottom: '4px', // Space for descenders
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                AgriChain
                            </span>
                        </div>

                        {/* Center: Navigation */}
                        <nav style={{ display: 'flex', gap: '30px', alignItems: 'center', height: '100%' }}>
                            {['How It Works', 'Key Features', 'About'].map(item => (
                                <a key={item} href={`#${item.replace(' ', '-').toLowerCase()}`} style={{
                                    color: '#94a3b8',
                                    textDecoration: 'none',
                                    fontSize: '0.95rem',
                                    fontWeight: '500',
                                    transition: 'color 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: '100%'
                                }} className="nav-link">
                                    {item}
                                </a>
                            ))}
                        </nav>

                        {/* Right: Actions */}
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', height: '100%' }}>
                            {/* Language Dropdown (Desktop) */}
                            <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
                                <button
                                    onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94a3b8',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        transition: 'background 0.2s',
                                        height: '40px' // Match button height
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        Language
                                    </span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isLanguageDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </button>
                                {isLanguageDropdownOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 4px)',
                                        right: 0,
                                        background: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        padding: '6px',
                                        minWidth: '140px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                                        zIndex: 100
                                    }}>
                                        {LANGUAGES.map(lang => (
                                            <button
                                                key={lang.code}
                                                onClick={() => { changeLanguage(lang.code); setIsLanguageDropdownOpen(false); }}
                                                style={{
                                                    background: language === lang.code ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                                    color: language === lang.code ? '#10b981' : '#cbd5e1',
                                                    border: 'none',
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    fontSize: '0.9rem',
                                                    fontWeight: language === lang.code ? 600 : 400
                                                }}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={() => navigate('/login')} className="secondary-btn" style={{
                                padding: '8px 20px',
                                borderRadius: '50px',
                                fontSize: '0.9rem',
                                margin: 0 // Reset margins
                            }}>
                                Login
                            </button>
                            <button onClick={() => navigate('/signup')} className="primary-btn" style={{
                                width: 'auto',
                                borderRadius: '50px',
                                padding: '8px 24px',
                                fontSize: '0.9rem',
                                marginBottom: 0 // Reset margins
                            }}>
                                Sign Up
                            </button>
                        </div>
                    </header>
                )}

                {/* --- MIDDLE ROW: Hero Section (Big Card) --- */}
                <section style={{
                    display: 'flex',
                    flexDirection: 'column', // Mobile default
                    gap: '16px',
                    height: '100%', // Fill available
                }}>

                    <div className="hero-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr', // Full width hero
                        gap: '16px',
                        minHeight: '500px'
                    }}>
                        {/* Hero Text Card */}
                        <div style={{
                            background: 'url("https://images.unsplash.com/photo-1625246333195-58f21460d8a6?auto=format&fit=crop&q=80&w=2070") center/cover no-repeat', // Agriculture image
                            borderRadius: '24px',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            padding: '40px'
                        }}>
                            {/* Overlay for text readability */}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(2, 6, 23, 0.95), rgba(2, 6, 23, 0.3))' }}></div>

                            <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10b981',
                                    borderRadius: '30px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    marginBottom: '20px',
                                    border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}>
                                    Blockchain Powered Parametric Insurance
                                </div>
                                <h1 style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: '700', lineHeight: 1.1, marginBottom: '20px', color: 'white' }}>
                                    Secure Harvests,<br />
                                    <span style={{ color: '#10b981' }}>Instant Payouts.</span>
                                </h1>
                                <p style={{ fontSize: '1.2rem', color: '#cbd5e1', marginBottom: '30px', lineHeight: 1.6 }}>
                                    AgriChain automatically compensates farmers when adverse weather strikes.
                                    No manual claims, no inspections, zero corruption.
                                </p>
                                <button onClick={() => navigate('/signup')} className="primary-btn" style={{
                                    width: 'auto', padding: '16px 40px', fontSize: '1.1rem', borderRadius: '50px',
                                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                                    display: 'inline-flex', alignItems: 'center', gap: '8px'
                                }}>
                                    Get Protected Now
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* --- BOTTOM ROW: Feature Bento Grid (Kshema-style USPs) --- */}
                    <div className="features-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)',
                        gap: '16px'
                    }}>
                        {/* USP 1: 8 Perils Coverage (Span 8) */}
                        <div style={{
                            gridColumn: isMobile ? 'span 1' : 'span 8',
                            background: '#0f172a',
                            padding: '30px',
                            borderRadius: '24px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                                <div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                        Files Claims Automatically
                                    </div>
                                    <h3 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '5px' }}>8 Perils, 1 Solution.</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Comprehensive protection against the most frequent climate risks.</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                                {[
                                    { name: 'Cyclone', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M10 9H8"></path><path d="M16 13h-6"></path><path d="M16 17h-6"></path><polyline points="10 9 9 9 8 9"></polyline></svg> }, // Placeholder for Cyclone
                                    { name: 'Flood', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 16.29a3.5 3.5 0 0 1 5.66 0"></path><path d="M3 13.785a6 6 0 0 1 10.589 0"></path><path d="M13.67 19.57a3.5 3.5 0 0 1 5.67 0"></path><path d="M22 22H2"></path></svg> },
                                    { name: 'Drought', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> }, // Placeholder
                                    { name: 'Landslide', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.835 14H3.25a2.25 2.25 0 0 1-1.92-1.077L4.77 5.25A2.25 2.25 0 0 1 6.69 4.125h3.08a2.25 2.25 0 0 1 1.92 1.077l1.096 1.83"></path><path d="M11.595 10.435A9.754 9.754 0 0 0 15 9.75v10.518a2.25 2.25 0 0 1-2.008 2.246l-2.09.117a2.25 2.25 0 0 1-2.375-2.246V14"></path></svg> }, // Placeholder
                                    { name: 'Lightning', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg> },
                                    { name: 'Earthquake', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> },
                                    { name: 'Hailstorm', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 16.2A4.5 4.5 0 0 0 5.1 14"></path><path d="M6 20v1"></path><path d="M10 20v1"></path><path d="M14 20v1"></path></svg> }, // Placeholder
                                    { name: 'Pest Attack', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h.01"></path><path d="M14 8h.01"></path><path d="M10 6h.01"></path><path d="M6 4h.01"></path></svg> }  // Placeholder
                                ].map((peril) => (
                                    <div key={peril.name} style={{
                                        padding: '15px 10px',
                                        background: 'rgba(30, 41, 59, 0.4)',
                                        borderRadius: '16px',
                                        textAlign: 'center',
                                        border: '1px solid rgba(255,255,255,0.03)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                                    }}>
                                        <div style={{ color: '#94a3b8' }}>{peril.icon}</div>
                                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '500' }}>{peril.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* USP 2: Technology (Span 4) */}
                        <div style={{
                            gridColumn: isMobile ? 'span 1' : 'span 4',
                            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                            padding: '30px',
                            borderRadius: '24px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ width: '48px', height: '48px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                            </div>
                            <h3 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '10px' }}>Tomorrow's Tech</h3>
                            <ul style={{ listStyle: 'none', padding: 0, color: '#94a3b8', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    Satellite Based Monitoring
                                </li>
                                <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    Geo Tagging Precision
                                </li>
                                <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    127 Agro Climatic Zones
                                </li>
                                <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    Paperless KYC
                                </li>
                            </ul>
                        </div>


                        {/* USP 3: Empowering Farmers (Span 6) */}
                        <div style={{
                            gridColumn: isMobile ? 'span 1' : 'span 6',
                            background: '#0f172a',
                            padding: '30px',
                            borderRadius: '24px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <h3 style={{ color: 'white', fontSize: '1.3rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                Empowering Every Farmer
                            </h3>
                            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
                                We cover 100+ crops giving you the freedom to farm what you know best.
                                Our mission is to make farmers financially resilient and independent through fair, accessible insurance.
                            </p>
                        </div>

                        {/* USP 4: Precise Premiums (Span 6) */}
                        <div style={{
                            gridColumn: isMobile ? 'span 1' : 'span 6',
                            background: '#0f172a',
                            padding: '30px',
                            borderRadius: '24px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <h3 style={{ color: 'white', fontSize: '1.3rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                Precise & Fair Premiums
                            </h3>
                            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
                                Pay only for what you need. Our customized insurance coverages rely on data, not guesses, ensuring premiums are always affordable and claims are settled instantly.
                            </p>
                        </div>

                    </div>


                    {/* --- DETAILS SECTION ("How it Works") --- */}
                    <div id="how-it-works" style={{
                        background: 'rgba(30, 41, 59, 0.3)',
                        borderRadius: '24px',
                        padding: '40px',
                        marginTop: '0px', // Bento gap handled by flex container
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '40px', color: 'white' }}>How AgriChain Works</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '20px' }}>
                            {[
                                { step: '1', title: 'Register & Verify', desc: 'Secure farmer registration with Digital KYC. Wallet connection sets up your unique identity.' },
                                { step: '2', title: 'Select Protection', desc: 'Browse plans for your specific crop and region. Customize coverage against 8+ perils.' },
                                { step: '3', title: 'Smart Monitor', desc: 'Our Oracle & Satellite tech monitors your farm coordinates 24/7 for weather events.' },
                                { step: '4', title: 'Instance Payout', desc: 'When a trigger event (e.g. Flood) is verified, the Smart Contract pays you instantly.' }
                            ].map((s) => (
                                <div key={s.step} style={{ background: '#020617', padding: '25px', borderRadius: '20px', border: '1px solid #1e293b', position: 'relative' }}>
                                    <div style={{
                                        position: 'absolute', top: -15, left: 20,
                                        width: '40px', height: '40px', background: '#0f172a', color: '#10b981', borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '1px solid #10b981', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}>{s.step}</div>
                                    <h4 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '10px', marginTop: '15px' }}>{s.title}</h4>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>{s.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Testimonials removed per user request */}
                    </div>

                    {/* Comparison Section */}
                    <div style={{
                        background: '#0f172a',
                        borderRadius: '24px',
                        padding: '40px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <h2 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '30px', textAlign: 'center' }}>Why Blockchain?</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cbd5e1' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #334155' }}>
                                        <th style={{ textAlign: 'left', padding: '15px', color: '#94a3b8' }}>Feature</th>
                                        <th style={{ textAlign: 'left', padding: '15px', color: '#ef4444' }}>Traditional Insurance</th>
                                        <th style={{ textAlign: 'left', padding: '15px', color: '#10b981' }}>AgriChain (Blockchain)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '15px', fontWeight: '600' }}>Claim Time</td>
                                        <td style={{ padding: '15px' }}>Months (Manual)</td>
                                        <td style={{ padding: '15px', color: '#10b981', fontWeight: 'bold' }}>Minutes (Automatic)</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '15px', fontWeight: '600' }}>Transparency</td>
                                        <td style={{ padding: '15px' }}>Hidden / opaque process</td>
                                        <td style={{ padding: '15px', color: '#10b981', fontWeight: 'bold' }}>100% Public Ledger</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '15px', fontWeight: '600' }}>Trust</td>
                                        <td style={{ padding: '15px' }}>Low (Middlemen)</td>
                                        <td style={{ padding: '15px', color: '#10b981', fontWeight: 'bold' }}>Trustless (Code is Law)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Partners section removed per user request */}

                    {/* Enhanced Footer */}
                    <div style={{
                        background: '#020617',
                        borderRadius: '24px 24px 0 0',
                        padding: '60px 40px',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        marginTop: '40px'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr 1fr 1.5fr', gap: '40px', marginBottom: '40px' }}>
                            {/* Column 1: Brand */}
                            <div>
                                <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <img src={logo} alt="AgriChain Logo" style={{ height: '28px', width: 'auto' }} />
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #10b981, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        AgriChain
                                    </div>
                                </div>
                                <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.9rem' }}>
                                    Empowering farmers with transparent, blockchain based crop insurance. Instant payouts, zero paperwork, 100% trust.
                                </p>
                            </div>

                            {/* Column 2: Quick Links */}
                            <div>
                                <h4 style={{ color: 'white', marginBottom: '20px' }}>Quick Links</h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#94a3b8', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <li><a href="#!" style={{ color: 'inherit', textDecoration: 'none' }}>Home</a></li>
                                    <li><a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none' }}>How it Works</a></li>
                                    <li><a href="#!" style={{ color: 'inherit', textDecoration: 'none' }}>Our Products</a></li>
                                    <li><a href="#!" style={{ color: 'inherit', textDecoration: 'none' }}>Claims Process</a></li>
                                </ul>
                            </div>

                            {/* Column 3: Legal */}
                            <div>
                                <h4 style={{ color: 'white', marginBottom: '20px' }}>Legal</h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#94a3b8', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <li><a href="#!" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a></li>
                                    <li><a href="#!" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a></li>
                                    <li><a href="#!" style={{ color: 'inherit', textDecoration: 'none' }}>Cookie Policy</a></li>
                                    <li><a href="#!" style={{ color: 'inherit', textDecoration: 'none' }}>Disclaimers</a></li>
                                </ul>
                            </div>

                            {/* Column 4: Contact (Mini) */}
                            <div>
                                <h4 style={{ color: 'white', marginBottom: '20px' }}>Contact Us</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                        +91 8111010133
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                        agrichain010@gmail.com
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                        Sholinganallur, Chennai
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', borderTop: '1px solid #1e293b', paddingTop: '30px', color: '#64748b', fontSize: '0.85rem' }}>

                        </div>
                    </div>

                </section>
            </div>
        </div>
    );
};

export default Home;