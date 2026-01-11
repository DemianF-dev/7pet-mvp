/**
 * Paciência Pet - Game Logic
 * 
 * Pure functions for game initialization, validation, and rules.
 */

import { Card, Suit, Rank, RANK_VALUES, SUIT_COLORS, GameState, Pile } from './types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/**
 * Create a shuffled deck of 52 cards
 */
export function createShuffledDeck(): Card[] {
    const deck: Card[] = [];

    // Create all 52 cards
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({
                suit,
                rank,
                faceUp: false,
                id: `${suit}-${rank}`
            });
        }
    }

    // Shuffle using Fisher-Yates algorithm
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}

/**
 * Deal cards into the initial tableau layout
 */
export function dealInitialTableau(deck: Card[]): { tableau: Pile[]; remainingDeck: Pile } {
    const tableau: Pile[] = [[], [], [], [], [], [], []];
    let deckIndex = 0;

    // Deal cards to tableau (1 card to first column, 2 to second, etc.)
    for (let col = 0; col < 7; col++) {
        for (let row = 0; row <= col; row++) {
            const card = { ...deck[deckIndex] };
            // Only the last card in each column is face up
            card.faceUp = row === col;
            tableau[col].push(card);
            deckIndex++;
        }
    }

    const remainingDeck = deck.slice(deckIndex);

    return { tableau, remainingDeck };
}

/**
 * Initialize a new game state
 */
export function initializeGame(): GameState {
    const deck = createShuffledDeck();
    const { tableau, remainingDeck } = dealInitialTableau(deck);

    return {
        deck: remainingDeck,
        waste: [],
        foundations: {
            hearts: [],
            diamonds: [],
            clubs: [],
            spades: []
        },
        tableau,
        selected: null,
        moveHistory: [],
        moves: 0,
        isPaused: false
    };
}

/**
 * Check if a card can be placed on a foundation
 */
export function canMoveToFoundation(card: Card, foundation: Pile): boolean {
    if (foundation.length === 0) {
        // Only Aces can start a foundation
        return card.rank === 'A';
    }

    const topCard = foundation[foundation.length - 1];

    // Must be same suit and one rank higher
    return (
        card.suit === topCard.suit &&
        RANK_VALUES[card.rank] === RANK_VALUES[topCard.rank] + 1
    );
}

/**
 * Check if a card can be placed on a tableau column
 */
export function canMoveToTableau(card: Card, tableau: Pile): boolean {
    if (tableau.length === 0) {
        // Only Kings can be placed on empty tableau columns
        return card.rank === 'K';
    }

    const topCard = tableau[tableau.length - 1];

    // Must be opposite color and one rank lower
    return (
        SUIT_COLORS[card.suit] !== SUIT_COLORS[topCard.suit] &&
        RANK_VALUES[card.rank] === RANK_VALUES[topCard.rank] - 1
    );
}

/**
 * Check if the game is won (all foundations complete)
 */
export function checkWin(state: GameState): boolean {
    return Object.values(state.foundations).every(foundation => foundation.length === 13);
}

/**
 * Get the cards that can be moved from a tableau column
 * (returns cards from the clicked position to the end)
 */
export function getMovableCards(tableau: Pile, startIndex: number): Card[] {
    if (startIndex < 0 || startIndex >= tableau.length) {
        return [];
    }

    // Can only move face-up cards
    if (!tableau[startIndex].faceUp) {
        return [];
    }

    // Get all cards from startIndex to the end
    const cards = tableau.slice(startIndex);

    // Validate that the sequence is valid (alternating colors, descending ranks)
    for (let i = 0; i < cards.length - 1; i++) {
        const current = cards[i];
        const next = cards[i + 1];

        if (
            SUIT_COLORS[current.suit] === SUIT_COLORS[next.suit] ||
            RANK_VALUES[current.rank] !== RANK_VALUES[next.rank] + 1
        ) {
            return [];
        }
    }

    return cards;
}

/**
 * Draw a card from the deck to the waste pile
 */
export function drawCard(state: GameState): GameState {
    if (state.deck.length === 0) {
        // Recycle waste back to deck
        const newDeck = [...state.waste].reverse().map(card => ({ ...card, faceUp: false }));
        return {
            ...state,
            deck: newDeck,
            waste: []
        };
    }

    const newDeck = [...state.deck];
    const card = { ...newDeck.pop()!, faceUp: true };
    const newWaste = [...state.waste, card];

    return {
        ...state,
        deck: newDeck,
        waste: newWaste
    };
}

/**
 * Flip the top card of a tableau column if it's face down
 */
export function flipTableauCard(tableau: Pile[]): Pile[] {
    return tableau.map(column => {
        if (column.length > 0) {
            const lastCard = column[column.length - 1];
            if (!lastCard.faceUp) {
                return [
                    ...column.slice(0, -1),
                    { ...lastCard, faceUp: true }
                ];
            }
        }
        return column;
    });
}
