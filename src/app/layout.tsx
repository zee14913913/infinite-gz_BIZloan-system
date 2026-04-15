import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { TopNav } from '@/components/layout/TopNav'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-playfair',
})
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'BCIS — Bank Credit Intelligence System',
  description: 'Malaysia SME Corporate Loan Intelligence | INFINITE GZ SDN BHD',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" data-theme="light" suppressHydrationWarning>
      <body className={`${playfair.variable} ${inter.variable}`}>
        <TopNav />
        <main className="page-content">{children}</main>
      </body>
    </html>
  )
}
