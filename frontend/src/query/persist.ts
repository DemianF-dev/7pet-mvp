import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import localForage from 'localforage';
import { shouldPersistQuery } from './keys';
import type { QueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

/**
 * React Query Persist Configuration
 * 
 * Security-focused offline persistence with:
 * - IndexedDB for maximum performance
 * - Domain-based allowlist for security
 * - Data sanitization to remove PII
 * - Automatic cleanup of old data
 * - Device-aware storage limits
 */

// Configure IndexedDB instance
const queryStorage = localForage.createInstance({
  name: '7pet-query-cache',
  driver: localForage.INDEXEDDB,
  storeName: 'react-query',
  version: 1.0,
});

/**
 * Create secure persister with safety boundaries
 */
export const queryPersister = createSyncStoragePersister({
  storage: queryStorage,
});

/**
 * Sanitize query data to remove sensitive information
 */
function sanitizeQueryData(data: unknown): unknown {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDataItem(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    return sanitizeDataItem(data);
  }
  
  return data;
}

/**
 * Sanitize individual data items
 */
function sanitizeDataItem(item: any): any {
  if (!item || typeof item !== 'object') return item;

  const sanitized = { ...item };

  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'privateKey',
    'ssn',
    'creditCard',
    'bankAccount',
  ];

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  // Sanitize nested objects
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      if (Array.isArray(sanitized[key])) {
        sanitized[key] = sanitized[key].map((subItem: any) => sanitizeDataItem(subItem));
      } else {
        sanitized[key] = sanitizeDataItem(sanitized[key]);
      }
    }
  });

  return sanitized;
}

/**
 * Enhanced query persister with security filtering
 */
export const secureQueryPersister = createSyncStoragePersister({
  storage: queryStorage,
  key: '7pet-react-query-cache',
  serialize: (client) => {
    try {
      // Filter queries based on security allowlist
      const queries = client.getQueryCache().getAll();
      const safeQueries = queries.filter((query: any) => 
        shouldPersistQuery(query.queryKey)
      ).map((query: any) => ({
        queryKey: query.queryKey,
        state: {
          ...query.state,
          data: sanitizeQueryData(query.state.data),
          error: null, // Don't persist errors
        },
      }));

      return JSON.stringify({
        ...client,
        queries: safeQueries,
      });
    } catch (error) {
      console.error('[Query Persister] Secure serialization error:', error);
      return '{}';
    }
  },
  deserialize: (str) => {
    try {
      return JSON.parse(str);
    } catch (error) {
      console.error('[Query Persister] Secure deserialization error:', error);
      return {};
    }
  },
});

/**
 * Storage usage monitor
 */
export async function getStorageUsage(): Promise<{
  used: number;
  available: number;
  percentage: number;
}> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      
      return {
        used,
        available: quota - used,
        percentage: quota > 0 ? (used / quota) * 100 : 0,
      };
    }
    
    // Fallback for unsupported browsers
    return { used: 0, available: 0, percentage: 0 };
  } catch (error) {
    console.error('[Query Persister] Storage usage error:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
}

/**
 * Cleanup function for expired data
 */
export async function cleanupPersistedData(maxAge: number = 7 * 24 * 60 * 60 * 1000) {
  try {
    const keys = await queryStorage.keys();
    const now = Date.now();
    
    for (const key of keys) {
      try {
        const item = await queryStorage.getItem(key);
        if (item && typeof item === 'object') {
          const data = item as any;
          
          // Check if data is too old
          if (data.timestamp && (now - data.timestamp) > maxAge) {
            await queryStorage.removeItem(key);
            console.log(`[Query Persister] Cleaned up old data: ${key}`);
          }
        }
      } catch (error) {
        console.warn(`[Query Persister] Error checking ${key}:`, error);
      }
    }
  } catch (error) {
    console.error('[Query Persister] Cleanup error:', error);
  }
}

/**
 * Initialize persistence with cleanup
 */
export async function initializePersistence(queryClient: QueryClient) {
  try {
    // Clean up old data on startup
    await cleanupPersistedData();
    
    // Monitor storage usage
    const usage = await getStorageUsage();
    console.log('[Query Persister] Storage usage:', usage);
    
    if (usage.percentage > 80) {
      console.warn('[Query Persister] Storage usage is high, consider cleanup');
    }
    
    // Set up persistence with security filtering
    const removeClient = persistQueryClient({
      queryClient,
      persister: secureQueryPersister,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      buster: '1.0.0',
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => shouldPersistQuery(query.queryKey),
      },
    });

    return { removeClient, success: true };
  } catch (error) {
    console.error('[Query Persister] Initialization error:', error);
    return { removeClient: null, success: false };
  }
}

/**
 * Hook for automatic persistence management
 */
export function usePersistenceCleanup(queryClient: QueryClient) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ used: 0, available: 0, percentage: 0 });

  useEffect(() => {
    initializePersistence(queryClient).then(({ success }) => {
      setIsInitialized(success);
    });

    // Monitor storage usage periodically
    const interval = setInterval(async () => {
      const usage = await getStorageUsage();
      setStorageUsage(usage);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [queryClient]);

  return { isInitialized, storageUsage };
}