import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, savePhoneEmailMapping, createUserProfile } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [emailVerificationSent, setEmailVerificationSent] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const validateForm = () => {
        if (!name.trim()) {
            setError(t('error.required'));
            return false;
        }

        if (!email.trim()) {
            setError(t('auth.email') + ' ' + t('error.required').toLowerCase());
            return false;
        }

        if (!phoneNumber || phoneNumber.length !== 10) {
            setError(t('auth.phone') + ' ' + t('error.required').toLowerCase());
            return false;
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            setError(t('error.invalidPhone'));
            return false;
        }

        if (!password) {
            setError(t('auth.password') + ' ' + t('error.required').toLowerCase());
            return false;
        }

        if (password.length < 6) {
            setError(t('error.passwordLength'));
            return false;
        }

        if (password !== confirmPassword) {
            setError(t('error.passwordMismatch'));
            return false;
        }

        return true;
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Create Firebase user with email and password
            const userCredential = await createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Save phone → email mapping in Firestore
            await savePhoneEmailMapping(phoneNumber, email);

            // Create user profile
            await createUserProfile(user, {
                name: name.trim(),
                phone: phoneNumber,
                authMethod: 'email',
                emailVerified: false, // Will be updated when email is verified
                lastLogin: new Date()
            });

            // Send email verification
            await sendEmailVerification(user);

            setEmailVerificationSent(true);
            setSuccess(true);

        } catch (error) {
            console.error('Signup error:', error);
            switch (error.code) {
                case 'auth/email-already-in-use':
                    setError(t('auth.error.emailInUse'));
                    break;
                case 'auth/invalid-email':
                    setError(t('auth.error.invalidEmail'));
                    break;
                case 'auth/weak-password':
                    setError(t('auth.error.weakPassword'));
                    break;
                case 'auth/network-request-failed':
                    setError(t('auth.error.network'));
                    break;
                default:
                    setError(t('auth.error.creationFailed'));
            }
        }
        setLoading(false);
    };


    if (success) {
        return (
            <div className="login-container">
                <div className="login-content">
                    <div className="success-card">
                        <div className="success-icon">✓</div>
                        <h2>{t('success.accountCreated')}</h2>
                        <p>Verification email sent. Please verify your email before logging in.</p>
                        <Link to="/" className="primary-btn" style={{ marginTop: '20px', display: 'inline-block', textDecoration: 'none' }}>
                            {t('auth.signInWithPhone')}
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
                    <h2>{t('auth.signup.title')}</h2>
                    <p>{t('auth.signup.subtitle')}</p>

                    <form onSubmit={handleSignup}>
                        <div className="input-group">
                            <label>{t('auth.name')}</label>
                            <input
                                type="text"
                                placeholder={t('auth.name').toLowerCase()}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>{t('auth.email')}</label>
                            <input
                                type="email"
                                placeholder="farmer@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

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

                        <div className="input-group">
                            <label>{t('auth.password')}</label>
                            <input
                                type="password"
                                placeholder={t('auth.password').toLowerCase()}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <div className="input-note">
                                {t('error.passwordLength')}
                            </div>
                        </div>

                        <div className="input-group">
                            <label>{t('auth.confirmPassword')}</label>
                            <input
                                type="password"
                                placeholder={t('auth.confirmPassword').toLowerCase()}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button className="primary-btn" type="submit" disabled={loading}>
                            {loading ? <span className="spinner"></span> : t('auth.signup')}
                        </button>
                    </form>

                    {error && <div className="error-message">{error}</div>}

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                background: 'transparent',
                                border: '1px solid #475569',
                                color: '#94a3b8',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            {t('auth.signInWithPhone')}
                        </button>
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

export default Signup;