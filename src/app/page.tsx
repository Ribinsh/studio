
"use client";

import type { LiveMatchScoreData } from '@/lib/types'; // Use type from lib
import React, { useState, useCallback, useContext } from 'react';
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
  // Remove states related to fetching: isLoadingLive, isLoadingStandings, errorLive, errorStandings

  const handleTimeoutClick = () => {
     setIsTimeoutModalOpen(true);
  };

  const handleShowStandingsClick = () => {
    setIsStandingsModalOpen(true);
    // No need to fetch here, data comes from context
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
         <div>
           <h1 className="text-4xl font-bold text-primary mb-2">CourtSide Chronicle</h1>
            <Badge variant={badgeVariant} className={`${badgeVariant === 'destructive' ? 'animate-pulse' : ''} text-lg px-4 py-1`}>
                {liveBadgeText}
            </Badge>
         </div>
          {/* Admin Link */}
          <Link href="/admin">
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
        <p>&copy; {new Date().getFullYear()} CourtSide Chronicle. All rights reserved.</p>
      </footer>
    </div>
  );
}
