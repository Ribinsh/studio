
"use client";

import type { LiveMatchScoreData } from '@/lib/types'; // Use type from lib
import React, { useState, useCallback, useContext, useEffect } from 'react'; // Added useEffect and useCallback
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderIcon, UsersIcon, BarChartIcon, AlertCircleIcon } from 'lucide-react'; // Removed TimerIcon
import StandingsModal from '@/components/StandingsModal';
import LiveMatchDisplay from '@/components/LiveMatchDisplay';
import type { GroupStandings } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { AppContext } from '@/context/AppContext'; // Import AppContext
// Removed TimeoutModal import
// import TimeoutModal from '@/components/TimeoutModal';

export default function Home() {
  const { liveMatch, standings, isLoading } = useContext(AppContext); // Get state from context

  // Removed Timeout Modal State
  // const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);
  const [isStandingsModalOpen, setIsStandingsModalOpen] = useState(false);

  // Removed Timeout Click Handler
  // const handleTimeoutClick = () => {
  //    setIsTimeoutModalOpen(true);
  // };

  const handleShowStandingsClick = () => {
    setIsStandingsModalOpen(true);
  };

  // Removed Timeout Close Handler
  // const handleTimeoutClose = useCallback(() => {
  //   setIsTimeoutModalOpen(false);
  // }, []);

   // Determine badge text and variant based on loading, error, or live match data from context
   let liveBadgeText = 'Checking Live Status...';
   let badgeVariant: "secondary" | "destructive" | "default" = "secondary"; // Default to secondary

   if (isLoading) { // Use global loading state if needed, or remove if context handles it inherently
       liveBadgeText = 'Loading Data...';
       badgeVariant = "secondary";
   } else if (liveMatch && liveMatch.team1 && liveMatch.team2) { // Check if teams are present
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
       {/* Header updated: Removed Admin Link and Volleyball Icon */}
       <header className="mb-6 text-center px-4">
         <div className="flex flex-col items-center">
           <div className="flex items-center justify-center gap-3">
               {/* Volleyball SVG Icon Removed */}
              <h1 className="text-3xl md:text-4xl font-bold text-primary">NBT Inter Shakha Volleyball Tournament</h1>
           </div>
           {/* Display Badge only if there's a status or live match */}
           {(liveMatch || isLoading) && (
               <Badge variant={badgeVariant} className={`${badgeVariant === 'destructive' ? 'animate-pulse' : ''} text-lg px-4 py-1 mt-2`}>
                    {liveBadgeText}
               </Badge>
           )}
         </div>
       </header>

      <main className="flex-grow flex flex-col items-center justify-center">
        <Card className="w-full max-w-4xl shadow-lg mb-6 overflow-hidden"> {/* Added overflow-hidden */}
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

        {/* Buttons Section - Removed Timeout Button */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Button
            onClick={handleShowStandingsClick}
            variant="secondary"
            className="shadow-md transition-transform transform hover:scale-105"
            disabled={!standings || isLoading} // Disable if no standings data or still loading
          >
            <BarChartIcon className="mr-2 h-5 w-5" />
            Show Group Standings
          </Button>
        </div>

      </main>

      {/* Modals - Removed Timeout Modal */}
      <StandingsModal
        isOpen={isStandingsModalOpen}
        onClose={() => setIsStandingsModalOpen(false)}
        standings={standings} // Pass standings from context
        isLoading={isLoading} // Pass loading state
        error={null} // Pass error state if applicable
      />

      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} NBT Inter Shakha Volleyball Tournament. All rights reserved.</p>
      </footer>
    </div>
  );
}

