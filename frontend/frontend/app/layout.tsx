import type { Metadata } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import './globals.css';
import { NuqsAdapter } from 'nuqs/adapters/next';
import { Providers } from './provider';
import { MediaProtection } from '@/components/media-protection';
import { getServerUser } from '@/lib/server-auth';
import { generateBaseMetadata } from '@/lib/seo/metadata';
import { generateWebsiteStructuredData, structuredDataToScript } from '@/lib/seo/structuredData';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = generateBaseMetadata();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch user on server side to prefill global context
  const initialUser = await getServerUser();

  // Generate structured data for the website
  const websiteStructuredData = generateWebsiteStructuredData();

  return (
    <NuqsAdapter>
      <html lang='en' suppressHydrationWarning>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: structuredDataToScript(websiteStructuredData),
            }}
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
        >
          <MediaProtection />
          <Providers initialUser={initialUser}>{children}</Providers>
        </body>
      </html>
    </NuqsAdapter>
  );
}
