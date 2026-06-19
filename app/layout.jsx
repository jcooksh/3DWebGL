import './globals.css';
import { Anton, JetBrains_Mono } from 'next/font/google';

// Condensed display face for the big kinetic type + a mono for the HUD readouts.
const display = Anton({ weight: '400', subsets: ['latin'], variable: '--font-display', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: 'TRACK — The Trace of Icons',
  description: 'A scroll-paced WebGL run. Distance-driven reveals on React Three Fiber + GSAP.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        <noscript>This experience requires JavaScript and WebGL.</noscript>
        {children}
      </body>
    </html>
  );
}
