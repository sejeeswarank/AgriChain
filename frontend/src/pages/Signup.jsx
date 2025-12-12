import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailOTP, verifyEmailOTP, sendMobileOTP, verifyMobileOTP, createUserProfile } from '../firebase';
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

    // Multi-step signup states
    const [currentStep, setCurrentStep] = useState(1); // 1: Form, 2: Email OTP, 3: Mobile OTP, 4: Create Account
    const [emailOTP, setEmailOTP] = useState('');
    const [mobileOTP, setMobileOTP] = useState('');
    const [emailVerified, setEmailVerified] = useState(false);
    const [mobileVerified, setMobileVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

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

    const handleSendOTPs = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setOtpLoading(true);

        try {
            // Send email OTP
            const emailResult = await sendEmailOTP(email);
            if (!emailResult.success) {
                throw new Error('Failed to send email OTP');
            }

            // Send mobile OTP
            const mobileResult = await sendMobileOTP(`+91${phoneNumber}`);
            if (!mobileResult.success) {
                throw new Error('Failed to send mobile OTP');
            }

            setCurrentStep(2); // Move to email OTP verification
        } catch (error) {
            console.error('OTP sending error:', error);
            setError(t('auth.error.sendOtpFailed'));
        }

        setOtpLoading(false);
    };

    const handleVerifyEmailOTP = async () => {
        if (!emailOTP || emailOTP.length !== 6) {
            setError(t('otp.email.placeholder'));
            return;
        }

        setOtpLoading(true);

        try {
            const result = await verifyEmailOTP(email, emailOTP);
            if (result.success) {
                setEmailVerified(true);
                setCurrentStep(3); // Move to mobile OTP verification
                setError('');
            } else {
                setError(t('error.otpInvalid'));
            }
        } catch (error) {
            console.error('Email OTP verification error:', error);
            setError(t('error.otpExpired'));
        }

        setOtpLoading(false);
    };

    const handleVerifyMobileOTP = async () => {
        if (!mobileOTP || mobileOTP.length !== 6) {
            setError(t('otp.mobile.placeholder'));
            return;
        }

        setOtpLoading(true);

        try {
            const result = await verifyMobileOTP(`+91${phoneNumber}`, mobileOTP);
            if (result.success) {
                setMobileVerified(true);
                setCurrentStep(4); // Move to account creation
                setError('');
            } else {
                setError(t('error.otpInvalid'));
            }
        } catch (error) {
            console.error('Mobile OTP verification error:', error);
            setError(t('error.otpExpired'));
        }

        setOtpLoading(false);
    };

    const handleCreateAccount = async () => {
        setLoading(true);
        setError('');

        try {
            const userCredential = await createUserWithEmailAndPassword(email, password);

            // Create user profile with additional data including phone number
            await createUserProfile(userCredential.user, {
                name: name.trim(),
                phone: `+91${phoneNumber}`,
                authMethod: 'email',
                emailVerified: true,
                phoneVerified: true,
                lastLogin: new Date()
            });

            console.log('User created successfully:', userCredential.user.uid);

            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);

        } catch (error) {
            console.error('Account creation error:', error);
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
                        <p>{t('dashboard.welcome')}</p>
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

                    {/* Step indicator */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                backgroundColor: currentStep >= 1 ? '#10b981' : '#475569',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>1</div>
                            <div style={{
                                width: '40px',
                                height: '2px',
                                backgroundColor: currentStep >= 2 ? '#10b981' : '#475569',
                                margin: '0 5px'
                            }}></div>
                            <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                backgroundColor: currentStep >= 2 ? '#10b981' : '#475569',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>2</div>
                            <div style={{
                                width: '40px',
                                height: '2px',
                                backgroundColor: currentStep >= 3 ? '#10b981' : '#475569',
                                margin: '0 5px'
                            }}></div>
                            <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                backgroundColor: currentStep >= 3 ? '#10b981' : '#475569',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>3</div>
                            <div style={{
                                width: '40px',
                                height: '2px',
                                backgroundColor: currentStep >= 4 ? '#10b981' : '#475569',
                                margin: '0 5px'
                            }}></div>
                            <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                backgroundColor: currentStep >= 4 ? '#10b981' : '#475569',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>4</div>
                        </div>
                    </div>

                    {currentStep === 1 && (
                        <form onSubmit={handleSendOTPs}>
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

                            <button className="primary-btn" type="submit" disabled={otpLoading}>
                                {otpLoading ? <span className="spinner"></span> : t('auth.signup')}
                            </button>
                        </form>
                    )}

                    {currentStep === 2 && (
                        <div>
                            <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#94a3b8' }}>
                                {t('otp.email.title')}
                            </h3>
                            <p style={{ textAlign: 'center', marginBottom: '20px', color: '#64748b' }}>
                                {t('otp.email.subtitle')} {email}
                            </p>
                            <div className="input-group">
                                <label>{t('otp.email.placeholder')}</label>
                                <input
                                    type="text"
                                    placeholder={t('otp.email.placeholder')}
                                    value={emailOTP}
                                    onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength="6"
                                    style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '4px' }}
                                />
                            </div>
                            <button
                                className="primary-btn"
                                onClick={handleVerifyEmailOTP}
                                disabled={otpLoading || emailOTP.length !== 6}
                                style={{ marginTop: '10px' }}
                            >
                                {otpLoading ? <span className="spinner"></span> : t('otp.verify.email')}
                            </button>
                            <button
                                onClick={() => setCurrentStep(1)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #475569',
                                    color: '#94a3b8',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    marginTop: '10px',
                                    width: '100%'
                                }}
                            >
                                {t('common.back')}
                            </button>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div>
                            <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#94a3b8' }}>
                                {t('otp.mobile.title')}
                            </h3>
                            <p style={{ textAlign: 'center', marginBottom: '20px', color: '#64748b' }}>
                                {t('otp.mobile.subtitle')} +91{phoneNumber}
                            </p>
                            <div className="input-group">
                                <label>{t('otp.mobile.placeholder')}</label>
                                <input
                                    type="text"
                                    placeholder={t('otp.mobile.placeholder')}
                                    value={mobileOTP}
                                    onChange={(e) => setMobileOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength="6"
                                    style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '4px' }}
                                />
                            </div>
                            <button
                                className="primary-btn"
                                onClick={handleVerifyMobileOTP}
                                disabled={otpLoading || mobileOTP.length !== 6}
                                style={{ marginTop: '10px' }}
                            >
                                {otpLoading ? <span className="spinner"></span> : t('otp.verify.mobile')}
                            </button>
                            <button
                                onClick={() => setCurrentStep(2)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #475569',
                                    color: '#94a3b8',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    marginTop: '10px',
                                    width: '100%'
                                }}
                            >
                                {t('common.back')}
                            </button>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div>
                            <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#94a3b8' }}>
                                {t('auth.signup.title')}
                            </h3>
                            <p style={{ textAlign: 'center', marginBottom: '20px', color: '#64748b' }}>
                                {t('success.verification')}
                            </p>
                            <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#94a3b8' }}>{t('auth.name')}:</span>
                                    <span style={{ color: '#f1f5f9' }}>{name}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#94a3b8' }}>{t('auth.email')}:</span>
                                    <span style={{ color: '#f1f5f9' }}>{email} ✓</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>{t('auth.phone')}:</span>
                                    <span style={{ color: '#f1f5f9' }}>+91{phoneNumber} ✓</span>
                                </div>
                            </div>
                            <button
                                className="primary-btn"
                                onClick={handleCreateAccount}
                                disabled={loading}
                            >
                                {loading ? <span className="spinner"></span> : t('auth.signup')}
                            </button>
                            <button
                                onClick={() => setCurrentStep(3)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #475569',
                                    color: '#94a3b8',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    marginTop: '10px',
                                    width: '100%'
                                }}
                            >
                                {t('common.back')}
                            </button>
                        </div>
                    )}

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