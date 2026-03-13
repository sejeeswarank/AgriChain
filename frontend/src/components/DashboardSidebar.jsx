import React from 'react';
import PropTypes from 'prop-types';

const LANGUAGE_LABELS = { en: 'English', ta: 'Tamil', hi: 'Hindi', ml: 'Malayalam' };

const NAV_ITEMS = [
    { name: 'Overview', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
    { name: 'My Policies', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
    { name: 'Claims', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> },
    { name: 'Settings', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> }
];

const getSidebarWidth = (isMobile, isSidebarOpen) => {
    if (isMobile) return isSidebarOpen ? '100%' : '0px';
    return isSidebarOpen ? '260px' : '80px';
};

const DashboardSidebar = ({ isMobile, isSidebarOpen, setIsSidebarOpen, activeTab, setActiveTab, language, changeLanguage, logout, navigate, logo }) => {
    return (
        <aside style={{
            position: isMobile ? 'absolute' : 'relative',
            zIndex: 50,
            height: '100%',
            width: getSidebarWidth(isMobile, isSidebarOpen),
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRight: (isMobile && !isSidebarOpen) ? 'none' : '1px solid rgba(255,255,255,0.05)',
            padding: (isMobile && !isSidebarOpen) ? '0' : '30px 10px 10px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            boxSizing: 'border-box'
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
                        color: 'transparent',
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
                        <img src={logo} alt="Logo" style={{ height: '32px', width: 'auto', minWidth: '32px' }} />{' '}
                        <span>AgriChain</span>
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {NAV_ITEMS.map(item => {
                        const key = item.name.toLowerCase().replace(' ', '');
                        const isActive = activeTab === key;
                        return (
                            <button key={item.name}
                                onClick={() => setActiveTab(key)}
                                title={isSidebarOpen ? '' : item.name}
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
                                    justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                                    gap: '12px',
                                    marginBottom: '8px'
                                }}>
                                <div style={{ minWidth: '20px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                                {isSidebarOpen && <span style={{ whiteSpace: 'nowrap', opacity: isSidebarOpen ? 1 : 0, transition: 'opacity 0.2s' }}>{item.name}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* Language Switcher */}
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
                                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{LANGUAGE_LABELS[language] || language}</span>
                            </div>
                        )}
                    </button>
                </div>
            </div>

            <button onClick={() => { logout(); navigate('/'); }} title={isSidebarOpen ? '' : 'Logout'} style={{
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
    );
};

DashboardSidebar.propTypes = {
    isMobile: PropTypes.bool.isRequired,
    isSidebarOpen: PropTypes.bool.isRequired,
    setIsSidebarOpen: PropTypes.func.isRequired,
    activeTab: PropTypes.string.isRequired,
    setActiveTab: PropTypes.func.isRequired,
    language: PropTypes.string.isRequired,
    changeLanguage: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
    navigate: PropTypes.func.isRequired,
    logo: PropTypes.string.isRequired,
};

export default DashboardSidebar;
