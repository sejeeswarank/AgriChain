import React from 'react';
import PropTypes from 'prop-types';

const DashboardHeader = ({ isMobile, userProfile, walletAddress, isWalletConnected, connectWallet, disconnectWallet, setIsSidebarOpen, logo }) => {
    if (isMobile) {
        return (
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            style={{ background: 'transparent', border: 'none', color: '#94a3b8', padding: 0, cursor: 'pointer' }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                        </button>
                        <button style={{ background: 'transparent', border: 'none', color: '#94a3b8', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                        </button>
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
                            <img src={logo} alt="Logo" style={{ height: '28px', width: 'auto' }} />{' '}
                            <span>AgriChain</span>
                        </div>
                    </div>

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

                <div>
                    <h1 style={{ fontSize: '1.6rem', color: 'white', marginBottom: '4px', lineHeight: 1.2 }}>Welcome back, <br />{userProfile?.fullName || 'Farmer'}</h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Here&apos;s what&apos;s happening today.</p>
                </div>
            </div>
        );
    }

    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
            <div>
                <h1 style={{ fontSize: '2rem', color: 'white', marginBottom: '5px' }}>Welcome back, {userProfile?.fullName || 'Farmer'}</h1>
                <p style={{ color: '#94a3b8' }}>Here&apos;s what&apos;s happening with your crops today.</p>
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
    );
};

DashboardHeader.propTypes = {
    isMobile: PropTypes.bool.isRequired,
    userProfile: PropTypes.object,
    walletAddress: PropTypes.string,
    isWalletConnected: PropTypes.bool.isRequired,
    connectWallet: PropTypes.func.isRequired,
    disconnectWallet: PropTypes.func.isRequired,
    setIsSidebarOpen: PropTypes.func.isRequired,
    logo: PropTypes.string.isRequired,
};

export default DashboardHeader;
