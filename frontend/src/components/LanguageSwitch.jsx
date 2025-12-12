import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitch = () => {
    const { currentLanguage, switchLanguage, t } = useLanguage();

    const toggleLanguage = () => {
        const newLanguage = currentLanguage === 'ta' ? 'en' : 'ta';
        switchLanguage(newLanguage);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="language-switch-btn"
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
                e.target.style.borderColor = '#64748b';
            }}
            onMouseLeave={(e) => {
                e.target.style.background = 'rgba(15, 23, 42, 0.9)';
                e.target.style.borderColor = '#475569';
            }}
        >
            <span>{currentLanguage === 'ta' ? 'EN' : 'தமிழ்'}</span>
            <span style={{ fontSize: '12px', opacity: 0.7 }}>
                {currentLanguage === 'ta' ? 'English' : 'தமிழ்'}
            </span>
        </button>
    );
};

export default LanguageSwitch;