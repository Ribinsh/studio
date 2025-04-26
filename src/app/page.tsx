
"use client";

import type { LiveMatchScoreData } from '@/lib/types'; // Use type from lib
import React, { useState, useCallback, useContext, useEffect } from 'react'; // Added useEffect and useCallback
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimerIcon, LoaderIcon, UsersIcon, BarChartIcon, AlertCircleIcon, Wrench } from 'lucide-react';
import TimeoutModal from '@/components/TimeoutModal';
import StandingsModal from '@/components/StandingsModal';
import LiveMatchDisplay from '@/components/LiveMatchDisplay';
import type { GroupStandings } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { AppContext } from '@/context/AppContext'; // Import AppContext
import Link from 'next/link'; // Import Link for navigation

export default function Home() {
  const { liveMatch, standings, isLoading } = useContext(AppContext); // Get state from context

  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);
  const [isStandingsModalOpen, setIsStandingsModalOpen] = useState(false);

  const handleTimeoutClick = () => {
     setIsTimeoutModalOpen(true);
  };

  const handleShowStandingsClick = () => {
    setIsStandingsModalOpen(true);
  };

  const handleTimeoutClose = useCallback(() => {
    setIsTimeoutModalOpen(false);
  }, []);

   // Determine badge text and variant based on loading, error, or live match data from context
   let liveBadgeText = 'Checking Live Status...';
   let badgeVariant: "secondary" | "destructive" | "default" = "secondary"; // Default to secondary

   if (isLoading) { // Use global loading state if needed, or remove if context handles it inherently
       liveBadgeText = 'Loading Data...';
       badgeVariant = "secondary";
   } else if (liveMatch) {
        const statusLower = liveMatch.status?.toLowerCase() || 'live';
        if (statusLower === 'live' || statusLower === '') {
             liveBadgeText = `LIVE MATCH: ${liveMatch.team1} vs ${liveMatch.team2}`;
             badgeVariant = "destructive"; // Use destructive (red) for live
        } else {
             liveBadgeText = `MATCH STATUS: ${liveMatch.status}`;
             badgeVariant = "default"; // Use default (blue) for other statuses
        }
   } else {
        liveBadgeText = 'No Match Currently Live';
        badgeVariant = "secondary";
   }


  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col">
       <header className="mb-6 flex justify-between items-center text-center px-4">
         <div></div> {/* Spacer */}
         <div className="flex flex-col items-center">
           <div className="flex items-center justify-center gap-3">
               {/* Volleyball SVG Icon */}
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary">
                 <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2ZM9.877 4.623A8.003 8.003 0 0 1 12 4c.85 0 1.67.13 2.44.375-.74.158-1.434.402-2.05.73a9.44 9.44 0 0 0-2.377 1.125 10.905 10.905 0 0 1 1.864-1.607Zm-2.072 2.24A10.9 10.9 0 0 0 6.198 8.5H4.75a9.986 9.986 0 0 1 .346-1.989 11.046 11.046 0 0 0 2.709.352Zm.773 3.637a9.43 9.43 0 0 1-.476 2.238 10.88 10.88 0 0 1-.156 2.367 10.9 10.9 0 0 1 2.056-.835 9.44 9.44 0 0 0 2.377-1.125 9.43 9.43 0 0 0 1.417-1.645 10.9 10.9 0 0 0-.526-2.238 10.88 10.88 0 0 0 .156-2.367A10.9 10.9 0 0 0 12.8 7.665a9.44 9.44 0 0 1-2.377 1.125 9.43 9.43 0 0 1-1.838 1.709Zm5.185-1.71A10.9 10.9 0 0 1 14.8 7.665a9.44 9.44 0 0 0 2.377-1.125 9.43 9.43 0 0 0 1.645-1.417 10.9 10.9 0 0 0 .526 2.238 10.88 10.88 0 0 0-.156 2.367 10.9 10.9 0 0 1-2.056.835 9.44 9.44 0 0 1-2.377 1.125 9.43 9.43 0 0 1 .215-.584Zm1.112 4.348a10.9 10.9 0 0 0 2.056-.835 9.44 9.44 0 0 1 1.125 2.377 9.43 9.43 0 0 1 .73 2.05A8.003 8.003 0 0 1 12 20a8.003 8.003 0 0 1-2.44-.375c.74-.158 1.434-.402 2.05-.73a9.44 9.44 0 0 0 2.377-1.125 10.905 10.905 0 0 1-1.864 1.607ZM17.802 15.5H19.25c.217.66.346 1.343.346 2.039 0 .85-.13 1.67-.375 2.44-.158-.74-.402-1.434-.73-2.05a9.44 9.44 0 0 0-1.125-2.377 10.905 10.905 0 0 1 1.607 1.864Zm-7.019 1.864a10.905 10.905 0 0 0 1.607 1.864 9.44 9.44 0 0 1-2.377 1.125c-.616.328-1.31.572-2.05.73A8.003 8.003 0 0 1 4 12c0-.85.13-1.67.375-2.44.158.74.402 1.434.73 2.05a9.44 9.44 0 0 0 1.125 2.377 10.905 10.905 0 0 0 1.864-1.607 10.9 10.9 0 0 1-.835-2.056 9.44 9.44 0 0 0-1.125-2.377 9.43 9.43 0 0 0-1.417 1.645A10.9 10.9 0 0 0 4.75 15.5h1.448c.217.66.346 1.343.346 2.039 0 .17-.007.338-.02.504a10.88 10.88 0 0 1 1.838-1.709 9.43 9.43 0 0 1 2.238.476Z" clipRule="evenodd" />
               </svg>
              <h1 className="text-3xl md:text-4xl font-bold text-primary">NBT Inter Shakha Volleyball Tournament</h1>
           </div>
           <Badge variant={badgeVariant} className={`${badgeVariant === 'destructive' ? 'animate-pulse' : ''} text-lg px-4 py-1 mt-2`}>
                {liveBadgeText}
           </Badge>
         </div>
          {/* Admin Link - Update href */}
          <Link href="/admin-special-access">
            <Button variant="outline" size="icon" className="ml-auto">
              <Wrench className="h-5 w-5" />
              <span className="sr-only">Admin Panel</span>
            </Button>
          </Link>
       </header>

      <main className="flex-grow flex flex-col items-center justify-center">
        <Card className="w-full max-w-4xl shadow-lg mb-6">
          <CardContent className="p-6 md:p-10">
            {isLoading ? ( // Check context loading state
              <div className="flex justify-center items-center h-60">
                <LoaderIcon className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-xl text-muted-foreground">Loading Data...</p>
              </div>
            ) : (
              // Render LiveMatchDisplay using data from context
              <LiveMatchDisplay liveMatch={liveMatch} />
            )}
          </CardContent>
        </Card>

        {/* Buttons Section */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Button
            onClick={handleShowStandingsClick}
            variant="secondary"
            className="shadow-md transition-transform transform hover:scale-105"
            disabled={!standings} // Disable if no standings data in context
          >
            {/* No loading icon needed here as standings modal handles its own state */}
            <BarChartIcon className="mr-2 h-5 w-5" />
            Show Group Standings
          </Button>

          <Button
            onClick={handleTimeoutClick}
            variant="destructive"
            className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md transition-transform transform hover:scale-105"
          >
            <TimerIcon className="mr-2 h-5 w-5" />
            Trigger Team Timeout (30s)
          </Button>
        </div>

      </main>

      {/* Modals */}
      <TimeoutModal
        isOpen={isTimeoutModalOpen}
        onClose={handleTimeoutClose}
      />
      <StandingsModal
        isOpen={isStandingsModalOpen}
        onClose={() => setIsStandingsModalOpen(false)}
        standings={standings} // Pass standings from context
        isLoading={isLoading} // Modal can potentially show loading based on context
        error={null} // No separate error state needed from fetch
      />

      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} NBT Inter Shakha Volleyball Tournament. All rights reserved.</p>
      </footer>
    </div>
  );
}

