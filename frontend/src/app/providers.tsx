"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { BillingPeriodProvider } from '../contexts/BillingPeriodContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return  <ChakraProvider>{children}</ChakraProvider>;
}
