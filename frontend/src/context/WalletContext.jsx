import React, { createContext, useContext, useState, useCallback } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};

export const WalletProvider = ({ children }) => {
    const [walletAddress, setWalletAddress] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    // Check if wallet is connected
    const isWalletConnected = !!walletAddress;

    // Connect wallet
    const connectWallet = useCallback(async () => {
        setIsConnecting(true);
        setError(null);

        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length > 0) {
                const address = accounts[0];
                setWalletAddress(address);

                // Store in sessionStorage (not persistent across browser close)
                sessionStorage.setItem('walletAddress', address);

                console.log('🔗 Wallet connected:', address);
                return { success: true, address };
            } else {
                throw new Error('No accounts found. Please unlock MetaMask.');
            }
        } catch (err) {
            console.error('Wallet connection error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsConnecting(false);
        }
    }, []);

    // Disconnect wallet
    const disconnectWallet = useCallback(() => {
        setWalletAddress(null);
        sessionStorage.removeItem('walletAddress');
        console.log('🔌 Wallet disconnected');
    }, []);

    // Get provider and signer
    const getProvider = useCallback(() => {
        if (window.ethereum) {
            return new ethers.BrowserProvider(window.ethereum);
        }
        return null;
    }, []);

    const getSigner = useCallback(async () => {
        const provider = getProvider();
        if (provider) {
            return await provider.getSigner();
        }
        return null;
    }, [getProvider]);

    // Listen for account changes
    React.useEffect(() => {
        if (window.ethereum) {
            const handleAccountsChanged = (accounts) => {
                if (accounts.length === 0) {
                    // User disconnected wallet
                    disconnectWallet();
                } else if (accounts[0] !== walletAddress) {
                    // User switched accounts
                    setWalletAddress(accounts[0]);
                    sessionStorage.setItem('walletAddress', accounts[0]);
                }
            };

            const handleChainChanged = () => {
                // Reload page on chain change (recommended by MetaMask)
                window.location.reload();
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, [walletAddress, disconnectWallet]);

    // Restore wallet from session on mount (only for current session)
    React.useEffect(() => {
        const storedAddress = sessionStorage.getItem('walletAddress');
        if (storedAddress && window.ethereum) {
            // Verify the wallet is still connected
            window.ethereum.request({ method: 'eth_accounts' })
                .then(accounts => {
                    if (accounts.includes(storedAddress)) {
                        setWalletAddress(storedAddress);
                    } else {
                        sessionStorage.removeItem('walletAddress');
                    }
                })
                .catch(() => {
                    sessionStorage.removeItem('walletAddress');
                });
        }
    }, []);

    const value = {
        walletAddress,
        isWalletConnected,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        getProvider,
        getSigner
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};
