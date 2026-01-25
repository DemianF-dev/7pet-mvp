import { useState, useEffect } from 'react';

/**
 * Device detection utilities for adaptive performance
 */

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLowEnd: boolean;
  deviceMemory: number;
  cores: number;
  connectionType: string;
  saveData: boolean;
  isSlowConnection: boolean;
  pixelRatio: number;
  screenWidth: number;
  screenHeight: number;
}

export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => 
    getDeviceInfo()
  );
  
  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo(getDeviceInfo());
    };
    
    // Atualizar quando mudar orientação ou tamanho de tela
    const handleResize = () => {
      const timeout = setTimeout(updateDeviceInfo, 250);
      return () => clearTimeout(timeout);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Atualizar quando mudar conexão (se suportado)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const handleConnectionChange = () => updateDeviceInfo();
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);
  
  return deviceInfo;
}

/**
 * Detecta informações do dispositivo (sem React)
 */
export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  // Detectar tipo de dispositivo
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || screenWidth < 768;
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent) || (screenWidth >= 768 && screenWidth < 1024);
  const isDesktop = !isMobile && !isTablet;
  
  // Informações de hardware
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Verificar se suporta save data
  const saveData = 'onbeforeunload' in window;
  
  // Detectar tipo de conexão
  let connectionType = 'unknown';
  let isSlowConnection = false;
  
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    connectionType = connection.effectiveType || connection.type || 'unknown';
    isSlowConnection = ['slow-2g', '2g', '3g'].includes(connectionType);
  }
  
  // Determinar se é low-end
  const isLowEnd = (
    deviceMemory <= 2 || 
    cores <= 2 || 
    isSlowConnection ||
    (isMobile && pixelRatio <= 1) // Dispositivos móveis antigos
  );
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isLowEnd,
    deviceMemory,
    cores,
    connectionType,
    saveData,
    isSlowConnection,
    pixelRatio,
    screenWidth,
    screenHeight,
  };
}

/**
 * Detecta capacidade de caching baseada no dispositivo
 */
export function getCacheCapacity(): 'low' | 'medium' | 'high' {
  const info = getDeviceInfo();
  
  if (info.isLowEnd) {
    return 'low';
  }
  
  if (info.isMobile && info.deviceMemory <= 4) {
    return 'medium';
  }
  
  return 'high';
}

/**
 * Retorna configurações de stale time otimizadas para o dispositivo
 */
export function getOptimizedStaleTime(baseTime: number): number {
  const info = getDeviceInfo();
  
  if (info.isLowEnd) {
    return Math.min(baseTime, 30_000); // 30s max para low-end
  }
  
  if (info.isMobile) {
    return Math.min(baseTime, 60_000); // 1min max para mobile
  }
  
  return baseTime; // Manter base time para desktop
}

/**
 * Detecta se deve usar animações
 */
export function shouldUseAnimations(info?: DeviceInfo): boolean {
  const device = info || getDeviceInfo();
  
  // Desativar em low-end ou se preferir reduced motion
  if (device.isLowEnd) return false;
  
  // Manter em desktop ou tablets
  if (device.isDesktop || device.isTablet) return true;
  
  // Verificar preferência do usuário
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  
  return true;
}

/**
 * Determina número máximo de itens para virtualização
 */
export function getMaxVirtualizedItems(info?: DeviceInfo): number {
  const device = info || getDeviceInfo();
  
  if (device.isLowEnd) {
    return 50;
  }
  
  if (device.isMobile) {
    return 100;
  }
  
  return 200; // Desktop
}

/**
 * Tempo de debounce otimizado para input/buscas
 */
export function getDebounceDelay(info?: DeviceInfo): number {
  const device = info || getDeviceInfo();
  
  if (device.isSlowConnection) {
    return 800; // Mais tempo para conexão lenta
  }
  
  if (device.isMobile) {
    return 300; // Padrão mobile
  }
  
  return 150; // Desktop/fast connection
}

/**
 * Determina se deve prefetch dados
 */
export function shouldPrefetch(info?: DeviceInfo): boolean {
  const device = info || getDeviceInfo();
  
  // Não prefetch em low-end ou conexão lenta
  if (device.isLowEnd || device.isSlowConnection) {
    return false;
  }
  
  // Verificar se está em dados móveis
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    const isCellular = connection.type === 'cellular';
    const saveData = connection.saveData;
    
    // Não prefetch em dados móveis com saveData: false
    if (isCellular && !saveData) {
      return false;
    }
  }
  
  return true;
}

/**
 * Retorna estratégia de cache otimizada
 */
export function getCacheStrategy(info?: DeviceInfo): 'aggressive' | 'balanced' | 'conservative' {
  const device = info || getDeviceInfo();
  
  if (device.isLowEnd) {
    return 'conservative'; // Mínimo cache, mais checkes
  }
  
  if (device.isSlowConnection) {
    return 'balanced'; // Cache intermediário
  }
  
  return 'aggressive'; // Cache máximo para boa conexão
}

/**
 * Hook para detectar mudanças de performance
 */
export function usePerformanceMonitor() {
  const [performance, setPerformance] = useState({
    fps: 60,
    memoryUsage: 0,
    isThrottling: false,
  });
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        setPerformance(prev => ({
          ...prev,
          fps,
          isThrottling: fps < 30,
        }));
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
    
    // Monitorar uso de memória (se disponível)
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        setPerformance(prev => ({
          ...prev,
          memoryUsage: usage,
        }));
      };
      
      const interval = setInterval(checkMemory, 5000);
      return () => clearInterval(interval);
    }
    
    return () => {
      // Cleanup handled by browser garbage collection
    };
  }, []);
  
  return performance;
}