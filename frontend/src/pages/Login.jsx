import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useLanguage } from '../context/LanguageContext';
import { getEmailByPhone } from '../firebase';
import axios from 'axios';

const Login = () => {
    // Input state
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'mobile'
    const [authMethod, setAuthMethod] = useState('password'); // 'password' or 'otp'
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');

    // Flow state
    const [step, setStep] = useState(1); // 1: Enter credentials, 2: Enter OTP (if OTP method)
    const [resolvedEmail, setResolvedEmail] = useState(''); // Email resolved from mobile

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const { user, loginWithEmailPassword } = useAuth();
    const { isWalletConnected, connectWallet } = useWallet();
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Get the email to use (direct email or resolved from mobile)
    const getTargetEmail = async () => {
        if (loginMethod === 'email') {
            return email.toLowerCase();
        } else {
            // Mobile login - fetch email from Firebase
            const fetchedEmail = await getEmailByPhone(mobile);
            if (!fetchedEmail) {
                throw new Error('No account found with this mobile number. Please sign up first.');
            }
            setResolvedEmail(fetchedEmail);
            return fetchedEmail;
        }
    };

    // Handle login with Password
    const handlePasswordLogin = async () => {
        setError('');
        setLoading(true);

        try {
            const targetEmail = await getTargetEmail();

            const result = await loginWithEmailPassword(targetEmail, password);

            if (result.success) {
                // Check wallet connection
                if (!isWalletConnected) {
                    // Prompt to connect wallet
                    const walletResult = await connectWallet();
                    if (!walletResult.success) {
                        console.log('Wallet not connected, proceeding anyway');
                    }
                }
                navigate('/dashboard');
            } else {
                setError(result.error || 'Invalid credentials. Please try again.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please try again.');
        }

        setLoading(false);
    };

    // Send OTP for login
    const handleSendOTP = async () => {
        setError('');
        setLoading(true);

        try {
            const targetEmail = await getTargetEmail();

            // Send OTP to the email
            const response = await axios.post('/api/send-email-otp', {
                email: targetEmail,
                purpose: 'login'
            });

            if (response.data.success) {
                setOtpSent(true);
                setStep(2);
            } else {
                setError(response.data.error || 'Failed to send OTP');
            }
        } catch (err) {
            console.error('Send OTP error:', err);
            setError(err.message || err.response?.data?.error || 'Failed to send OTP');
        }

        setLoading(false);
    };

    // Verify OTP and login
    const handleOTPLogin = async () => {
        setError('');
        setLoading(true);

        try {
            const targetEmail = loginMethod === 'email' ? email.toLowerCase() : resolvedEmail;

            // Verify OTP
            const verifyResponse = await axios.post('/api/verify-email-otp', {
                email: targetEmail,
                otp: otp
            });

            if (!verifyResponse.data.success) {
                setError(verifyResponse.data.error || 'Invalid OTP');
                setLoading(false);
                return;
            }

            // OTP verified - for OTP login, we need to sign in the user
            // Since Firebase doesn't support OTP sign-in directly, we'll use a custom token approach
            // For now, we'll check if user exists and allow access
            // In production, you'd use Firebase Admin SDK to create custom tokens

            // Store verified email in session for dashboard access
            sessionStorage.setItem('otpVerifiedEmail', targetEmail);

            // Check wallet connection
            if (!isWalletConnected) {
                const walletResult = await connectWallet();
                if (!walletResult.success) {
                    console.log('Wallet not connected, proceeding anyway');
                }
            }

            navigate('/dashboard');

        } catch (err) {
            console.error('OTP login error:', err);
            setError(err.message || err.response?.data?.error || 'Login failed');
        }

        setLoading(false);
    };

    // Handle form submit based on auth method
    const handleSubmit = (e) => {
        e.preventDefault();

        if (authMethod === 'password') {
            handlePasswordLogin();
        } else {
            if (step === 1) {
                handleSendOTP();
            } else {
                handleOTPLogin();
            }
        }
    };

    return (
        <div className="login-container">
            <div className="login-content">
                <div className="logo-section">
                    <h1 className="logo-title">AgriChain <span className="logo-subtitle">Insurance</span></h1>
                    <p className="tagline">{t('auth.tagline')}</p>
                </div>

                <div className="login-card">
                    <h2>{t('login.title')}</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                        {t('login.subtitle')}
                    </p>

                    {/* Login Method Tabs Removed for Single Input Flow */}

                    <form onSubmit={handleSubmit}>
                        {/* Single Input for Email or Mobile */}
                        {step === 1 && (
                            <>
                                <div className="input-group">
                                    <label>{t('login.emailOrMobile') || 'Email or Mobile Number'} *</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Email or Mobile Number"
                                        value={loginMethod === 'mobile' ? mobile : email}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Simple heuristic: if it has only digits (and maybe length > 3), treat as mobile
                                            const isNum = /^\d+$/.test(val);
                                            if (isNum) {
                                                setLoginMethod('mobile');
                                                setMobile(val);
                                                setEmail(''); // clear email
                                            } else {
                                                setLoginMethod('email');
                                                setEmail(val);
                                                setMobile(''); // clear mobile
                                            }
                                        }}
                                        required
                                    />
                                    {loginMethod === 'mobile' && (
                                        <div className="input-note" style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                                            {t('login.mobileNote')}
                                        </div>
                                    )}
                                </div>

                                {/* Auth Method Selection */}
                                <div className="auth-method" style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0' }}>
                                        {t('login.verifyUsing')}
                                    </label>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            color: '#94a3b8'
                                        }}>
                                            <input
                                                type="radio"
                                                name="authMethod"
                                                value="password"
                                                checked={authMethod === 'password'}
                                                onChange={() => setAuthMethod('password')}
                                            />
                                            {t('login.password')}
                                        </label>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            color: '#94a3b8'
                                        }}>
                                            <input
                                                type="radio"
                                                name="authMethod"
                                                value="otp"
                                                checked={authMethod === 'otp'}
                                                onChange={() => setAuthMethod('otp')}
                                            />
                                            {t('login.emailOtp')}
                                        </label>
                                    </div>
                                </div>

                                {/* Password Input (if password method) */}
                                {authMethod === 'password' && (
                                    <div className="input-group">
                                        <label>{t('login.password')} *</label>
                                        <input
                                            type="password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}

                                <button className="primary-btn" type="submit" disabled={loading}>
                                    {loading ? (
                                        <span className="spinner"></span>
                                    ) : authMethod === 'password' ? (
                                        t('login.signIn')
                                    ) : (
                                        t('login.sendOtp')
                                    )}
                                </button>
                            </>
                        )}

                        {/* OTP Input (Step 2) */}
                        {step === 2 && (
                            <>
                                <div style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '20px'
                                }}>
                                    <p style={{ color: '#10b981', margin: 0, fontSize: '0.9rem' }}>
                                        📧 {t('login.otpSentTo')} <strong>{loginMethod === 'email' ? email : resolvedEmail}</strong>
                                    </p>
                                </div>

                                <div className="input-group">
                                    <label>{t('login.enterOtp')} *</label>
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength="6"
                                        style={{
                                            textAlign: 'center',
                                            fontSize: '1.5rem',
                                            letterSpacing: '8px',
                                            fontWeight: 'bold'
                                        }}
                                        required
                                    />
                                </div>

                                <button className="primary-btn" type="submit" disabled={loading}>
                                    {loading ? <span className="spinner"></span> : t('login.verifySignIn')}
                                </button>

                                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                    <button
                                        type="button"
                                        onClick={() => { setStep(1); setOtp(''); }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#94a3b8',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ← {t('login.back')}
                                    </button>
                                    <span style={{ color: '#475569', margin: '0 12px' }}>|</span>
                                    <button
                                        type="button"
                                        onClick={handleSendOTP}
                                        disabled={loading}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#10b981',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {t('login.resendOtp')}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>

                    {error && <div className="error-message" style={{ marginTop: '16px' }}>{error}</div>}

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <Link to="/signup" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                            {t('login.noAccount')} <span style={{ color: '#10b981' }}>{t('login.signUp')}</span>
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
            </div>
        </div>
    );
};

export default Login;