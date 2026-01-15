import { getVersion } from './version';
import { useAuthStore } from '../store/authStore';
import { useDevCockpitStore } from '../store/devCockpitStore';

export async function buildSystemReport() {
    const { user } = useAuthStore.getState();
    const { unlockedAt, ttlMs } = useDevCockpitStore.getState();
    const versionInfo = await getVersion();

    // Performance check (latency)
    const startTime = performance.now();
    let apiStatus = 'UNKNOWN';
    let latency = 0;

    try {
        // Try to reach a lightweight endpoint
        const response = await fetch('/api/health'); // Or any lightweight endpoint
        const endTime = performance.now();
        latency = Math.round(endTime - startTime);
        apiStatus = response.ok ? 'ONLINE' : 'ERROR';
    } catch (e) {
        apiStatus = 'OFFLINE';
    }

    const report = {
        metadata: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
        },
        user: {
            id: user?.id,
            email: user?.email ? maskEmail(user.email) : null,
            role: user?.role,
            division: user?.division,
        },
        system: {
            version: versionInfo.version,
            build: versionInfo.buildNumber,
            stage: versionInfo.stage,
            env: import.meta.env.MODE,
            api: {
                status: apiStatus,
                latencyMs: latency
            }
        },
        security: {
            masterSession: unlockedAt ? {
                unlockedAt: new Date(unlockedAt).toISOString(),
                expiresAt: new Date(unlockedAt + ttlMs).toISOString(),
                ttlMs: ttlMs
            } : 'LOCKED',
            biometricsEnabled: !!localStorage.getItem('biometric_enabled')
        },
        storage: {
            localStorageItems: Object.keys(localStorage).length,
            sessionStorageItems: Object.keys(sessionStorage).length,
            agendaDebug: localStorage.getItem('agenda_debug_enabled') === '1'
        }
    };

    return report;
}

function maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (!domain) return '***';
    const maskedName = name.length > 2 ? `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}` : '***';
    const [dName, dExt] = domain.split('.');
    const maskedDomain = `${dName[0]}***.${dExt}`;
    return `${maskedName}@${maskedDomain}`;
}
