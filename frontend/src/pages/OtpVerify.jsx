import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyEmailOTP, signInWithCustomToken, sendEmailOTP } from '../firebase';
import logo from '../assets/logo.png';

const OtpVerify = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendDisabled, setResendDisabled] = useState(true);
    const [countdown, setCountdown] = useState(30);

    const navigate = useNavigate();
    const location = useLocation();

    // Get email from location state
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate('/login');
            return;
        }

        // Start countdown for resend
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setResendDisabled(false);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [email, navigate]);

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await verifyEmailOTP(email, otp);
            // Sign in with custom token
            await signInWithCustomToken(result.customToken);
            navigate('/dashboard');
        } catch (error) {
            console.error('OTP verification error:', error);
            setError(error.message || 'OTP verification failed. Please try again.');
        }
        setLoading(false);
    };

    const handleResendOTP = async () => {
        setLoading(true);
        setError('');
        setResendDisabled(true);
        setCountdown(30);

        try {
            await sendEmailOTP(email);
            setTimeout(() => {
                setResendDisabled(false);
            }, 30000);
        } catch (error) {
            console.error('Resend OTP error:', error);
            setError('Failed to resend OTP. Please try again.');
            setResendDisabled(false);
        }
        setLoading(false);
    };

    const handleChangeEmail = () => {
        navigate('/login');
    };

    return (
        <div className="login-container">
            <div className="login-content">
                <div className="logo-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                    <img src={logo} alt="AgriChain Logo" style={{ height: '80px', width: 'auto' }} />
                    <div style={{ textAlign: 'left' }}>
                        <h1 className="logo-title" style={{ margin: 0, lineHeight: 1.2 }}>AgriChain <span className="logo-subtitle">Insurance</span></h1>
                        <p className="tagline" style={{ margin: 0, marginTop: '12px' }}>Secure Farming Solutions</p>
                    </div>
                </div>

                <div className="login-card">
                    <h2>Verify your email</h2>
                    <p>We've sent a 6-digit code to {email}</p>

                    <form onSubmit={handleVerifyOTP}>
                        <div className="input-group">
                            <label>Enter verification code</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength="6"
                                required
                                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5rem' }}
                            />
                        </div>

                        <button className="primary-btn" type="submit" disabled={loading || otp.length !== 6}>
                            {loading ? <span className="spinner"></span> : 'Verify OTP'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Didn't receive the code?</p>
                        <button
                            onClick={handleResendOTP}
                            disabled={resendDisabled || loading}
                            style={{
                                background: resendDisabled ? '#475569' : '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: resendDisabled ? 'not-allowed' : 'pointer',
                                marginTop: '10px',
                                fontSize: '0.9rem'
                            }}
                        >
                            {resendDisabled ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                        </button>

                        <button
                            onClick={handleChangeEmail}
                            style={{
                                background: 'transparent',
                                border: '1px solid #475569',
                                color: '#94a3b8',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                marginTop: '10px',
                                fontSize: '0.9rem'
                            }}
                        >
                            Change email
                        </button>
                    </div>

                    {error && <div className="error-message">{error}</div>}
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

export default OtpVerify;