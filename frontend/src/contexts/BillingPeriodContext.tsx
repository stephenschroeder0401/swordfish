// src/contexts/BillingPeriodContext.js

import { createContext, useContext, useState } from 'react';

const BillingPeriodContext = createContext(null);

export const useBillingPeriod = () => useContext(BillingPeriodContext);

export const BillingPeriodProvider = ({ children }) => {
  const [billingPeriod, setBillingPeriod] = useState(null);

  return (
    <BillingPeriodContext.Provider value={{ billingPeriod, setBillingPeriod }}>
      {children}
    </BillingPeriodContext.Provider>
  );
};
