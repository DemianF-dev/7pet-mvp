import React from 'react';

interface ContainerProps {
    children: React.ReactNode;
    className?: string;
    fluid?: boolean;
    as?: React.ElementType;
}

/**
 * Container component to standardize width and horizontal padding.
 * On mobile (default): px-4 and fluid width.
 * On desktop (md+): max-width-7xl and consistent padding.
 */
export const Container: React.FC<ContainerProps> = ({
    children,
    className = '',
    fluid = false,
    as: Tag = 'div'
}) => {
    return (
        <Tag className={`
            mx-auto w-full
            px-4 md:px-6 lg:px-8
            ${fluid ? 'max-w-none' : 'max-w-7xl'}
            ${className}
        `}>
            {children}
        </Tag>
    );
};

interface StackProps {
    children: React.ReactNode;
    gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
    direction?: 'col' | 'row';
    align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    className?: string;
    as?: React.ElementType;
}

/**
 * Stack component for consistent vertical/horizontal alignment and spacing.
 */
export const Stack: React.FC<StackProps> = ({
    children,
    gap = 4,
    direction = 'col',
    align = 'stretch',
    justify = 'start',
    className = '',
    as: Tag = 'div'
}) => {
    const gapMap = {
        1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 5: 'gap-5',
        6: 'gap-6', 8: 'gap-8', 10: 'gap-10', 12: 'gap-12'
    };

    const alignMap = {
        start: 'items-start', center: 'items-center', end: 'items-end',
        baseline: 'items-baseline', stretch: 'items-stretch'
    };

    const justifyMap = {
        start: 'justify-start', center: 'justify-center', end: 'justify-end',
        between: 'justify-between', around: 'justify-around', evenly: 'justify-evenly'
    };

    return (
        <Tag className={`
            flex 
            ${direction === 'col' ? 'flex-col' : 'flex-row'}
            ${gapMap[gap]}
            ${alignMap[align]}
            ${justifyMap[justify]}
            ${className}
        `}>
            {children}
        </Tag>
    );
};
