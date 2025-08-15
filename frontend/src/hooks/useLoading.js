import { useState, useCallback, useRef } from 'react';

export const useLoading = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Đang tải...');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const progressIntervalRef = useRef(null);
  const loadingTimeoutRef = useRef(null);

  // Start loading with optional progress simulation
  const startLoading = useCallback((text = 'Đang tải...', simulateProgress = false) => {
    setLoading(true);
    setProgress(0);
    setLoadingText(text);
    setError(null);
    setSuccess(false);

    // Clear any existing intervals/timeouts
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Simulate progress if requested
    if (simulateProgress) {
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressIntervalRef.current);
            return 90; // Stop at 90% until actual completion
          }
          return prev + Math.random() * 10;
        });
      }, 200);
    }
  }, []);

  // Stop loading
  const stopLoading = useCallback(() => {
    setLoading(false);
    setProgress(100);
    
    // Clear intervals
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    // Show success briefly then reset
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setProgress(0);
    }, 1000);
  }, []);

  // Set error and stop loading
  const setLoadingError = useCallback((errorMessage, autoReset = true) => {
    setError(errorMessage);
    setLoading(false);
    setProgress(0);
    
    // Clear intervals
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    // Auto reset error after delay
    if (autoReset) {
      loadingTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, 5000);
    }
  }, []);

  // Update progress manually
  const updateProgress = useCallback((newProgress, text) => {
    setProgress(Math.min(Math.max(newProgress, 0), 100));
    if (text) {
      setLoadingText(text);
    }
  }, []);

  // Increment progress
  const incrementProgress = useCallback((amount = 10, text) => {
    setProgress(prev => Math.min(prev + amount, 100));
    if (text) {
      setLoadingText(text);
    }
  }, []);

  // Reset all states
  const reset = useCallback(() => {
    setLoading(false);
    setProgress(0);
    setLoadingText('Đang tải...');
    setError(null);
    setSuccess(false);
    
    // Clear intervals
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, []);

  // Wrap async function with loading states
  const withLoading = useCallback(async (asyncFn, options = {}) => {
    const {
      loadingText: text = 'Đang xử lý...',
      simulateProgress = true,
      onSuccess,
      onError,
      autoResetError = true,
    } = options;

    try {
      startLoading(text, simulateProgress);
      const result = await asyncFn();
      
      if (simulateProgress) {
        setProgress(100);
        // Small delay to show completion
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      stopLoading();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error?.message || error?.toString() || 'Đã xảy ra lỗi';
      setLoadingError(errorMessage, autoResetError);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
  }, [startLoading, stopLoading, setLoadingError]);

  // Loading state object for easy destructuring
  const loadingState = {
    loading,
    progress,
    loadingText,
    error,
    success,
  };

  // Loading actions object
  const loadingActions = {
    startLoading,
    stopLoading,
    setLoadingError,
    updateProgress,
    incrementProgress,
    reset,
    withLoading,
  };

  return {
    ...loadingState,
    ...loadingActions,
    loadingState,
    loadingActions,
  };
};

// Specialized loading hooks
export const useAsyncLoading = (asyncFn, options = {}) => {
  const {
    loadingText = 'Đang xử lý...',
    simulateProgress = true,
    onSuccess,
    onError,
    autoResetError = true,
  } = options;

  const loading = useLoading(false);

  const execute = useCallback(async (...args) => {
    return loading.withLoading(
      () => asyncFn(...args),
      {
        loadingText,
        simulateProgress,
        onSuccess,
        onError,
        autoResetError,
      }
    );
  }, [asyncFn, loading, loadingText, simulateProgress, onSuccess, onError, autoResetError]);

  return {
    ...loading,
    execute,
  };
};

export const useFormLoading = (initialState = false) => {
  const [submitting, setSubmitting] = useState(initialState);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const startSubmit = useCallback(() => {
    setSubmitting(true);
  }, []);

  const stopSubmit = useCallback(() => {
    setSubmitting(false);
  }, []);

  const startUpload = useCallback(() => {
    setUploading(true);
    setUploadProgress(0);
  }, []);

  const stopUpload = useCallback(() => {
    setUploading(false);
    setUploadProgress(0);
  }, []);

  const updateUploadProgress = useCallback((progress) => {
    setUploadProgress(Math.min(Math.max(progress, 0), 100));
  }, []);

  const resetFormLoading = useCallback(() => {
    setSubmitting(false);
    setUploading(false);
    setUploadProgress(0);
  }, []);

  return {
    submitting,
    uploading,
    uploadProgress,
    startSubmit,
    stopSubmit,
    startUpload,
    stopUpload,
    updateUploadProgress,
    resetFormLoading,
  };
};

export const usePageLoading = (initialState = false) => {
  const [pageLoading, setPageLoading] = useState(initialState);
  const [skeletonLoading, setSkeletonLoading] = useState(initialState);
  const [refreshing, setRefreshing] = useState(false);

  const startPageLoad = useCallback(() => {
    setPageLoading(true);
    setSkeletonLoading(true);
  }, []);

  const stopPageLoad = useCallback(() => {
    setPageLoading(false);
    setSkeletonLoading(false);
  }, []);

  const startRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const stopRefresh = useCallback(() => {
    setRefreshing(false);
  }, []);

  const resetPageLoading = useCallback(() => {
    setPageLoading(false);
    setSkeletonLoading(false);
    setRefreshing(false);
  }, []);

  return {
    pageLoading,
    skeletonLoading,
    refreshing,
    startPageLoad,
    stopPageLoad,
    startRefresh,
    stopRefresh,
    resetPageLoading,
  };
};

export default useLoading;
