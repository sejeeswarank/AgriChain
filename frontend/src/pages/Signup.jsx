import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { savePhoneEmailMapping, createUserProfile } from '../firebase';
import axios from 'axios';
import logo from '../assets/logo.png';

const Signup = () => {
    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // OTP state
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);

    // UI state
    const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { signupWithEmailPassword, user } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Validate form fields
    const validateForm = () => {
        if (!name.trim()) {
            setError('Full name is required');
            return false;
        }

        if (!email.trim()) {
            setError('Email address is required');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return false;
        }

        if (!phoneNumber || phoneNumber.length !== 10) {
            setError('Valid 10-digit mobile number is required');
            return false;
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            setError('Please enter a valid Indian mobile number');
            return false;
        }

        if (!password) {
            setError('Password is required');
            return false;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        return true;
    };

    // Step 1: Send Email OTP
    const handleSendOTP = async () => {
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('/api/send-email-otp', {
                email: email.toLowerCase(),
                purpose: 'signup'
            });

            if (response.data.success) {
                setOtpSent(true);
                setStep(2);
            } else {
                setError(response.data.error || 'Failed to send OTP');
            }
        } catch (err) {
            console.error('Send OTP error:', err);
            setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
        }

        setLoading(false);
    };

    // Step 2: Verify OTP and Create Account
    const handleVerifyOTP = async () => {
        setError('');

        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);

        try {
            // Verify OTP with backend
            const verifyResponse = await axios.post('/api/verify-email-otp', {
                email: email.toLowerCase(),
                otp: otp
            });

            if (!verifyResponse.data.success) {
                setError(verifyResponse.data.error || 'OTP verification failed');
                setLoading(false);
                return;
            }

            setOtpVerified(true);

            // OTP verified - now create Firebase account
            const result = await signupWithEmailPassword(email.toLowerCase(), password);

            if (!result.success) {
                setError(result.error || 'Failed to create account');
                setLoading(false);
                return;
            }

            const firebaseUser = result.user;

            // Save phone → email mapping
            await savePhoneEmailMapping(phoneNumber, email.toLowerCase());

            // Create user profile in Firestore
            await createUserProfile(firebaseUser, {
                fullName: name.trim(),
                mobileNumber: phoneNumber,
                email: email.toLowerCase(),
                authMethod: 'email',
                emailVerified: true,
                createdAt: new Date()
            });

            // Redirect to wallet connect page
            navigate('/wallet-connect');

        } catch (err) {
            console.error('Signup error:', err);
            setError(err.response?.data?.error || err.message || 'Account creation failed');
        }

        setLoading(false);
    };

    // Resend OTP
    const handleResendOTP = async () => {
        setOtp('');
        setError('');
        await handleSendOTP();
    };

    return (
        <div className="login-container">
            <div className="login-content">
                <div className="logo-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                    <img src={logo} alt="AgriChain Logo" style={{ height: '80px', width: 'auto' }} />
                    <div style={{ textAlign: 'left' }}>
                        <h1 className="logo-title" style={{ margin: 0, lineHeight: 1.2 }}>AgriChain <span className="logo-subtitle">Insurance</span></h1>
                        <p className="tagline" style={{ margin: 0, marginTop: '12px' }}>{t('auth.tagline')}</p>
                    </div>
                </div>

                <div className="login-card">
                    {/* Progress indicator */}
                    <div className="progress-steps" style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', gap: '8px' }}>
                        <div className={`step-dot ${step >= 1 ? 'active' : ''}`} style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: step >= 1 ? '#10b981' : '#475569'
                        }}></div>
                        <div className={`step-dot ${step >= 2 ? 'active' : ''}`} style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: step >= 2 ? '#10b981' : '#475569'
                        }}></div>
                    </div>

                    {step === 1 && (
                        <>
                            <h2>{t('signup.title')}</h2>
                            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                                {t('signup.subtitle')}
                            </p>

                            <form onSubmit={(e) => { e.preventDefault(); handleSendOTP(); }}>
                                <div className="input-group">
                                    <label>{t('signup.fullName')} </label>
                                    <input
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label>{t('signup.email')} </label>
                                    <input
                                        type="email"
                                        placeholder="farmer@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label>{t('signup.mobile')} </label>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{
                                            padding: '12px',
                                            background: '#020617',
                                            border: '1px solid #475569',
                                            borderRight: 'none',
                                            borderRadius: '8px 0 0 8px',
                                            color: '#94a3b8'
                                        }}>+91</span>
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
                                </div>

                                <div className="input-group">
                                    <label>{t('signup.password')} </label>
                                    <input
                                        type="password"
                                        placeholder="Minimum 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label>{t('signup.confirmPassword')} </label>
                                    <input
                                        type="password"
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <button className="primary-btn" type="submit" disabled={loading}>
                                    {loading ? <span className="spinner"></span> : t('signup.verifyEmail')}
                                </button>
                            </form>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <h2>{t('otp.email.title')}</h2>
                            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                                {t('signup.otpSentTo')} <strong style={{ color: '#10b981' }}>{email}</strong>
                            </p>

                            <form onSubmit={(e) => { e.preventDefault(); handleVerifyOTP(); }}>
                                <div className="input-group">
                                    <label>{t('login.enterOtp')} </label>
                                    <input
                                        type="text"
                                        placeholder="Enter 6 digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength="6"
                                        style={{
                                            textAlign: 'center',
                                            fontSize: '1.0rem',
                                            letterSpacing: '6px',
                                            fontWeight: 'bold'
                                        }}
                                        required
                                    />
                                </div>

                                <button className="primary-btn" type="submit" disabled={loading}>
                                    {loading ? <span className="spinner"></span> : t('signup.verifyOtp')}
                                </button>

                                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        disabled={loading}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#10b981',
                                            cursor: 'pointer',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        {t('signup.resendOtp')}
                                    </button>
                                </div>

                                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => { setStep(1); setOtp(''); setError(''); }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#94a3b8',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ← {t('signup.backToEdit')}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {error && <div className="error-message" style={{ marginTop: '16px' }}>{error}</div>}

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                            {t('signup.haveAccount')} <span style={{ color: '#10b981' }}>{t('signup.signIn')}</span>
                        </Link>
                    </div>

                    <div className="features" style={{ marginTop: '24px' }}>
                        <div className="feature-item">
                            <span>🌾</span>
                            <span>{t('features.farmerFriendly')}</span>
                        </div>
                        <div className="feature-item">
                            <span>🔐</span>
                            <span>{t('features.secureVerification')}</span>
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
                <div className="circle c4"></div>
            </div>
        </div>
    );
};

export default Signup;