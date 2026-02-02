/**
 * Paciência Pet - Game Logic
 * Lógica completa para Klondike Solitaire
 */

import { Card, Suit, Rank, RANK_VALUES, GameState, Pile } from './types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_COLOR: Record<Suit, 'red' | 'black'> = {
    hearts: 'red',
    diamonds: 'red',
    clubs: 'black',
    spades: 'black'
};

export function createShuffledDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({
                suit,
                rank,
                faceUp: false,
                id: `${suit}-${rank}-${Math.random().toString(36).substr(2, 9)}`
            });
        }
    }
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

export function dealInitialTableau(deck: Card[]): { tableau: Pile[]; remainingDeck: Pile } {
    const tableau: Pile[] = [[], [], [], [], [], [], []];
    let deckIndex = 0;
    for (let col = 0; col < 7; col++) {
        for (let row = 0; row <= col; row++) {
            const card = { ...deck[deckIndex] };
            card.faceUp = row === col;
            tableau[col].push(card);
            deckIndex++;
        }
    }
    return { tableau, remainingDeck: deck.slice(deckIndex) };
}

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
        score: 0,
        isPaused: false,
        startTime: Date.now()
    };
}

export function canMoveToFoundation(card: Card, foundation: Pile): boolean {
    if (foundation.length === 0) return card.rank === 'A';
    const topCard = foundation[foundation.length - 1];
    return card.suit === topCard.suit && RANK_VALUES[card.rank] === RANK_VALUES[topCard.rank] + 1;
}

export function canMoveToTableau(card: Card, tableau: Pile): boolean {
    if (tableau.length === 0) return card.rank === 'K';
    const topCard = tableau[tableau.length - 1];
    if (!topCard.faceUp) return false;
    return SUIT_COLOR[card.suit] !== SUIT_COLOR[topCard.suit] &&
           RANK_VALUES[card.rank] === RANK_VALUES[topCard.rank] - 1;
}

export function checkWin(state: GameState): boolean {
    return Object.values(state.foundations).every(f => f.length === 13);
}

export function drawCard(state: GameState): { deck: Pile; waste: Pile } {
    if (state.deck.length === 0) {
        // Virar o waste de volta para o deck
        return {
            deck: [...state.waste].reverse().map(c => ({ ...c, faceUp: false })),
            waste: []
        };
    }
    const newDeck = [...state.deck];
    const card = { ...newDeck.pop()!, faceUp: true };
    return { deck: newDeck, waste: [...state.waste, card] };
}

export function flipTableauCard(tableau: Pile[]): Pile[] {
    return tableau.map(col => {
        if (col.length > 0 && !col[col.length - 1].faceUp) {
            const newCol = [...col];
            newCol[newCol.length - 1] = { ...newCol[newCol.length - 1], faceUp: true };
            return newCol;
        }
        return col;
    });
}

// Tentar mover automaticamente uma carta para a foundation correspondente
export function tryAutoMoveToFoundation(state: GameState, card: Card, sourceInfo: {
    source: 'waste' | 'tableau';
    pileIndex?: number;
    cardIndex?: number;
}): GameState | null {
    // Só pode auto-mover para foundation da mesma suit
    const targetFoundation = state.foundations[card.suit];

    if (!canMoveToFoundation(card, targetFoundation)) {
        return null;
    }

    // Criar novo estado
    const newState = JSON.parse(JSON.stringify(state)) as GameState;

    // Remover carta da origem
    if (sourceInfo.source === 'waste') {
        if (newState.waste.length === 0) return null;
        newState.waste.pop();
    } else if (sourceInfo.source === 'tableau' && sourceInfo.pileIndex !== undefined) {
        const col = newState.tableau[sourceInfo.pileIndex];
        // Só pode auto-mover a carta do topo
        if (sourceInfo.cardIndex !== col.length - 1) return null;
        col.pop();
    }

    // Adicionar à foundation
    newState.foundations[card.suit].push({ ...card, faceUp: true });

    // Virar carta se necessário
    newState.tableau = flipTableauCard(newState.tableau);
    newState.moves += 1;
    newState.selected = null;
    newState.score += 10;

    // Salvar histórico
    const historyState = JSON.parse(JSON.stringify(state)) as GameState;
    historyState.moveHistory = [];
    newState.moveHistory = [...state.moveHistory, historyState];

    return newState;
}

