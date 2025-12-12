import React, { createContext, useContext, useState, useEffect } from 'react';
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
        ta
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

    const t = (key) => {
        const translation = translations[currentLanguage]?.[key];
        return translation || key; // Fallback to key if translation not found
    };

    const switchLanguage = (language) => {
        if (translations[language]) {
            setCurrentLanguage(language);
        }
    };

    const value = {
        currentLanguage,
        switchLanguage,
        t,
        isTamil: currentLanguage === 'ta',
        isEnglish: currentLanguage === 'en'
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};