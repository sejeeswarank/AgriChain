import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    auth,
    onAuthStateChanged,
    signOut,
    createUserProfile,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from '../firebase';
import { inMemoryPersistence, setPersistence } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Inactivity timeout duration (10 minutes)
const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [inactivityTimer, setInactivityTimer] = useState(null);

    // Logout function
    const logout = useCallback(async () => {
        try {
            // Clear any stored session data
            sessionStorage.clear();
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }, []);

    // Reset inactivity timer
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }

        if (user) {
            const newTimer = setTimeout(() => {
                console.log('⏰ Session expired due to inactivity');
                logout();
            }, INACTIVITY_TIMEOUT);
            setInactivityTimer(newTimer);
        }
    }, [user, inactivityTimer, logout]);

    // Set up activity listeners
    useEffect(() => {
        if (user) {
            const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

            const handleActivity = () => {
                resetInactivityTimer();
            };

            events.forEach(event => {
                document.addEventListener(event, handleActivity);
            });

            // Initial timer
            resetInactivityTimer();

            return () => {
                events.forEach(event => {
                    document.removeEventListener(event, handleActivity);
                });
                if (inactivityTimer) {
                    clearTimeout(inactivityTimer);
                }
            };
        }
    }, [user]);

    // Set in-memory persistence (logout on refresh)
    useEffect(() => {
        const setAuthPersistence = async () => {
            try {
                await setPersistence(auth, inMemoryPersistence);
                console.log('🔒 Auth persistence set to in-memory (logout on refresh)');
            } catch (error) {
                console.error('Error setting auth persistence:', error);
            }
        };
        setAuthPersistence();
    }, []);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                // Create/update user profile in Firestore
                try {
                    await createUserProfile(firebaseUser, {
                        authMethod: firebaseUser.phoneNumber ? 'phone' : 'email',
                        lastLogin: new Date()
                    });
                } catch (error) {
                    console.error('Error updating user profile:', error);
                }

                setUserProfile({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    phoneNumber: firebaseUser.phoneNumber,
                    displayName: firebaseUser.displayName,
                    emailVerified: firebaseUser.emailVerified
                });
            } else {
                // Check for OTP-verified session (for email OTP login)
                const otpVerifiedEmail = sessionStorage.getItem('otpVerifiedEmail');
                if (otpVerifiedEmail) {
                    // Create a pseudo-user object for OTP-authenticated users
                    const otpUser = {
                        email: otpVerifiedEmail,
                        uid: 'otp-' + otpVerifiedEmail,
                        emailVerified: true,
                        isOtpUser: true
                    };
                    setUser(otpUser);
                    setUserProfile({
                        uid: otpUser.uid,
                        email: otpVerifiedEmail,
                        fullName: otpVerifiedEmail.split('@')[0],
                        authMethod: 'email-otp'
                    });
                } else {
                    setUser(null);
                    setUserProfile(null);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Login with email and password
    const loginWithEmailPassword = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    };

    // Create user with email and password
    const signupWithEmailPassword = async (email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: error.message };
        }
    };

    // Login with OTP (Session based)
    const loginWithOTP = async (email) => {
        try {
            // Set session storage
            sessionStorage.setItem('otpVerifiedEmail', email);

            // Create pseudo-user object
            const otpUser = {
                email: email,
                uid: 'otp-' + email,
                emailVerified: true,
                isOtpUser: true
            };

            // Update state immediately
            setUser(otpUser);
            setUserProfile({
                uid: otpUser.uid,
                email: email,
                fullName: email.split('@')[0],
                authMethod: 'email-otp'
            });

            return { success: true, user: otpUser };
        } catch (error) {
            console.error('OTP Login error:', error);
            return { success: false, error: 'Failed to create session' };
        }
    };

    const value = {
        user,
        userProfile,
        loading,
        logout,
        loginWithEmailPassword,
        loginWithOTP,
        signupWithEmailPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};