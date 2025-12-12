import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from '../firebase';
import { useAuth } from '../auth/AuthContext';

const Login = () => {
    const [authMethod, setAuthMethod] = useState('email'); // 'email' or 'phone'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);

    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Setup reCAPTCHA for phone auth
    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
                size: 'invisible',
                callback: (response) => {
                    console.log('reCAPTCHA solved');
                },
                'expired-callback': () => {
                    console.log('reCAPTCHA expired');
                }
            }, auth);
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            switch (error.code) {
                case 'auth/user-not-found':
                    setError('No account found with this email. Please sign up first.');
                    break;
                case 'auth/wrong-password':
                    setError('Incorrect password. Please try again.');
                    break;
                case 'auth/invalid-email':
                    setError('Invalid email address.');
                    break;
                case 'auth/user-disabled':
                    setError('This account has been disabled.');
                    break;
                default:
                    setError('Login failed. Please try again.');
            }
        }
        setLoading(false);
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            setupRecaptcha();
            const formattedPhone = `+91${phoneNumber}`;
            const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
            setConfirmationResult(result);
            setOtpSent(true);
        } catch (error) {
            console.error('OTP send error:', error);
            switch (error.code) {
                case 'auth/invalid-phone-number':
                    setError('Invalid phone number format.');
                    break;
                case 'auth/missing-phone-number':
                    setError('Phone number is required.');
                    break;
                case 'auth/too-many-requests':
                    setError('Too many requests. Please try again later.');
                    break;
                default:
                    setError('Failed to send OTP. Please try again.');
            }
        }
        setLoading(false);
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await confirmationResult.confirm(otp);
            navigate('/dashboard');
        } catch (error) {
            console.error('OTP verification error:', error);
            switch (error.code) {
                case 'auth/invalid-verification-code':
                    setError('Invalid OTP. Please check and try again.');
                    break;
                case 'auth/code-expired':
                    setError('OTP has expired. Please request a new one.');
                    break;
                default:
                    setError('OTP verification failed. Please try again.');
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                        create a new account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {/* Auth Method Toggle */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => {
                                    setAuthMethod('email');
                                    setError('');
                                    setOtpSent(false);
                                }}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${authMethod === 'email'
                                        ? 'bg-white text-gray-900 shadow'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Email Login
                            </button>
                            <button
                                onClick={() => {
                                    setAuthMethod('phone');
                                    setError('');
                                    setOtpSent(false);
                                }}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${authMethod === 'phone'
                                        ? 'bg-white text-gray-900 shadow'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Phone Login
                            </button>
                        </div>
                    </div>

                    {/* Email Login Form */}
                    {authMethod === 'email' && (
                        <form onSubmit={handleEmailLogin} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Signing in...' : 'Sign in'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Phone Login Form */}
                    {authMethod === 'phone' && !otpSent && (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                    Phone number
                                </label>
                                <div className="mt-1 flex">
                                    <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                                        +91
                                    </span>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        required
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-r-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="9876543210"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sending OTP...' : 'Send OTP'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* OTP Verification Form */}
                    {authMethod === 'phone' && otpSent && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                                    Enter 6-digit OTP
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        required
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center text-lg tracking-widest"
                                        placeholder="000000"
                                        maxLength="6"
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                    OTP sent to +91{phoneNumber}
                                </p>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Verifying...' : 'Verify OTP'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setOtp('');
                                    }}
                                    className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Change Number
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* reCAPTCHA container */}
                    <div id="recaptcha-container"></div>
                </div>
            </div>
        </div>
    );
};

export default Login;