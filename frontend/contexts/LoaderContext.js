import React, { createContext, useContext, useState, useCallback } from 'react';

const LoaderContext = createContext();

export const useLoader = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error('useLoader must be used within LoaderProvider');
  }
  return context;
};

export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [loadingCount, setLoadingCount] = useState(0);

  const showLoader = useCallback((message = 'Loading...') => {
    setLoadingMessage(message);
    setLoadingCount(prev => {
      const newCount = prev + 1;
      if (newCount === 1) {
        setLoading(true);
      }
      return newCount;
    });
  }, []);

  const hideLoader = useCallback(() => {
    setLoadingCount(prev => {
      const newCount = Math.max(0, prev - 1);
      if (newCount === 0) {
        setLoading(false);
      }
      return newCount;
    });
  }, []);

  const resetLoader = useCallback(() => {
    setLoadingCount(0);
    setLoading(false);
  }, []);

  return (
    <LoaderContext.Provider
      value={{
        loading,
        loadingMessage,
        showLoader,
        hideLoader,
        resetLoader,
      }}
    >
      {children}
    </LoaderContext.Provider>
  );
};

