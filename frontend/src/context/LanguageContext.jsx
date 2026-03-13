import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { en } from '../translations/en';
import { ta } from '../translations/ta';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    // Set Tamil as default language
    const [currentLanguage, setCurrentLanguage] = useState('ta');

    const translations = {
        en,
        ta,
        hi: en, // Placeholder
        mr: en, // Placeholder
        te: en, // Placeholder
        kn: en, // Placeholder
        ml: en  // Placeholder
    };

    // Load language from localStorage on mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem('agriChain-language');
        if (savedLanguage && translations[savedLanguage]) {
            setCurrentLanguage(savedLanguage);
        }
    }, []);

    // Save language to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('agriChain-language', currentLanguage);
    }, [currentLanguage]);

    // Translation function - supports dot notation keys like "auth.tagline"
    const t = (key) => {
        const currentTranslations = translations[currentLanguage];

        // First try direct key lookup (for dot notation strings as keys)
        if (currentTranslations?.[key]) {
            return currentTranslations[key];
        }

        // Fallback: try nested object lookup
        if (currentTranslations) {
            const keys = key.split('.');
            let result = currentTranslations;
            for (const k of keys) {
                if (result && typeof result === 'object' && k in result) {
                    result = result[k];
                } else {
                    result = undefined;
                    break;
                }
            }
            if (result && typeof result === 'string') {
                return result;
            }
        }

        // Final fallback: try English
        if (currentLanguage !== 'en' && translations.en?.[key]) {
            return translations.en[key];
        }

        // Return key as fallback (for debugging missing translations)
        return key;
    };

    const switchLanguage = (language) => {
        if (translations[language]) {
            setCurrentLanguage(language);
        }
    };

    const value = useMemo(() => ({
        currentLanguage,
        switchLanguage,
        t,
        isTamil: currentLanguage === 'ta',
        isEnglish: currentLanguage === 'en'
    }), [currentLanguage, switchLanguage, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

LanguageProvider.propTypes = {
    children: PropTypes.node
};