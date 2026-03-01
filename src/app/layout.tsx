import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'PromptLab — Prompt Engineering Toolkit',
  description: 'Test, version, and compare prompts across AI models',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          {/* Top nav */}
          <header className="sticky top-0 z-40 border-b bg-white">
            <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4">
              <div className="flex items-center gap-6">
                <Link href="/" className="text-lg font-bold text-brand-700">
                  PromptLab
                </Link>
                <nav className="flex items-center gap-4 text-sm">
                  <Link href="/" className="text-gray-600 hover:text-gray-900">
                    Dashboard
                  </Link>
                  <Link href="/prompts" className="text-gray-600 hover:text-gray-900">
                    Prompts
                  </Link>
                  <Link href="/playground" className="text-gray-600 hover:text-gray-900">
                    Playground
                  </Link>
                  <Link href="/compare" className="text-gray-600 hover:text-gray-900">
                    Compare
                  </Link>
                </nav>
              </div>
              <a
                href="https://github.com/yourusername/promptlab"
                className="text-sm text-gray-400 hover:text-gray-600"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
