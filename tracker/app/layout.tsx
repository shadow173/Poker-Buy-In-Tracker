// app/layout.tsx
import './globals.css';
import '@mantine/core/styles.css';

import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Poker Buy-In Tracker',
  description: 'Track poker buy-ins with ease.',
};

// Client-side wrapper component
const ClientProvider = ({ children }: { children: ReactNode }) => {
  return (
    <MantineProvider defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" data-mantine-color-scheme="light">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}