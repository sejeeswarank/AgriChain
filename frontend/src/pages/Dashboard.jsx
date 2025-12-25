import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import InsuranceDashboard from '../components/InsuranceDashboard';

const Dashboard = () => {
    const { user, userProfile, logout } = useAuth();
    const { walletAddress, isWalletConnected, connectWallet, isConnecting, disconnectWallet } = useWallet();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [showWalletPrompt, setShowWalletPrompt] = useState(false);

    // Check wallet connection on mount
    useEffect(() => {
        if (!isWalletConnected) {
            setShowWalletPrompt(true);
        }
    }, [isWalletConnected]);

    const handleLogout = async () => {
        try {
            disconnectWallet();
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Failed to logout', error);
        }
    };

    const handleConnectWallet = async () => {
        const result = await connectWallet();
        if (result.success) {
            setShowWalletPrompt(false);
        }
    };

    // Format wallet address for display
    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (!user) {
        return <div className="loading-spinner">{t('common.loading')}</div>;
    }

    return (
        <div className="dashboard-container">
            {/* Wallet Connection Prompt Modal */}
            {showWalletPrompt && !isWalletConnected && (
                <div className="wallet-prompt-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="wallet-prompt-card" style={{
                        background: '#1e293b',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '400px',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ color: '#10b981', marginBottom: '16px' }}>🔗 Connect Wallet</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                            Connect your MetaMask wallet to access blockchain features and purchase insurance policies.
                        </p>
                        <button
                            className="primary-btn"
                            onClick={handleConnectWallet}
                            disabled={isConnecting}
                            style={{ width: '100%', marginBottom: '12px' }}
                        >
                            {isConnecting ? (
                                <span className="spinner"></span>
                            ) : (
                                <>
                                    <img
                                        src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                                        alt="MetaMask"
                                        width="20"
                                        style={{ marginRight: '8px' }}
                                    />
                                    Connect MetaMask
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setShowWalletPrompt(false)}
                            style={{
                                background: 'transparent',
                                border: '1px solid #475569',
                                color: '#94a3b8',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            )}

            <nav className="dashboard-nav">
                <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src="/logo.png" alt="AgriChain Logo" style={{ height: '60px', width: 'auto' }} />
                    <span style={{ fontSize: '1.8rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #10b981, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        AgriChain
                    </span>
                </div>
                <div className="nav-profile" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Wallet Status */}
                    {isWalletConnected ? (
                        <div className="wallet-status" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            padding: '8px 12px',
                            borderRadius: '8px'
                        }}>
                            <span style={{ color: '#10b981' }}>🔗</span>
                            <span style={{ color: '#10b981', fontSize: '0.85rem' }}>
                                {formatAddress(walletAddress)}
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowWalletPrompt(true)}
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            ⚠️ Connect Wallet
                        </button>
                    )}

                    <div className="avatar">
                        <span>{userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                    <span>{userProfile?.fullName || user.email}</span>
                    <button onClick={handleLogout} className="logout-btn">
                        {t('profile.logout')}
                    </button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="sidebar">
                    <div className="menu-item active">
                        <span className="icon">👤</span> {t('dashboard.profile')}
                    </div>
                    <div className="menu-item">
                        <span className="icon">📄</span> {t('dashboard.policies')}
                    </div>
                    <div className="menu-item">
                        <span className="icon">💰</span> {t('dashboard.claims')}
                    </div>
                </div>

                <div className="main-content">
                    <div className="profile-header">
                        <h1>{t('profile.title')}</h1>
                        <p>{t('profile.welcome')}, {userProfile?.fullName || 'User'}!</p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>{t('profile.accountStatus')}</h3>
                            <div className="status-badge verified">
                                {t('profile.verified')}
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '8px' }}>
                                Email: {userProfile?.email || user.email}
                            </p>
                        </div>

                        <div className="stat-card">
                            <h3>Wallet Status</h3>
                            {isWalletConnected ? (
                                <div>
                                    <div className="status-badge verified">Connected</div>
                                    <p style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '8px', fontFamily: 'monospace' }}>
                                        {formatAddress(walletAddress)}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="status-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                                        Not Connected
                                    </div>
                                    <button
                                        onClick={() => setShowWalletPrompt(true)}
                                        style={{
                                            marginTop: '8px',
                                            background: '#10b981',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        Connect Now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="info-section">
                        <h2>{t('profile.quickActions')}</h2>
                        <div className="action-buttons">
                            <button className="action-btn">{t('profile.updateProfile')}</button>
                            <button className="action-btn">{t('profile.changePassword')}</button>
                        </div>
                    </div>

                    {/* Insurance Dashboard Integration */}
                    <div className="insurance-section" style={{ marginTop: '40px', borderTop: '1px solid #334155', paddingTop: '20px' }}>
                        <InsuranceDashboard />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;