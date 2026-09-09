import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
const inter = Inter({ subsets: ['latin'] });
import { ThemeProvider } from '@/components/theme-provider';
import { ToastContainer } from 'react-toastify';
import NextTopLoader from 'nextjs-toploader';
import 'react-toastify/dist/ReactToastify.css';

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'POS Terminal | MyTara',
  description: 'MyTara Point of Sales System',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MyTara POS',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full w-full overflow-hidden">
      <body className={`${inter.className} h-full w-full overflow-hidden m-0 p-0`}>
        <div className="pos-forced-landscape-root h-full w-full overflow-hidden">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NextTopLoader showSpinner={false} />
            {children}
            <ToastContainer />
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
