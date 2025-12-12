import React from 'react';
import { ethers } from 'ethers';

const PolicyCard = ({ policy, index }) => {
    const start = new Date(Number(policy.startTimestamp) * 1000).toLocaleDateString();
    const end = new Date(Number(policy.endTimestamp) * 1000).toLocaleDateString();
    const premium = policy.premium.toString();

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3>Policy #{index}</h3>
                <span className={`badge ${policy.paidOut ? 'paidout' : 'active'}`}>
                    {policy.paidOut ? 'PAID OUT' : (policy.active ? 'ACTIVE' : 'INACTIVE')}
                </span>
            </div>
            <p><strong>Index ID:</strong> {policy.indexId ? policy.indexId.substring(0, 10) + '...' : 'N/A'}</p>
            <p><strong>Rainfall Threshold:</strong> {Number(policy.threshold) / 100} mm</p>
            <p><strong>Premium:</strong> {ethers.formatEther(policy.premium)} ETH</p>
            <p><strong>Period:</strong> {start} - {end}</p>
            {policy.paidOut && (
                <div className="text-payout">
                    Payout Executed (5x)!
                </div>
            )}
        </div>
    );
};

export default PolicyCard;
