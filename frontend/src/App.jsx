import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { WalletProvider } from './context/WalletContext';
import LanguageSwitch from './components/LanguageSwitch';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Signup from './pages/Signup';
import WalletConnectPage from './pages/WalletConnectPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return children;
};

function App() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <WalletProvider>
                    <Router>
                        <LanguageSwitch />
                        <Routes>
                            <Route path="/" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/wallet-connect" element={<WalletConnectPage />} />
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </Router>
                </WalletProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}

export default App;
