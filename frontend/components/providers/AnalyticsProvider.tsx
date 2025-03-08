'use client';

import React from 'react';
import { AnalyticsProvider as BaseAnalyticsProvider } from '@/context/AnalyticsContext';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return <BaseAnalyticsProvider>{children}</BaseAnalyticsProvider>;
} 