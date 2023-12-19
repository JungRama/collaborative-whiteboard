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

export const metadata: Metadata = {
  title: 'Create Turborepo',
  description: 'Generated by create turbo',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className={plusJakartaSans.className}>
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
