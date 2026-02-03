import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from './AppContext';

export const metadata: Metadata = {
  title: 'Умняут',
  description: 'Умняут - интеллектуальная игра в кроссворды',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
