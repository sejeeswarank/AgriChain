import React from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { WalletProvider } from './context/WalletContext';
import PropTypes from 'prop-types';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Signup from './pages/Signup';
import WalletConnectPage from './pages/WalletConnectPage';

// Protected Route Component
const ProtectedRoute = ({ children, redirectTo = "/login" }) => {
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
        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node,
    redirectTo: PropTypes.string
};

function App() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <WalletProvider>
                    <Router>
                        <SpeedInsights />
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/wallet-connect" element={<WalletConnectPage />} />
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute redirectTo="/">
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
