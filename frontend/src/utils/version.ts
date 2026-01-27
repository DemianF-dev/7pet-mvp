import { useState, useEffect } from 'react';

/**
 * Utilitário para gerenciar informações de versão do sistema
 */

interface VersionInfo {
    version: string;
    stage: string;
    timestamp: string;
    buildNumber: number;
    releaseNotes: string;
}

let cachedVersion: VersionInfo | null = null;

/**
 * Carrega as informações de versão do arquivo VERSION.json
 */
export async function getVersion(): Promise<VersionInfo> {
    if (cachedVersion) {
        return cachedVersion;
    }

    try {
        const response = await fetch('/VERSION.json');
        if (!response.ok) {
            throw new Error('Failed to load version info');
        }
        cachedVersion = await response.json();
        return cachedVersion!;
    } catch (error) {
        console.warn('Could not load version info:', error);
        return {
            version: 'UNKNOWN',
            stage: 'UNKNOWN',
            timestamp: new Date().toISOString(),
            buildNumber: 0,
            releaseNotes: ''
        };
    }
}

/**
 * Retorna apenas o número da versão (formato curto)
 */
export async function getVersionString(): Promise<string> {
    const info = await getVersion();
    return info.version;
}

/**
 * Retorna informações formatadas para exibição
 */
export async function getVersionDisplay(): Promise<string> {
    const info = await getVersion();
    return `${info.version} (Build #${info.buildNumber})`;
}

/**
 * Hook React para usar informações de versão
 */
export function useVersion() {
    const [version, setVersion] = useState<VersionInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getVersion().then(v => {
            setVersion(v);
            setLoading(false);
        });
    }, []);

    return { version, loading };
}
