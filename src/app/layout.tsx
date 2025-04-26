
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster" // Import Toaster
import { AppProvider } from '@/context/AppContext'; // Import AppProvider
import { ApolloProvider } from '@apollo/client'; // Import ApolloProvider
import client from '@/lib/apollo-client'; // Import configured Apollo Client

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NBT Inter Shakha Volleyball Tournament', // Update title
  description: 'Live Volleyball Tournament Scores and Standings', // Update description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
       <ApolloProvider client={client}> {/* Wrap with ApolloProvider */}
         <AppProvider> {/* Wrap children with AppProvider */}
           {children}
           <Toaster /> {/* Add Toaster component */}
         </AppProvider>
       </ApolloProvider>
      </body>
    </html>
  );
}
