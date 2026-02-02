/**
 * Paciência Pet - The Clean One Style
 * Sistema de tipos e temas inspirado no design minimalista
 */

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
    suit: Suit;
    rank: Rank;
    faceUp: boolean;
    id: string;
}

export type Pile = Card[];

export interface GameState {
    deck: Pile;
    waste: Pile;
    foundations: {
        hearts: Pile;
        diamonds: Pile;
        clubs: Pile;
        spades: Pile;
    };
    tableau: Pile[];
    selected: {
        source: 'deck' | 'waste' | 'foundation' | 'tableau' | null;
        pileIndex?: number;
        cardIndex?: number;
    } | null;
    moveHistory: GameState[];
    moves: number;
    score: number;
    isPaused: boolean;
    startTime: number;
    endTime?: number;
}

export interface GameTheme {
    id: string;
    name: string;
    bg: string;
    surface: string;
    accent: string;
    text: string;
    cardFace: string;
    cardBack: string;
    suitColors: Record<Suit, string>;
}

export const THEMES: GameTheme[] = [
    {
        id: 'red',
        name: 'Classic Red',
        bg: '#a54a4a',
        surface: '#eeeeee',
        accent: '#e53935',
        text: '#333333',
        cardFace: '#ffffff',
        cardBack: '#e53935',
        suitColors: {
            hearts: '#e53935',
            diamonds: '#e53935',
            clubs: '#222222',
            spades: '#222222'
        }
    },
    {
        id: 'blue',
        name: 'Deep Ocean',
        bg: '#2c70b8',
        surface: '#eeeeee',
        accent: '#5dade2',
        text: '#333333',
        cardFace: '#ffffff',
        cardBack: '#5dade2',
        suitColors: {
            hearts: '#e53935',
            diamonds: '#e53935',
            clubs: '#222222',
            spades: '#222222'
        }
    },
    {
        id: 'dark',
        name: 'Midnight Pink',
        bg: '#000000',
        surface: '#1a1a1a',
        accent: '#ff4081',
        text: '#ffffff',
        cardFace: '#333333',
        cardBack: '#ff4081',
        suitColors: {
            hearts: '#ff4081',
            diamonds: '#ff4081',
            clubs: '#ffffff',
            spades: '#ffffff'
        }
    }
];

export const SUIT_SYMBOLS: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
};

export const RANK_VALUES: Record<Rank, number> = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
};
