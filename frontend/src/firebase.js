// Firebase Configuration and Exports
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth functions
export {
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink
};

// Firestore functions
export {
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    updateDoc
};

// Verify Email OTP (calls backend API)
export const verifyEmailOTP = async (email, otp) => {
    const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status code ${response.status}`);
    }
    return response.json();
};
import { signInWithCustomToken as firebaseSignInWithCustomToken } from 'firebase/auth';
// ...existing code...
// Sign in with Firebase custom token
export const signInWithCustomToken = async (customToken) => {
    return firebaseSignInWithCustomToken(auth, customToken);
};
// Helper functions
export const createUserProfile = async (user, additionalData = {}) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        const { email, phoneNumber } = user;
        const createdAt = new Date();

        try {
            await setDoc(userRef, {
                uid: user.uid,
                fullName: additionalData.fullName || '',
                email: email || '',
                mobileNumber: phoneNumber || '',
                createdAt,
                ...additionalData
            });
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    }

    return userRef;
};

export const getUserProfile = async (uid) => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data();
        }
        return null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
};

// Phone to email mapping functions
export const savePhoneEmailMapping = async (phone, email) => {
    try {
        const phoneRef = doc(db, 'users', phone);
        await setDoc(phoneRef, {
            email: email,
            phone: phone,
            createdAt: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error('Error saving phone-email mapping:', error);
        throw error;
    }
};

export const getEmailByPhone = async (phone) => {
    try {
        const phoneRef = doc(db, 'users', phone);
        const phoneSnap = await getDoc(phoneRef);

        if (phoneSnap.exists()) {
            return phoneSnap.data().email;
        }
        return null;
    } catch (error) {
        console.error('Error getting email by phone:', error);
        return null;
    }
};

export const checkEmailVerified = async (email) => {
    try {
        // Get user by email from Firebase Auth
        // Note: This is a simplified approach. In production, you might want to store verification status in Firestore
        const userQuery = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(userQuery);

        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            return userData.emailVerified || false;
        }
        return false;
    } catch (error) {
        console.error('Error checking email verification:', error);
        return false;
    }
};


export const sendMobileOTP = async (mobile) => {
    // In a real implementation, this would call your backend API
    // For demo purposes, we'll simulate sending OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Mobile OTP for ${mobile}: ${otp}`);

    // Store OTP temporarily (in production, use secure backend)
    sessionStorage.setItem(`mobile_otp_${mobile}`, otp);
    sessionStorage.setItem(`mobile_otp_time_${mobile}`, Date.now().toString());

    return { success: true, message: 'OTP sent to mobile' };
};

export const verifyMobileOTP = async (mobile, otp) => {
    const storedOTP = sessionStorage.getItem(`mobile_otp_${mobile}`);
    const otpTime = sessionStorage.getItem(`mobile_otp_time_${mobile}`);

    if (!storedOTP || !otpTime) {
        throw new Error('OTP expired or not found');
    }

    // Check if OTP is expired (5 minutes)
    if (Date.now() - parseInt(otpTime) > 5 * 60 * 1000) {
        throw new Error('OTP expired');
    }

    if (storedOTP !== otp) {
        throw new Error('Invalid OTP');
    }

    // Clear OTP after successful verification
    sessionStorage.removeItem(`mobile_otp_${mobile}`);
    sessionStorage.removeItem(`mobile_otp_time_${mobile}`);

    return { success: true, message: 'Mobile verified successfully' };
};

export default app;