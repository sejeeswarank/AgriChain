import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useLanguage } from '../context/LanguageContext';

function WalletConnect() {
    const [connecting, setConnecting] = useState(false);
    const navigate = useNavigate();
    const { t } = useLanguage();

    const connectWallet = async () => {
        setConnecting(true);
        try {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const walletAddress = accounts[0];

                // Check if we have VC data from verification
                const vcHash = localStorage.getItem('vcHash');
                const issuer = localStorage.getItem('vcIssuer');
                const signature = localStorage.getItem('vcSignature');

                if (vcHash && issuer && signature) {
                    // Submit VC to contract
                    await submitVCToContract(walletAddress, vcHash, issuer, signature);
                    // Clear stored data
                    localStorage.removeItem('vcHash');
                    localStorage.removeItem('vcIssuer');
                    localStorage.removeItem('vcSignature');
                }

                navigate('/dashboard');
            } else {
                alert(t('wallet.installMetamask'));
            }
        } catch (error) {
            console.error(error);
            alert(t('wallet.connectFailed'));
        }
        setConnecting(false);
    };

    const submitVCToContract = async (walletAddress, vcHash, issuer, signature) => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                import.meta.env.VITE_CONTRACT_ADDRESS,
                (await import('../abis/AgriChain')).AgriChain, // Dynamic import or use standard import
                signer
            );

            // Note: Ensure your contract fits the ABI. Using a generic way if ABI is standardized.
            // If the ABI is available as a named export

            const tx = await contract.submitAadhaarVC(vcHash, issuer, signature);
            await tx.wait();
            console.log('VC submitted to contract successfully');
        } catch (error) {
            console.error('Error submitting VC to contract:', error);
            // Don't block navigation if contract submission fails
        }
    };

    return (
        <div className="login-container">
            <div className="login-content">
                <div className="logo-section">
                    <h1 className="logo-title">AgriChain <span className="logo-subtitle">{t('common.insurance')}</span></h1>
                    <p className="tagline">{t('auth.tagline')}</p>
                </div>

                <div className="login-card">
                    <h2>{t('wallet.connectTitle')}</h2>
                    <p>{t('wallet.connectSubtitle')}</p>

                    <button className="connect-btn" onClick={connectWallet} disabled={connecting}>
                        {connecting ? (
                            <span className="spinner"></span>
                        ) : (
                            <>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" width="24" />
                                {t('wallet.connectButton')}
                            </>
                        )}
                    </button>

                    <div className="features">
                        <div className="feature-item">
                            <span>🔐</span>
                            <span>{t('features.secureVerification')}</span>
                        </div>
                        <div className="feature-item">
                            <span>⚡</span>
                            <span>{t('features.instantAccess')}</span>
                        </div>
                        <div className="feature-item">
                            <span>🌾</span>
                            <span>{t('features.farmerFocused')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="animated-bg">
                <div className="circle c1"></div>
                <div className="circle c2"></div>
                <div className="circle c3"></div>
            </div>
        </div>
    );
}

export default WalletConnect;