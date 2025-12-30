import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitch = () => {
    const { currentLanguage, switchLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const languages = [
        { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
        { code: 'en', label: 'English', native: 'English' },
        { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
        { code: 'hi', label: 'Hindi', native: 'हिन्दी' }
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageSelect = (code) => {
        switchLanguage(code);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'rgba(15, 23, 42, 0.8)', // Dark semi-transparent
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    color: '#e2e8f0',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)';
                }}
            >

                <span>Language</span>

                {/* Chevron */}
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                    }}
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '180px',
                    background: '#1e293b', // Slate 800
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '8px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                }}>
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            style={{
                                background: currentLanguage === lang.code ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                border: 'none',
                                padding: '12px 16px',
                                width: '100%',
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderRadius: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (currentLanguage !== lang.code) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                                if (currentLanguage !== lang.code) e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            <span style={{
                                color: currentLanguage === lang.code ? '#10b981' : '#f1f5f9',
                                fontSize: '0.95rem',
                                fontWeight: currentLanguage === lang.code ? '600' : '400'
                            }}>
                                {lang.native}
                            </span>
                            {/* Optional: Show English name too if needed, but image showed native only mostly */}

                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSwitch;