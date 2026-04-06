import React, { createContext, useContext, useMemo } from 'react';
import TandiPay from '../core/TandiPay';

const TandiPayContext = createContext(null);

export const TandiPayProvider = ({ children, config }) => {
  const tandipay = useMemo(() => new TandiPay(config), [config.apiKey]);
  
  return (
    <TandiPayContext.Provider value={tandipay}>
      {children}
    </TandiPayContext.Provider>
  );
};

export const useTandiPayContext = () => {
  const context = useContext(TandiPayContext);
  if (!context) {
    throw new Error('useTandiPayContext must be used within TandiPayProvider');
  }
  return context;
};