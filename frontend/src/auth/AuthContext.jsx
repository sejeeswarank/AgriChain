import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, signOut, createUserProfile, isSignInWithEmailLink, signInWithEmailLink } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        // Handle email link sign-in
        if (isSignInWithEmailLink(window.location.href)) {
            let email = localStorage.getItem('emailForSignIn');
            if (!email) {
                // User opened the link on a different device. Ask for email
                email = window.prompt('Please provide your email for confirmation');
            }

            if (email) {
                signInWithEmailLink(email, window.location.href)
                    .then(() => {
                        // Clear email from storage
                        localStorage.removeItem('emailForSignIn');
                        // Remove the sign-in link parameters from URL
                        window.history.replaceState({}, document.title, window.location.pathname);
                    })
                    .catch((error) => {
                        console.error('Error signing in with email link:', error);
                    });
            }
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                // Create/update user profile in Firestore
                await createUserProfile(firebaseUser, {
                    authMethod: firebaseUser.phoneNumber ? 'phone' : 'email',
                    lastLogin: new Date()
                });
                // You can fetch additional profile data here if needed
                setUserProfile({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    phoneNumber: firebaseUser.phoneNumber,
                    displayName: firebaseUser.displayName,
                    emailVerified: firebaseUser.emailVerified,
                    phoneNumberVerified: firebaseUser.phoneNumber ? true : false
                });
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const value = {
        user,
        userProfile,
        loading,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};