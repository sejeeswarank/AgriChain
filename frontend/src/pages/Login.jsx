import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getEmailByPhone, checkEmailVerified, sendSignInLinkToEmail } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Get email by phone number from Firestore
            const email = await getEmailByPhone(phoneNumber);
            if (!email) {
                setError('No account found with this phone number. Please sign up first.');
                setLoading(false);
                return;
            }

            // Check if email is verified
            const isVerified = await checkEmailVerified(email);
            if (!isVerified) {
                setError('Please verify your email first.');
                setLoading(false);
                return;
            }

            // Send sign-in link to email
            const actionCodeSettings = {
                url: `${window.location.origin}/login?email=${encodeURIComponent(email)}`,
                handleCodeInApp: true,
            };

            await sendSignInLinkToEmail(email, actionCodeSettings);

            // Store email in localStorage for sign-in completion
            localStorage.setItem('emailForSignIn', email);
            setEmailSent(true);

        } catch (error) {
            console.error('Login error:', error);
            setError('Failed to send login link. Please try again.');
        }
        setLoading(false);
    };

    if (emailSent) {
        return (
            <div className="login-container">
                <div className="login-content">
                    <div className="success-card">
                        <div className="success-icon">✓</div>
                        <h2>Login Link Sent!</h2>
                        <p>Check your email for the login link. Click the link to complete your login.</p>
                        <Link to="/" className="primary-btn" style={{ marginTop: '20px', display: 'inline-block', textDecoration: 'none' }}>
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-content">
                <div className="logo-section">
                    <h1 className="logo-title">AgriChain <span className="logo-subtitle">Insurance</span></h1>
                    <p className="tagline">{t('auth.tagline')}</p>
                </div>

                <div className="login-card">
                    <h2>{t('auth.signIn')}</h2>
                    <p>{t('auth.signInSubtitle')}</p>

                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label>{t('auth.phone')} *</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ padding: '12px', background: '#020617', border: '1px solid #475569', borderRight: 'none', borderRadius: '8px 0 0 8px', color: '#94a3b8' }}>+91</span>
                                <input
                                    type="tel"
                                    placeholder="9876543210"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    maxLength="10"
                                    required
                                    style={{ borderRadius: '0 8px 8px 0', borderLeft: 'none' }}
                                />
                            </div>
                            <div className="input-note">
                                {t('auth.phone')} {t('error.required').toLowerCase()}
                            </div>
                        </div>

                        <button className="primary-btn" type="submit" disabled={loading}>
                            {loading ? <span className="spinner"></span> : t('auth.signIn')}
                        </button>
                    </form>

                    {error && <div className="error-message">{error}</div>}

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <Link to="/signup" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                            {t('auth.noAccount')} <span style={{ color: '#10b981' }}>{t('auth.signup')}</span>
                        </Link>
                    </div>

                    <div className="features">
                        <div className="feature-item">
                            <span>🌾</span>
                            <span>{t('features.farmerFriendly')}</span>
                        </div>
                        <div className="feature-item">
                            <span>🔐</span>
                            <span>{t('features.firebaseAuth')}</span>
                        </div>
                        <div className="feature-item">
                            <span>📱</span>
                            <span>{t('features.mobileVerified')}</span>
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

export default Login;