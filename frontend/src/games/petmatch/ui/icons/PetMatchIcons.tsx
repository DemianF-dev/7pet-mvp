import { SVGProps, FC } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number;
    color?: string;
}

const BaseIcon: FC<IconProps> = ({ size = 24, color = 'currentColor', style, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ overflow: 'visible', ...style }} // Allow glow/shadow
        {...props}
    >
        {props.children}
    </svg>
);

// 1. Paw (Patinha)
export const PawIcon: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <path d="M12 2C10.8954 2 10 2.89543 10 4C10 5.10457 10.8954 6 12 6C13.1046 6 14 5.10457 14 4C14 2.89543 13.1046 2 12 2Z" fill="currentColor" stroke="none" />
        <path d="M6 5C4.89543 5 4 5.89543 4 7C4 8.10457 4.89543 9 6 9C7.10457 9 8 8.10457 8 7C8 5.89543 7.10457 5 6 5Z" fill="currentColor" stroke="none" />
        <path d="M18 5C16.8954 5 16 5.89543 16 7C16 8.10457 16.8954 9 18 9C19.1046 9 20 8.10457 20 7C20 5.89543 19.1046 5 18 5Z" fill="currentColor" stroke="none" />
        <path d="M12 8C8.5 8 6 10.5 6 13.5C6 16.5 8.5 21 12 21C15.5 21 18 16.5 18 13.5C18 10.5 15.5 8 12 8Z" fill="currentColor" stroke="none" />
    </BaseIcon>
);

// 2. Bone (Ossinho)
export const BoneIcon: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <path d="M17 5.5C18.6569 5.5 20 6.84315 20 8.5C20 10.1569 18.6569 11.5 17 11.5V12.5C18.6569 12.5 20 13.8431 20 15.5C20 17.1569 18.6569 18.5 17 18.5C15.5 18.5 14.5 17.5 13 16L11 16C9.5 17.5 8.5 18.5 7 18.5C5.34315 18.5 4 17.1569 4 15.5C4 13.8431 5.34315 12.5 7 12.5V11.5C5.34315 11.5 4 10.1569 4 8.5C4 6.84315 5.34315 5.5 7 5.5C8.5 5.5 9.5 6.5 11 8L13 8C14.5 6.5 15.5 5.5 17 5.5Z" fill="currentColor" stroke="none" />
    </BaseIcon>
);

// 3. Ball (Bolinha)
export const BallIcon: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
        <path d="M6.5 12C6.5 12 9 9.5 12 9.5C15 9.5 17.5 12 17.5 12" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 17.5C12 17.5 9.5 15 6.5 15" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
    </BaseIcon>
);

// 4. Bow (Lacinho)
export const BowIcon: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <path d="M12 12L4 8C3 7.5 2 9 3 10L5 12L3 14C2 15 3 16.5 4 16L12 12Z" fill="currentColor" stroke="none" />
        <path d="M12 12L20 8C21 7.5 22 9 21 10L19 12L21 14C22 15 21 16.5 20 16L12 12Z" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="2" fill="white" fillOpacity="0.5" />
    </BaseIcon>
);

// 5. Fish (Peixinho)
export const FishIcon: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <path d="M18 12C18 12 21 10 21 9C21 8 20 7 19 7C16 7 14 9 14 9L10 9C7 9 3 12 3 12C3 12 7 15 10 15L14 15C14 15 16 17 19 17C20 17 21 16 21 15C21 14 18 12 18 12Z" fill="currentColor" stroke="none" />
        <circle cx="15" cy="11" r="1.5" fill="rgba(0,0,0,0.2)" />
    </BaseIcon>
);

// 6. Bubble (Bolha de Shampoo)
export const BubbleIcon: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <circle cx="12" cy="12" r="8" fill="currentColor" stroke="none" bg-opacity="0.8" />
        <circle cx="15" cy="9" r="2" fill="white" fillOpacity="0.6" />
        <circle cx="10" cy="15" r="1" fill="white" fillOpacity="0.4" />
    </BaseIcon>
);

export const TILE_ICON_MAP: Record<string, React.FC<IconProps>> = {
    paw: PawIcon,
    bone: BoneIcon,
    ball: BallIcon,
    bow: BowIcon,
    fish: FishIcon,
    bubble: BubbleIcon,
};
