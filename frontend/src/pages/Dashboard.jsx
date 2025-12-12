import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import InsuranceDashboard from '../components/InsuranceDashboard';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [verificationStatus, setVerificationStatus] = useState({
        email: false,
        phone: false,
        wallet: false
    });

    useEffect(() => {
        if (user) {
            // Check verification status from user profile
            setVerificationStatus({
                email: user.emailVerified || false,
                phone: user.phoneVerified || false, // Assuming this is stored in Firestore
                wallet: !!localStorage.getItem('vcHash') // Check if wallet was connected/verified
            });
        }
    }, [user]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Failed to logout', error);
        }
    };

    if (!user) {
        return <div className="loading-spinner">{t('common.loading')}</div>; // Or redirect
    }

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="nav-brand">AgriChain</div>
                <div className="nav-profile">
                    <div className="avatar">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="Profile" />
                        ) : (
                            <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                        )}
                    </div>
                    <span>{user.name}</span>
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
                        <p>{t('profile.welcome')}, {user.name}!</p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>{t('profile.accountStatus')}</h3>
                            <div className="status-badge verified">
                                {t('profile.verified')}
                            </div>
                            <p>{t('profile.memberSince')}: {new Date(user.createdAt?.toDate()).toLocaleDateString()}</p>
                        </div>

                        <div className="stat-card">
                            <h3>{t('profile.authMethod')}</h3>
                            <div className="auth-methods">
                                <div className={`method ${verificationStatus.phone ? 'active' : ''}`}>
                                    <span className="icon">📱</span> {t('profile.phoneNumber')}
                                </div>
                                <div className={`method ${verificationStatus.email ? 'active' : ''}`}>
                                    <span className="icon">✉️</span> {t('profile.emailAddress')}
                                </div>
                            </div>
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