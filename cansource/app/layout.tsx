import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: {
    default: 'CanSource — Find Canadian Suppliers',
    template: '%s | CanSource',
  },
  description:
    'The vetted directory of Canadian suppliers built for Shopify brands. Beat tariffs. Source domestic. Ship faster.',
  keywords: ['Canadian suppliers', 'Shopify suppliers', 'domestic sourcing', 'USMCA', 'tariffs'],
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    siteName: 'CanSource',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA">
      <body className="font-sans antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
