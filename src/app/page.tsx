
"use client";

import type { LiveMatchScoreData } from '@/services/google-sheets';
import { getLiveScoreDataFromSheets, getStandingsDataFromSheets, getMockLiveScoreData, getMockStandingsData } from '@/services/google-sheets';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimerIcon, LoaderIcon, UsersIcon, BarChartIcon, TvIcon, AlertCircleIcon } from 'lucide-react';
import TimeoutModal from '@/components/TimeoutModal';
import StandingsModal from '@/components/StandingsModal';
import LiveMatchDisplay from '@/components/LiveMatchDisplay';
import type { GroupStandings } from '@/lib/types';
// calculateStandings is no longer needed as standings are fetched directly
// import { calculateStandings } from '@/lib/standings';
import { Badge } from '@/components/ui/badge';

// Define teams and groups (still needed for context, maybe less critical if standings are pre-calculated)
// const TEAMS = {
//   groupA: ['Kanthapuram', 'Marakkara', 'Vaalal', 'Puthankunnu'],
//   groupB: ['Kizhisseri', 'Kizhakkoth', 'Kakkancheri'],
// };

export default function Home() {
  const [liveMatch, setLiveMatch] = useState<LiveMatchScoreData | null>(null);
  const [standings, setStandings] = useState<GroupStandings | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [isLoadingStandings, setIsLoadingStandings] = useState(true);
  const [errorLive, setErrorLive] = useState<string | null>(null);
  const [errorStandings, setErrorStandings] = useState<string | null>(null);
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);
  const [isStandingsModalOpen, setIsStandingsModalOpen] = useState(false);

  // Combined fetch function
  const fetchData = useCallback(async () => {
    // Reset loading/error states for live score
    setIsLoadingLive(true);
    setErrorLive(null);
    // Reset loading/error states for standings (only if modal isn't open to avoid flicker)
    if (!isStandingsModalOpen) {
      setIsLoadingStandings(true);
      setErrorStandings(null);
    }


    // Fetch Live Score
    try {
      const liveScoreUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_LIVE_SCORE_URL || 'YOUR_LIVE_SCORE_SHEETS_URL_HERE';
      const liveData = await getLiveScoreDataFromSheets(liveScoreUrl);
      setLiveMatch(liveData);
    } catch (err) {
      setErrorLive('Failed to fetch live score data.');
      console.error("Live Score Fetch Error:", err);
      setLiveMatch(getMockLiveScoreData()); // Use mock data on error
    } finally {
       setIsLoadingLive(false);
    }


    // Fetch Standings (can happen concurrently or deferred until modal opens)
    // Fetching standings here to have them ready
    if (!isStandingsModalOpen) { // Avoid refetching if modal is already open and potentially showing data
        try {
            const standingsUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_STANDINGS_URL || 'YOUR_STANDINGS_SHEETS_URL_HERE';
            const standingsData = await getStandingsDataFromSheets(standingsUrl);
            setStandings(standingsData);
        } catch (err) {
            setErrorStandings('Failed to fetch standings data.');
            console.error("Standings Fetch Error:", err);
             setStandings(getMockStandingsData()); // Use mock data on error
        } finally {
            setIsLoadingStandings(false);
        }
    } else {
        // If modal is open, don't change loading state unless you specifically want to indicate a background refresh
        setIsLoadingStandings(false);
    }

  }, [isStandingsModalOpen]); // Depend on isStandingsModalOpen to potentially skip standings fetch


  useEffect(() => {
    fetchData(); // Initial fetch
    const intervalId = setInterval(fetchData, 10000); // Refresh every 10 seconds for live updates
    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [fetchData]); // Rerun effect if fetchData function reference changes

  const handleTimeoutClick = () => {
    setIsTimeoutModalOpen(true);
  };

  const handleShowStandingsClick = () => {
    setIsStandingsModalOpen(true);
    // Optionally trigger a standings fetch here if not done periodically
    // if (!standings && !isLoadingStandings) {
    //   fetchStandingsData(); // You'd need to split fetchData logic
    // }
  };

   const liveBadgeText = liveMatch?.status?.toLowerCase() === 'live' ? `LIVE MATCH: ${liveMatch.team1} vs ${liveMatch.team2}` : (liveMatch ? `MATCH STATUS: ${liveMatch.status || 'Info'}` : null);


  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">CourtSide Chronicle</h1>
         {liveBadgeText && (
              <Badge variant={liveMatch?.status?.toLowerCase() === 'live' ? "destructive" : "secondary"} className={`${liveMatch?.status?.toLowerCase() === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white'} text-lg px-4 py-1`}>
                {liveBadgeText}
              </Badge>
         )}
      </header>

      <main className="flex-grow flex flex-col items-center justify-center">
        <Card className="w-full max-w-4xl shadow-lg mb-6">
          <CardContent className="p-6 md:p-10">
            {isLoadingLive ? (
              <div className="flex justify-center items-center h-60">
                <LoaderIcon className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-xl text-muted-foreground">Loading Live Score...</p>
              </div>
            ) : errorLive ? (
                <div className="flex flex-col items-center justify-center h-60 text-center text-destructive p-4 border border-destructive rounded-md">
                    <AlertCircleIcon className="h-12 w-12 mb-4" />
                    <p className="text-lg font-semibold">{errorLive}</p>
                    <p className="text-sm mt-2">Displaying last known or mock data.</p>
                    {/* Render display with potentially stale/mock data */}
                    <LiveMatchDisplay liveMatch={liveMatch} />
                </div>
            ) : (
              <LiveMatchDisplay liveMatch={liveMatch} /> // Pass the fetched or null live match data
            )}
          </CardContent>
        </Card>

        {/* Buttons Section */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Button
            onClick={handleShowStandingsClick}
            variant="secondary"
            className="shadow-md transition-transform transform hover:scale-105"
            disabled={isLoadingStandings && !standings} // Disable if loading initially
          >
            {isLoadingStandings && !standings ? <LoaderIcon className="mr-2 h-5 w-5 animate-spin" /> : <BarChartIcon className="mr-2 h-5 w-5" />}
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

         {/* Display Standings Error if applicable */}
         {errorStandings && !isStandingsModalOpen && (
             <p className="text-xs text-destructive mt-2 text-center">Error loading standings. Please try opening the standings table.</p>
         )}

      </main>

      {/* Modals */}
      <TimeoutModal
        isOpen={isTimeoutModalOpen}
        onClose={() => setIsTimeoutModalOpen(false)}
      />
      {/* Pass standings data and loading/error state to the modal */}
      <StandingsModal
        isOpen={isStandingsModalOpen}
        onClose={() => setIsStandingsModalOpen(false)}
        standings={standings} // Pass the potentially null standings
        isLoading={isLoadingStandings}
        error={errorStandings}
      />

      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} CourtSide Chronicle. All rights reserved.</p>
         {/* Optional: Display last updated time */}
         {/* <p>Last updated: {new Date().toLocaleTimeString()}</p> */}
      </footer>
    </div>
  );
}
