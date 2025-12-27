import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../auth/AuthContext';

const WalletConnectPage = () => {
    const navigate = useNavigate();
    const { connectWallet, isConnecting, error, isWalletConnected } = useWallet();
    const { t } = useLanguage();
    const { logout } = useAuth();

    // If wallet already connected, redirect to login
    React.useEffect(() => {
        if (isWalletConnected) {
            const performLogoutAndRedirect = async () => {
                await logout(); // Force logout to prevent auto-redirect to dashboard
                setTimeout(() => {
                    navigate('/'); // Send to Login page
                }, 1500);
            };
            performLogoutAndRedirect();
        }
    }, [isWalletConnected, navigate, logout]);

    const handleConnect = async () => {
        const result = await connectWallet();
        if (result.success) {
            // Will be redirected by useEffect
        }
    };

    return (
        <div className="login-container">
            <div className="login-content">
                <div className="logo-section">
                    <h1 className="logo-title">AgriChain <span className="logo-subtitle">{t('common.insurance')}</span></h1>
                    <p className="tagline">{t('wallet.subtitle')}</p>
                </div>

                <div className="login-card">
                    {isWalletConnected ? (
                        <div className="success-card">
                            <div className="success-icon">✓</div>
                            <h2>{t('wallet.connected')}</h2>
                            <p>{t('wallet.redirecting')}</p>
                        </div>
                    ) : (
                        <>
                            <h2>🔗 {t('wallet.title')}</h2>
                            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                                {t('wallet.connectSubtitle')}
                            </p>

                            <div className="wallet-info" style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '12px',
                                padding: '16px',
                                marginBottom: '24px'
                            }}>
                                <h4 style={{ color: '#10b981', marginBottom: '8px' }}>{t('wallet.whyConnect')}</h4>
                                <ul style={{ color: '#94a3b8', fontSize: '0.9rem', paddingLeft: '20px', margin: 0 }}>
                                    <li>{t('wallet.reason1')}</li>
                                    <li>{t('wallet.reason2')}</li>
                                    <li>{t('wallet.reason3')}</li>
                                </ul>
                            </div>

                            <button
                                className="primary-btn"
                                onClick={handleConnect}
                                disabled={isConnecting}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                            >
                                {isConnecting ? (
                                    <span className="spinner"></span>
                                ) : (
                                    <>
                                        <img
                                            src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                                            alt="MetaMask"
                                            width="24"
                                        />
                                        {t('wallet.connectMetamask')}
                                    </>
                                )}
                            </button>

                            {error && (
                                <div className="error-message" style={{ marginTop: '16px' }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                <a
                                    href="https://metamask.io/download/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#94a3b8', fontSize: '0.85rem' }}
                                >
                                    {t('wallet.noMetamask')}
                                </a>
                            </div>
                        </>
                    )}

                    <div className="features" style={{ marginTop: '24px' }}>
                        <div className="feature-item">
                            <span>🔐</span>
                            <span>{t('wallet.secureConnection')}</span>
                        </div>
                        <div className="feature-item">
                            <span>⚡</span>
                            <span>{t('features.instantAccess')}</span>
                        </div>
                        <div className="feature-item">
                            <span>🌾</span>
                            <span>{t('features.farmerFocused')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="animated-bg">
                <div className="circle c1"></div>
                <div className="circle c2"></div>
                <div className="circle c3"></div>
            </div>
        </div>
    );
};

export default WalletConnectPage;
