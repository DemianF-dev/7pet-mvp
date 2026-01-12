
/**
 * Zen Pad - Espuma Engine
 * 
 * A relaxing 2D canvas simulation of soap bubbles.
 * Features:
 * - Fluid-like particle system
 * - Soft responsive foam aesthetics
 * - Minimal resource usage (Canvas 2D)
 * - Adaptive quality based on FPS
 */

import { GameOptions } from '../../types/game.types';

// Types
interface Point {
    x: number;
    y: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    baseRadius: number;
    alpha: number;
    phase: number; // For gentle oscillation
    life: number; // 0 to 1, mostly 1 for persistent bubbles
}

interface Pointer {
    id: number;
    x: number;
    y: number;
    px: number; // previous x
    py: number; // previous y
    active: boolean;
}

// Configuration
const CONFIG = {
    PARTICLE_COUNT: {
        MOBILE: { MIN: 600, START: 1500, MAX: 3000 },
        DESKTOP: { MIN: 1500, START: 4000, MAX: 8000 } // Reduced max slightly for safety
    },
    COLORS: {
        BG: 'rgba(255, 255, 255, 0)', // Transparent, uses CSS bg
        BUBBLE: '255, 255, 255' // RGB
    },
    PHYSICS: {
        DRAG: 0.96,
        SWIRL_STRENGTH: 0.15,
        PUSH_STRENGTH: 0.05,
        MOUSE_RADIUS: 150,
        BASE_SPEED: 0.2
    }
};

