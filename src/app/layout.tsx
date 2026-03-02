import type { Metadata } from 'next';
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
      <body>{children}</body>
    </html>
  );
}
