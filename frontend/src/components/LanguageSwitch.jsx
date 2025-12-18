import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitch = () => {
    const { currentLanguage, switchLanguage } = useLanguage();

    const toggleLanguage = () => {
        const newLanguage = currentLanguage === 'en' ? 'ta' : 'en';
        switchLanguage(newLanguage);
    };

    // Show current language, clicking switches to the other
    const getCurrentLabel = () => {
        if (currentLanguage === 'en') {
            return { short: 'ENG', full: 'English' };
        } else {
            return { short: 'த', full: 'தமிழ்' };
        }
    };

    const getNextLabel = () => {
        if (currentLanguage === 'en') {
            return 'தமிழ்';
        } else {
            return 'English';
        }
    };

    const labels = getCurrentLabel();

    return (
        <button
            onClick={toggleLanguage}
            className="language-switch-btn"
            title={`Switch to ${getNextLabel()}`}
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid #475569',
                color: '#e2e8f0',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                backdropFilter: 'blur(10px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
                e.target.style.background = 'rgba(30, 41, 59, 0.95)';
                e.target.style.borderColor = '#10b981';
            }}
            onMouseLeave={(e) => {
                e.target.style.background = 'rgba(15, 23, 42, 0.9)';
                e.target.style.borderColor = '#475569';
            }}
        >
            <span style={{
                background: '#10b981',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
            }}>
                {labels.short}
            </span>
            <span style={{ fontSize: '13px' }}>
                {labels.full}
            </span>
            <span style={{ fontSize: '10px', opacity: 0.6 }}>
                → {getNextLabel()}
            </span>
        </button>
    );
};

export default LanguageSwitch;