export class ZenEspumaEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private rafId: number | null = null;
    private isPaused: boolean = false;

    // State
    private particles: Particle[] = [];
    private pointers: Map<number, Pointer> = new Map();
    private width: number = 0;
    private height: number = 0;
    private pixelRatio: number = 1;

    // Performance
    private lastTime: number = 0;
    private fpsArray: number[] = [];
    private qualityCheckTimer: number = 0;
    private targetParticleCount: number;

    // Options
    private options: GameOptions;
    private themeColors = {
        primary: '255, 255, 255',
        secondary: '200, 230, 255'
    };

    constructor(canvas: HTMLCanvasElement, options: GameOptions) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })!;
        this.options = options || {};

        // Initial setup
        this.pixelRatio = window.devicePixelRatio || 1;
        this.resize();
        this.updateThemeColors();

        // Determine initial particle count
        const isMobile = window.innerWidth < 768;
        this.targetParticleCount = isMobile
            ? CONFIG.PARTICLE_COUNT.MOBILE.START
            : CONFIG.PARTICLE_COUNT.DESKTOP.START;

        if (this.options.reducedMotion) {
            this.targetParticleCount = isMobile
                ? CONFIG.PARTICLE_COUNT.MOBILE.MIN
                : CONFIG.PARTICLE_COUNT.DESKTOP.MIN;
        }

        this.initParticles();
        this.bindEvents();
        this.start();
    }

    private updateThemeColors() {
        const style = getComputedStyle(document.body);
        // Extract RGB values from CSS variables if they exist, else fallback
        // We assume --color-accent-primary might be in hex or rgb. 
        // For simplicity in this lightweight engine, we'll keep white bubbles 
        // that pick up background color via transparency, but we can tint them.

        // Let's stick to white/transparent aesthetics for "Soap" feel which works on any bg.
    }

    private resize = () => {
        const rect = this.canvas.parentElement?.getBoundingClientRect();
        if (!rect) return;

        this.width = rect.width;
        this.height = rect.height;

        this.canvas.width = this.width * this.pixelRatio;
        this.canvas.height = this.height * this.pixelRatio;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.ctx.scale(this.pixelRatio, this.pixelRatio);
    };

    private initParticles() {
        this.particles = [];
        this.addParticles(this.targetParticleCount);
    }

    private addParticles(count: number) {
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    private createParticle(): Particle {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            baseRadius: Math.random() * 8 + 2, // 2px to 10px
            radius: 0, // Animate in
            alpha: Math.random() * 0.3 + 0.1, // Soft alpha
            phase: Math.random() * Math.PI * 2,
            life: 1
        };
    }

    private bindEvents() {
        window.addEventListener('resize', this.resize);

        // Pointer events
        this.canvas.addEventListener('pointerdown', this.handlePointerDown);
        this.canvas.addEventListener('pointermove', this.handlePointerMove);
        this.canvas.addEventListener('pointerup', this.handlePointerUp);
        this.canvas.addEventListener('pointercancel', this.handlePointerUp);
        this.canvas.addEventListener('pointerleave', this.handlePointerUp);
    }

    private handlePointerDown = (e: PointerEvent) => {
        this.canvas.setPointerCapture(e.pointerId);
        const rect = this.canvas.getBoundingClientRect();
        this.pointers.set(e.pointerId, {
            id: e.pointerId,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            px: e.clientX - rect.left,
            py: e.clientY - rect.top,
            active: true
        });

        // "Puff" effect on tap
        this.spawnPuff(e.clientX - rect.left, e.clientY - rect.top);
    };

    private handlePointerMove = (e: PointerEvent) => {
        const pointer = this.pointers.get(e.pointerId);
        if (pointer) {
            const rect = this.canvas.getBoundingClientRect();
            pointer.px = pointer.x;
            pointer.py = pointer.y;
            pointer.x = e.clientX - rect.left;
            pointer.y = e.clientY - rect.top;
        }
    };

    private handlePointerUp = (e: PointerEvent) => {
        this.canvas.releasePointerCapture(e.pointerId);
        this.pointers.delete(e.pointerId);
    };

    private spawnPuff(x: number, y: number) {
        // Spawn temporary small bubbles
        const count = 15;
        for (let i = 0; i < count; i++) {
            const p = this.createParticle();
            p.x = x + (Math.random() - 0.5) * 20;
            p.y = y + (Math.random() - 0.5) * 20;
            p.vx = (Math.random() - 0.5) * 4;
            p.vy = (Math.random() - 0.5) * 4;
            p.radius = Math.random() * 4 + 1;
            this.particles.push(p);
        }
    }

    private adjustQuality(deltaTime: number) {
        // Update FPS average
        const fps = 1000 / deltaTime;
        this.fpsArray.push(fps);
        if (this.fpsArray.length > 60) this.fpsArray.shift();

        // Check every 2 seconds
        this.qualityCheckTimer += deltaTime;
        if (this.qualityCheckTimer > 2000) {
            const avgFps = this.fpsArray.reduce((src, a) => src + a, 0) / this.fpsArray.length;
            this.qualityCheckTimer = 0;

            const isMobile = window.innerWidth < 768;
            const bounds = isMobile ? CONFIG.PARTICLE_COUNT.MOBILE : CONFIG.PARTICLE_COUNT.DESKTOP;

            if (avgFps < 45 && this.targetParticleCount > bounds.MIN) {
                // Reduce quality
                this.targetParticleCount = Math.max(bounds.MIN, Math.floor(this.targetParticleCount * 0.8));
                // Remove excess particles immediately
                if (this.particles.length > this.targetParticleCount) {
                    this.particles.splice(0, this.particles.length - this.targetParticleCount);
                }
            } else if (avgFps > 58 && this.targetParticleCount < bounds.MAX && !this.options.reducedMotion) {
                // Increase quality
                this.targetParticleCount = Math.min(bounds.MAX, Math.floor(this.targetParticleCount * 1.1));
            }
        }

        // Gradually add particles if needed
        if (this.particles.length < this.targetParticleCount) {
            this.particles.push(this.createParticle());
        }
    }

    private update(timestamp: number) {
        if (this.isPaused) return;

        const deltaTime = Math.min(timestamp - this.lastTime, 50); // Cap delta at 50ms
        this.lastTime = timestamp;

        this.adjustQuality(deltaTime);

        // Fade effect for trails
        // Higher alpha = shorter trails (clears more of previous frame)
        // Reduced motion = faster clear (0.4) vs standard (0.15)
        const clearAlpha = this.options.reducedMotion ? 0.3 : 0.15;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${clearAlpha})`; // Assuming light mode or variable blend mode
        // Note: For proper trails on a transparent canvas, we use globalCompositeOperation

        // Actually, to support transparent BG with trails, we need to clear with specific composite op
        // or just accept that "clearing" on transparent canvas means erasing.
        // But requested "trail" implies we keep previous frames.
        // Canvas trick for transparent background trails:
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.fillStyle = `rgba(255, 255, 255, ${clearAlpha})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.globalCompositeOperation = 'source-over'; // standard draw

        // Physics time scale
        const t = timestamp * 0.0005;

        // Update particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            // 1. Procedural Flow Field (Soft sine waves)
            // Creates a gentle meandering motion
            const angle = Math.sin(p.x * 0.002 + t) + Math.cos(p.y * 0.002 + t * 0.5);
            p.vx += Math.cos(angle) * 0.02;
            p.vy += Math.sin(angle) * 0.02;

            // 2. Interactive Forces
            this.pointers.forEach(pointer => {
                const dx = p.x - pointer.x;
                const dy = p.y - pointer.y;
                const distSq = dx * dx + dy * dy;
                const radiusSq = CONFIG.PHYSICS.MOUSE_RADIUS * CONFIG.PHYSICS.MOUSE_RADIUS;

                if (distSq < radiusSq) {
                    const dist = Math.sqrt(distSq);
                    const pct = 1 - (dist / CONFIG.PHYSICS.MOUSE_RADIUS);

                    // Push force (Radial)
                    const force = pct * pct * CONFIG.PHYSICS.PUSH_STRENGTH;
                    p.vx += (dx / dist) * force;
                    p.vy += (dy / dist) * force;

                    // Swirl force (Tangential - Drag based)
                    // If pointer is moving, impart its velocity
                    const ptrVx = pointer.x - pointer.px;
                    const ptrVy = pointer.y - pointer.py;

                    if (Math.abs(ptrVx) > 0.1 || Math.abs(ptrVy) > 0.1) {
                        p.vx += ptrVx * 0.1 * pct;
                        p.vy += ptrVy * 0.1 * pct;
                    }
                }
            });

            // 3. Apply Velocity & Drag
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= CONFIG.PHYSICS.DRAG;
            p.vy *= CONFIG.PHYSICS.DRAG;

            // 4. Oscillation (Breathing bubble size)
            if (p.radius < p.baseRadius) {
                p.radius += 0.1; // Grow in
            }
            // Gentle pulse
            const pulse = 1 + Math.sin(t * 2 + p.phase) * 0.05;

            // 5. Wrap Around
            if (p.x < -50) p.x = this.width + 50;
            if (p.x > this.width + 50) p.x = -50;
            if (p.y < -50) p.y = this.height + 50;
            if (p.y > this.height + 50) p.y = -50;

            // Draw
            this.drawParticle(p, pulse);
        }

        this.rafId = requestAnimationFrame(this.update.bind(this));
    }

    private drawParticle(p: Particle, scale: number) {
        const r = p.radius * scale;
        if (r <= 0) return;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);

        // Fill: White with alpha
        // If we want it to adapt to theme, we rely on white overlaying the page BG 
        // which creates a "tint" effect naturally if we use low alpha white.
        this.ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        this.ctx.fill();

        // Highlight (Fake reflection)
        // Small offset circle, higher opacity
        this.ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha + 0.3})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x - r * 0.3, p.y - r * 0.3, r * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        // Subtle Stroke (Bubble edge)
        if (p.baseRadius > 5) {
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha * 0.5})`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    public start() {
        if (!this.isPaused && !this.rafId) {
            this.lastTime = performance.now();
            this.rafId = requestAnimationFrame(this.update.bind(this));
        }
    }

    public pause() {
        this.isPaused = true;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    public resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
        this.start();
    }

    public destroy() {
        this.pause();
        window.removeEventListener('resize', this.resize);
        this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
        this.canvas.removeEventListener('pointermove', this.handlePointerMove);
        this.canvas.removeEventListener('pointerup', this.handlePointerUp);
        this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
        this.canvas.removeEventListener('pointerleave', this.handlePointerUp);

        this.particles = [];
        this.pointers.clear();
    }
}
