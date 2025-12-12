import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OtpVerify = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendDisabled, setResendDisabled] = useState(true);
    const [countdown, setCountdown] = useState(30);

    const navigate = useNavigate();
    const location = useLocation();

    // Get confirmation result from location state
    const confirmationResult = location.state?.confirmationResult;
    const phoneNumber = location.state?.phoneNumber;

    useEffect(() => {
        if (!confirmationResult || !phoneNumber) {
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
    }, [confirmationResult, phoneNumber, navigate]);

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
                case 'auth/invalid-verification-id':
                    setError('Invalid verification. Please try again.');
                    break;
                default:
                    setError('OTP verification failed. Please try again.');
            }
        }
        setLoading(false);
    };

    const handleResendOTP = async () => {
        setLoading(true);
        setError('');
        setResendDisabled(true);
        setCountdown(30);

        try {
            // This would typically trigger a new OTP send
            // For now, we'll just reset the timer
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

    const handleChangeNumber = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Verify your phone number
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    We've sent a 6-digit code to {phoneNumber}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div>
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 text-center">
                                Enter verification code
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
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Didn't receive the code?</span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <button
                                onClick={handleResendOTP}
                                disabled={resendDisabled || loading}
                                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resendDisabled ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                            </button>

                            <button
                                onClick={handleChangeNumber}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Change phone number
                            </button>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OtpVerify;