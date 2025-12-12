import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import LanguageSwitch from './components/LanguageSwitch';
import WalletConnect from './components/WalletConnect';
import MobileVerification from './components/MobileVerification';
import Dashboard from './pages/Dashboard';
import Signup from './pages/Signup';

function App() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <Router>
                    <LanguageSwitch />
                    <Routes>
                        <Route path="/" element={<MobileVerification />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/verify" element={<WalletConnect />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </LanguageProvider>
    );
}

export default App;
