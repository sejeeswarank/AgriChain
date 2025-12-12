import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, signInWithEmailAndPassword, createUserWithEmailAndPassword, createUserProfile } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

function MobileVerification() {
    const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'email'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { t } = useLanguage();

    const sendOTP = async () => {
        if (!phoneNumber) {
            setError(t('error.required'));
            return;
        }

        // Validate phone number format (Indian mobile numbers)
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            setError(t('error.invalidPhone'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Initialize reCAPTCHA if not already done
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                    callback: (response) => {
                        console.log("reCAPTCHA solved");
                    },
                    'expired-callback': () => {
                        console.log("reCAPTCHA expired");
                    }
                });
            }

            const confirmationResult = await signInWithPhoneNumber(auth, `+91${phoneNumber}`, window.recaptchaVerifier);
            setConfirmationResult(confirmationResult);
            setError(''); // Clear any previous errors
        } catch (error) {
            console.error('Send OTP error:', error);
            setError(error.message || "Failed to send OTP");
        }
        setLoading(false);
    };

    const verifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            setError(t('error.otpInvalid'));
            return;
        }

        if (!confirmationResult) {
            setError("Please request OTP first");
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await confirmationResult.confirm(otp);
            const user = result.user;

            // Create user profile in Firestore
            await createUserProfile(user, {
                name: name || '',
                authMethod: 'phone',
                lastLogin: new Date()
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/verify');
            }, 3000);
        } catch (error) {
            console.error('Verify OTP error:', error);
            setError(error.message || t('error.otpInvalid'));
        }
        setLoading(false);
    };

    const handleEmailAuth = async () => {
        if (!email || !password) {
            setError(t('error.required'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            let userCredential;
            if (isSignup) {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Create user profile with name for new users
                await createUserProfile(userCredential.user, {
                    name: name || '',
                    authMethod: 'email',
                    lastLogin: new Date()
                });
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
                // Update last login for existing users
                await createUserProfile(userCredential.user, {
                    lastLogin: new Date()
                });
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/verify');
            }, 3000);
        } catch (error) {
            console.error('Email auth error:', error);
            setError(error.message || "Authentication failed");
        }
        setLoading(false);
    };

    const toggleLoginMethod = () => {
        setLoginMethod(loginMethod === 'phone' ? 'email' : 'phone');
        setError('');
        setOtp('');
        setEmail('');
        setPassword('');
        setName('');
        setIsSignup(false);
    };

    const resetForm = () => {
        setOtp('');
        setError('');
    };

    if (success) {
        return (
            <div className="login-container">
                <div className="login-content">
                    <div className="success-card">
                        <div className="success-icon">✓</div>
                        <h2>{t('success.verification')}</h2>
                        <p>{t('common.loading')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-content">
                <div className="logo-section">
                    <h1 className="logo-title">AgriChain <span className="logo-subtitle">{t('common.insurance')}</span></h1>
                    <p className="tagline">{t('auth.tagline')}</p>
                </div>

                <div className="login-card">
                    <h2>{loginMethod === 'phone' ? t('auth.mobileVerification') : t('auth.emailLogin')}</h2>
                    <p>{loginMethod === 'phone' ? t('auth.mobileSubtitle') : t('auth.emailSubtitle')}</p>

                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <button
                            onClick={toggleLoginMethod}
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
                            {loginMethod === 'phone' ? t('auth.loginWithEmail') : t('auth.loginWithPhone')}
                        </button>
                    </div>

                    {loginMethod === 'phone' ? (
                        <>
                            <div className="input-group">
                                <label>{t('auth.phone')}</label>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ padding: '12px', background: '#020617', border: '1px solid #475569', borderRight: 'none', borderRadius: '8px 0 0 8px', color: '#94a3b8' }}>+91</span>
                                    <input
                                        type="tel"
                                        placeholder="9876543210"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        maxLength="10"
                                        style={{ borderRadius: '0 8px 8px 0', borderLeft: 'none' }}
                                    />
                                </div>
                                <div className="input-hint">
                                    {phoneNumber.length}/10 {t('auth.digitsEntered')}
                                </div>
                                <div className="input-note">
                                    {t('auth.demoNote')}
                                </div>
                            </div>

                            <button className="primary-btn" onClick={sendOTP} disabled={loading}>
                                {loading ? <span className="spinner"></span> : t('auth.sendOtp')}
                            </button>

                            <div className="otp-section">
                                <div className="otp-input">
                                    <label>{t('auth.enterOtp')}</label>
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength="6"
                                    />
                                    <div className="input-note" style={{ marginTop: '8px', fontSize: '0.8rem' }}>
                                        {t('auth.otpNote')}
                                    </div>
                                </div>

                                <button className="primary-btn" onClick={verifyOTP} disabled={loading}>
                                    {loading ? <span className="spinner"></span> : t('auth.verifyMobile')}
                                </button>

                                <button className="secondary-btn" onClick={resetForm}>
                                    {t('auth.changeNumber')}
                                </button>

                                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                                    <button
                                        onClick={() => navigate('/signup')}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#94a3b8',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        {t('auth.noAccount')} {t('auth.signUp')}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="input-group">
                                <label>{t('auth.email')}</label>
                                <input
                                    type="email"
                                    placeholder="farmer@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {isSignup && (
                                <div className="input-group">
                                    <label>{t('auth.name')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('auth.name')}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="input-group">
                                <label>{t('auth.password')}</label>
                                <input
                                    type="password"
                                    placeholder={t('auth.password')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button className="primary-btn" onClick={handleEmailAuth} disabled={loading}>
                                {loading ? <span className="spinner"></span> : (isSignup ? t('auth.signUp') : t('auth.login'))}
                            </button>

                            <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                <button
                                    onClick={() => isSignup ? setIsSignup(false) : navigate('/signup')}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    {isSignup ? `${t('auth.haveAccount')} ${t('auth.login')}` : `${t('auth.noAccount')} ${t('auth.signUp')}`}
                                </button>
                            </div>
                        </>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    <div className="features">
                        <div className="feature-item">
                            <span>{loginMethod === 'phone' ? '📱' : '📧'}</span>
                            <span>{loginMethod === 'phone' ? t('features.mobileVerified') : t('auth.emailSecure')}</span>
                        </div>
                        <div className="feature-item">
                            <span>🔐</span>
                            <span>{t('features.firebaseAuth')}</span>
                        </div>
                        <div className="feature-item">
                            <span>🌾</span>
                            <span>{t('features.farmerFriendly')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* reCAPTCHA container */}
            <div id="recaptcha-container"></div>

            <div className="animated-bg">
                <div className="circle c1"></div>
                <div className="circle c2"></div>
                <div className="circle c3"></div>
            </div>
        </div>
    );
}

export default MobileVerification;