import type { Metadata } from "next";

import './globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import ContextProvider from '@/context';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: "ZK Payroll-Backed Loan",
  description: "Privacy-preserving payroll-backed lending platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ContextProvider>
          <Navigation />
          <main className="container-fluid py-4" style={{ maxWidth: '1400px' }}>
            {children}
          </main>
        </ContextProvider>
      </body>
    </html>
  );
}
