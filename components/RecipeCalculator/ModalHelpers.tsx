// components/ModalHelpers.tsx
import React from 'react';

interface CloseButtonProps {
    onClose: () => void;
}

export const CloseButton: React.FC<CloseButtonProps> = ({ onClose }) => (
    <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
    >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    </button>
);

interface ActionButtonProps {
    onClick: () => void;
    color: 'purple' | 'red' | 'green' | 'blue';
    children: React.ReactNode;
    fullWidth?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ onClick, color, children, fullWidth = false }) => {
    const colorClasses = {
        purple: 'bg-purple-600 hover:bg-purple-700 text-white',
        red: 'bg-red-600 hover:bg-red-700 text-white',
        green: 'bg-green-600 hover:bg-green-700 text-white',
        blue: 'bg-blue-600 hover:bg-blue-700 text-white'
    };

    return (
        <button
            onClick={onClick}
            className={`${fullWidth ? 'w-full' : ''} ${colorClasses[color]} py-3 px-6 rounded-lg font-semibold transition-colors duration-200 text-lg`}
        >
            {children}
        </button>
    );
};

interface MetricCardProps {
    label: string;
    value: string;
    color: 'red' | 'green' | 'blue' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, color }) => {
    const colorClasses = {
        red: 'bg-red-50 border-red-200 text-red-700',
        green: 'bg-green-50 border-green-200 text-green-700',
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700'
    };

    return (
        <div className={`${colorClasses[color]} border rounded-lg p-3 text-center`}>
            <div className="text-xs font-medium mb-1">{label}</div>
            <div className="text-lg font-bold">{value}</div>
        </div>
    );
};