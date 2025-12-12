import React from 'react';
import { ethers } from 'ethers';
import { useLanguage } from '../context/LanguageContext';

const PolicyCard = ({ policy, index }) => {
    const { t } = useLanguage();
    const start = new Date(Number(policy.startTimestamp) * 1000).toLocaleDateString();
    const end = new Date(Number(policy.endTimestamp) * 1000).toLocaleDateString();

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3>{t('policy.header')}{index}</h3>
                <span className={`badge ${policy.paidOut ? 'paidout' : 'active'}`}>
                    {policy.paidOut
                        ? t('policy.status.paidOut')
                        : (policy.active ? t('policy.status.active') : t('policy.status.inactive'))}
                </span>
            </div>
            <p><strong>{t('policy.indexId')}:</strong> {policy.indexId ? policy.indexId.substring(0, 10) + '...' : 'N/A'}</p>
            <p><strong>{t('policy.threshold')}:</strong> {Number(policy.threshold) / 100} mm</p>
            <p><strong>{t('policy.premium')}:</strong> {ethers.formatEther(policy.premium)} ETH</p>
            <p><strong>{t('policy.period')}:</strong> {start} - {end}</p>
            {policy.paidOut && (
                <div className="text-payout">
                    {t('policy.payoutExecuted')}
                </div>
            )}
        </div>
    );
};

export default PolicyCard;
