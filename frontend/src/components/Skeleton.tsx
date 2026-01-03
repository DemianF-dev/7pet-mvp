import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular' }) => {
    const variantClasses = {
        text: 'h-4 w-full rounded',
        circular: 'rounded-full',
        rectangular: '',
        rounded: 'rounded-2xl',
    };

    return (
        <div
            className={`animate-pulse bg-gray-200 ${variantClasses[variant]} ${className}`}
        />
    );
};

export default Skeleton;