export function executeMove(
    state: GameState,
    from: { source: 'waste' | 'foundation' | 'tableau'; pileIndex?: number; cardIndex?: number },
    to: { source: 'foundation' | 'tableau'; pileIndex?: number }
): GameState | null {
    const newState = JSON.parse(JSON.stringify(state)) as GameState;
    let cardsToMove: Card[] = [];

    // 1. Extrair cartas da origem
    if (from.source === 'waste') {
        if (newState.waste.length === 0) return null;
        cardsToMove = [newState.waste.pop()!];
    } else if (from.source === 'tableau' && from.pileIndex !== undefined && from.cardIndex !== undefined) {
        const col = newState.tableau[from.pileIndex];
        if (from.cardIndex >= col.length) return null;
        if (!col[from.cardIndex].faceUp) return null;
        cardsToMove = col.splice(from.cardIndex);
    } else if (from.source === 'foundation' && from.pileIndex !== undefined) {
        const suit = SUITS[from.pileIndex];
        const fld = newState.foundations[suit];
        if (fld.length === 0) return null;
        cardsToMove = [fld.pop()!];
    } else {
        return null;
    }

    if (cardsToMove.length === 0) return null;

    // 2. Validar e colocar no destino
    let moveValid = false;
    let scoreChange = 0;

    if (to.source === 'foundation') {
        // Para foundation, só pode mover uma carta de cada vez
        if (cardsToMove.length !== 1) return null;

        const card = cardsToMove[0];
        // A foundation correta é sempre a do naipe da carta
        const targetFoundation = newState.foundations[card.suit];

        if (canMoveToFoundation(card, targetFoundation)) {
            targetFoundation.push(card);
            moveValid = true;
            scoreChange = from.source === 'tableau' ? 10 : 5;
        }
    } else if (to.source === 'tableau' && to.pileIndex !== undefined) {
        const targetCol = newState.tableau[to.pileIndex];
        if (canMoveToTableau(cardsToMove[0], targetCol)) {
            targetCol.push(...cardsToMove);
            moveValid = true;
            scoreChange = from.source === 'foundation' ? -15 : 0;
        }
    }

    if (!moveValid) return null;

    // 3. Finalizar movimento
    newState.tableau = flipTableauCard(newState.tableau);
    newState.moves += 1;
    newState.score += scoreChange;
    newState.selected = null;

    // Salvar no histórico
    const historyState = JSON.parse(JSON.stringify(state)) as GameState;
    historyState.moveHistory = [];
    newState.moveHistory = [...state.moveHistory, historyState];

    return newState;
}

export function undoMove(state: GameState): GameState {
    if (state.moveHistory.length === 0) return state;
    const previousState = state.moveHistory[state.moveHistory.length - 1];
    return {
        ...previousState,
        moveHistory: state.moveHistory.slice(0, -1)
    };
}

// Encontrar jogada automática (para botão "Hint")
export function findAutoMove(state: GameState): {
    from: 'waste' | 'tableau';
    pileIndex?: number;
    cardIndex?: number;
    to: 'foundation' | 'tableau';
    toPileIndex?: number;
} | null {
    // Prioridade 1: Waste -> Foundation
    if (state.waste.length > 0) {
        const card = state.waste[state.waste.length - 1];
        if (canMoveToFoundation(card, state.foundations[card.suit])) {
            return { from: 'waste', to: 'foundation' };
        }
    }

    // Prioridade 2: Tableau -> Foundation
    for (let i = 0; i < 7; i++) {
        const col = state.tableau[i];
        if (col.length > 0) {
            const card = col[col.length - 1];
            if (card.faceUp && canMoveToFoundation(card, state.foundations[card.suit])) {
                return { from: 'tableau', pileIndex: i, cardIndex: col.length - 1, to: 'foundation' };
            }
        }
    }

    // Prioridade 3: Waste -> Tableau
    if (state.waste.length > 0) {
        const card = state.waste[state.waste.length - 1];
        for (let i = 0; i < 7; i++) {
            if (canMoveToTableau(card, state.tableau[i])) {
                return { from: 'waste', to: 'tableau', toPileIndex: i };
            }
        }
    }

    return null;
}
