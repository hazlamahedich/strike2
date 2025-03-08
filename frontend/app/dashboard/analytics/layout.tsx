'use client';

import React from 'react';
import { AnalyticsProvider } from '@/context/AnalyticsContext';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AnalyticsProvider>{children}</AnalyticsProvider>;
}