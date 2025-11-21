import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sketch2Render',
  description: 'Transform sketches into hyperrealistic renderings with natural light and shadows.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="container">
          <div className="nav">
            <Link href="/" className="brand">Sketch2Render</Link>
            <nav className="links">
              <Link href="/guide">Guide</Link>
              <a href="https://agentic-b20aa237.vercel.app" target="_blank" rel="noreferrer">Production</a>
              <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="container footer">
          <span>? {new Date().getFullYear()} Sketch2Render</span>
          <span>Built with Next.js</span>
        </footer>
      </body>
    </html>
  );
}
