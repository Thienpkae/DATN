import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';

// Hook for real-time blockchain synchronization
const useBlockchainSync = (syncFunction, interval = 30000) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Manual sync function
  const sync = useCallback(async () => {
    if (!syncFunction || isSyncing) return;

    setIsSyncing(true);
    setError(null);

    try {
      await syncFunction();
      if (isMountedRef.current) {
        setLastSync(new Date());
        message.success('Dữ liệu đã được đồng bộ từ blockchain');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
        message.error(`Lỗi đồng bộ: ${err.message}`);
      }
    } finally {
      if (isMountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [syncFunction, isSyncing]);

  // Start automatic sync
  const startAutoSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      sync();
    }, interval);
  }, [sync, interval]);

  // Stop automatic sync
  const stopAutoSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Initial sync and start auto-sync
  useEffect(() => {
    if (syncFunction) {
      sync();
      startAutoSync();
    }

    return () => {
      stopAutoSync();
    };
  }, [syncFunction, startAutoSync, stopAutoSync]); // eslint-disable-line react-hooks/exhaustive-deps

  // Force sync function
  const forceSync = useCallback(() => {
    sync();
  }, [sync]);

  return {
    isSyncing,
    lastSync,
    error,
    sync: forceSync,
    startAutoSync,
    stopAutoSync
  };
};

export default useBlockchainSync;
