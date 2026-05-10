import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'ConScene – Concert Reviews',
  description: 'Review live music. Share the moment.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
