/**
 * Game Logic for Desenrosca a Coleira
 * 
 * Handles level generation and crossing detection
 */

import { Node, Edge, Difficulty, Point } from './types';

const PET_EMOJIS = ['🐕', '🐈', '🐇', '🐦', '🐠', '🐹', '🐢', '🦎', '🐍', '🦜', '🦔', '🦦', '🐿️', '🦘'];

/**
 * Get level configuration based on difficulty
 */
function getLevelConfig(difficulty: Difficulty): { nodeCount: number; edgeCount: number } {
    switch (difficulty) {
        case 'easy':
            return { nodeCount: 6, edgeCount: 8 };
        case 'medium':
            return { nodeCount: 10, edgeCount: 14 };
        case 'hard':
            return { nodeCount: 14, edgeCount: 20 };
    }
}

/**
 * Generate a random connected graph
 */
function generateConnectedGraph(nodeCount: number, edgeCount: number): Edge[] {
    const edges: Edge[] = [];
    const connected = new Set<number>([0]);
    const unconnected = new Set<number>();

    for (let i = 1; i < nodeCount; i++) {
        unconnected.add(i);
    }

    // Create spanning tree (ensure connectivity)
    while (unconnected.size > 0) {
        const from = Array.from(connected)[Math.floor(Math.random() * connected.size)];
        const toArr = Array.from(unconnected);
        const to = toArr[Math.floor(Math.random() * toArr.length)];

        edges.push({
            id: `edge-${from}-${to}`,
            from: `node-${from}`,
            to: `node-${to}`
        });

        connected.add(to);
        unconnected.delete(to);
    }

    // Add extra edges randomly
    const maxAttempts = edgeCount * 3;
    let attempts = 0;

    while (edges.length < edgeCount && attempts < maxAttempts) {
        attempts++;
        const from = Math.floor(Math.random() * nodeCount);
        const to = Math.floor(Math.random() * nodeCount);

        if (from === to) continue;

        const edgeId1 = `edge-${from}-${to}`;
        void `edge-${to}-${from}`; // edgeId2 - reverse direction check

        const exists = edges.some(e =>
            (e.from === `node-${from}` && e.to === `node-${to}`) ||
            (e.from === `node-${to}` && e.to === `node-${from}`)
        );

        if (!exists) {
            edges.push({
                id: edgeId1,
                from: `node-${from}`,
                to: `node-${to}`
            });
        }
    }

    return edges;
}

/**
 * Create initial node positions in a circular layout (solved state)
 */
function createCircularLayout(nodeCount: number): Node[] {
    const nodes: Node[] = [];
    const centerX = 0.5;
    const centerY = 0.5;
    const radius = 0.35;

    for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * 2 * Math.PI - Math.PI / 2;
        const emoji = PET_EMOJIS[i % PET_EMOJIS.length];

        nodes.push({
            id: `node-${i}`,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            label: emoji
        });
    }

    return nodes;
}

/**
 * Scramble node positions to create crossings
 */
function scramblePositions(nodes: Node[], _edges: Edge[]): Node[] {
    const scrambled = [...nodes];
    const scrambleCount = Math.floor(nodes.length * 0.6);

    // Randomly move some nodes to create crossings
    for (let i = 0; i < scrambleCount; i++) {
        const idx = Math.floor(Math.random() * nodes.length);
        const angle = Math.random() * 2 * Math.PI;
        const distance = 0.1 + Math.random() * 0.3;

        scrambled[idx] = {
            ...scrambled[idx],
            x: Math.max(0.1, Math.min(0.9, scrambled[idx].x + distance * Math.cos(angle))),
            y: Math.max(0.1, Math.min(0.9, scrambled[idx].y + distance * Math.sin(angle)))
        };
    }

    return scrambled;
}

/**
 * Generate a new level
 */
export function generateLevel(difficulty: Difficulty): { nodes: Node[]; edges: Edge[] } {
    const { nodeCount, edgeCount } = getLevelConfig(difficulty);

    const edges = generateConnectedGraph(nodeCount, edgeCount);
    const baseNodes = createCircularLayout(nodeCount);
    const nodes = scramblePositions(baseNodes, edges);

    return { nodes, edges };
}

/**
 * Check if two line segments intersect
 */
export function segmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
    const det = (p1: Point, p2: Point, p3: Point): number => {
        return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    };

    const d1 = det(b1, b2, a1);
    const d2 = det(b1, b2, a2);
    const d3 = det(a1, a2, b1);
    const d4 = det(a1, a2, b2);

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
        return true;
    }

    return false;
}

/**
 * Check if two edges share a node
 */
function edgesShareNode(e1: Edge, e2: Edge): boolean {
    return (
        e1.from === e2.from || e1.from === e2.to ||
        e1.to === e2.from || e1.to === e2.to
    );
}

/**
 * Count the number of edge crossings
 */
export function countCrossings(nodes: Node[], edges: Edge[]): number {
    let crossings = 0;

    const nodeMap = new Map<string, Point>();
    nodes.forEach(node => {
        nodeMap.set(node.id, { x: node.x, y: node.y });
    });

    for (let i = 0; i < edges.length; i++) {
        for (let j = i + 1; j < edges.length; j++) {
            const e1 = edges[i];
            const e2 = edges[j];

            // Skip if edges share a node
            if (edgesShareNode(e1, e2)) continue;

            const a1 = nodeMap.get(e1.from);
            const a2 = nodeMap.get(e1.to);
            const b1 = nodeMap.get(e2.from);
            const b2 = nodeMap.get(e2.to);

            if (a1 && a2 && b1 && b2) {
                if (segmentsIntersect(a1, a2, b1, b2)) {
                    crossings++;
                }
            }
        }
    }

    return crossings;
}

/**
 * Initialize a new game
 */
export function initializeGame(difficulty: Difficulty = 'medium') {
    const { nodes, edges } = generateLevel(difficulty);
    const crossings = countCrossings(nodes, edges);

    return {
        nodes,
        edges,
        crossings,
        moves: 0,
        time: 0,
        difficulty,
        isPaused: false,
        isSolved: false
    };
}
