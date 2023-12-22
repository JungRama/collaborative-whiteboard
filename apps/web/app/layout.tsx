'use client';

import '@ui/styles/globals.css';

import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import ApolloClientProvider from '@/providers/apollo.provider';

import { store } from '@/store/index.store';
import { Provider as ReduxProvider } from 'react-redux';

import { Toaster } from '@ui/components/ui/toaster';

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'] });
import './index.scss';

import { Next13ProgressBar } from 'next13-progressbar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className={plusJakartaSans.className}>
        <Next13ProgressBar
          height="2px"
          color="#000000"
          options={{ showSpinner: true }}
          showOnShallow
        />
        <ReduxProvider store={store}>
          <ApolloClientProvider>
            {children}
            <Toaster></Toaster>
          </ApolloClientProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
