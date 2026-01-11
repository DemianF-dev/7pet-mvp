/**
 * Paciência Pet - Type Definitions
 */

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
    suit: Suit;
    rank: Rank;
    faceUp: boolean;
    id: string; // Unique identifier for React keys
}

export type Pile = Card[];

export interface GameState {
    deck: Pile;           // Stock (cards not yet dealt)
    waste: Pile;          // Waste pile (cards drawn from deck)
    foundations: {        // Four foundation piles (one per suit)
        hearts: Pile;
        diamonds: Pile;
        clubs: Pile;
        spades: Pile;
    };
    tableau: Pile[];      // Seven tableau columns
    selected: {           // Currently selected card/pile
        source: 'deck' | 'waste' | 'foundation' | 'tableau' | null;
        pileIndex?: number; // Index for tableau or foundation
        cardIndex?: number; // Index of card in pile
    } | null;
    moveHistory: Move[];  // For undo functionality
    moves: number;        // Total moves made
    isPaused: boolean;
}

export interface Move {
    from: {
        source: 'deck' | 'waste' | 'foundation' | 'tableau';
        pileIndex?: number;
        cardIndex?: number;
    };
    to: {
        source: 'foundation' | 'tableau';
        pileIndex?: number;
    };
    cards: Card[];
}

// Suit colors
export const SUIT_COLORS: Record<Suit, 'red' | 'black'> = {
    hearts: 'red',
    diamonds: 'red',
    clubs: 'black',
    spades: 'black'
};

// Suit symbols (pet-themed)
export const SUIT_SYMBOLS: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
};

// Rank values (for ordering)
export const RANK_VALUES: Record<Rank, number> = {
    'A': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 11,
    'Q': 12,
    'K': 13
};
