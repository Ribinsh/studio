
"use client";

import type { LiveMatchScoreData } from '@/services/google-sheets';
import { getLiveScoreDataFromSheets, getStandingsDataFromSheets, getMockLiveScoreData, getMockStandingsData } from '@/services/google-sheets';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimerIcon, LoaderIcon, UsersIcon, BarChartIcon, AlertCircleIcon } from 'lucide-react'; // Removed TvIcon as it's not used
import TimeoutModal from '@/components/TimeoutModal';
import StandingsModal from '@/components/StandingsModal';
import LiveMatchDisplay from '@/components/LiveMatchDisplay';
import type { GroupStandings } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

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
      // Use environment variable or the provided URL. Assuming gid=0 for the live score sheet.
      const liveScoreSheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_LIVE_SCORE_GID || '0';
      const liveScoreBaseUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_LIVE_SCORE_DOC_ID
        ? `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_GOOGLE_SHEETS_LIVE_SCORE_DOC_ID}/export?format=csv&gid=${liveScoreSheetId}`
        : `https://docs.google.com/spreadsheets/d/13q43vurVd8iv0efEXRD7ck88oDDbkTVLHkLAtxQkHUU/export?format=csv&gid=${liveScoreSheetId}`; // Use provided URL as fallback

      console.log("Fetching live score from:", liveScoreBaseUrl); // Log the URL being fetched
      const liveData = await getLiveScoreDataFromSheets(liveScoreBaseUrl);
      setLiveMatch(liveData); // liveData can be null if fetch fails or no live match
       if (!liveData) {
           // Optionally set an error or keep it null to show "No match live"
           // setErrorLive("Could not retrieve live match data.");
           console.log("No live match data returned from fetch.");
       }
    } catch (err: any) {
      setErrorLive(`Failed to fetch live score: ${err.message || 'Unknown error'}`);
      console.error("Live Score Fetch Error:", err);
      setLiveMatch(null); // Set to null on error
    } finally {
       setIsLoadingLive(false);
    }


    // Fetch Standings (can happen concurrently or deferred until modal opens)
    // Fetching standings here to have them ready
    if (!isStandingsModalOpen) { // Avoid refetching if modal is already open and potentially showing data
        try {
            // Use environment variable or a placeholder STANDINGS URL. Ensure this is configured.
            const standingsSheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_STANDINGS_GID || 'YOUR_STANDINGS_GID_HERE'; // Need GID for standings sheet
            const standingsDocId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_STANDINGS_DOC_ID || 'YOUR_STANDINGS_DOC_ID_HERE'; // Need Doc ID for standings
            const standingsUrl = standingsDocId !== 'YOUR_STANDINGS_DOC_ID_HERE'
              ? `https://docs.google.com/spreadsheets/d/${standingsDocId}/export?format=csv&gid=${standingsSheetId}`
              : 'YOUR_STANDINGS_SHEETS_URL_HERE'; // Placeholder if env vars not set


            // console.log("Fetching standings from:", standingsUrl); // Log the URL being fetched
            const standingsData = await getStandingsDataFromSheets(standingsUrl); // This will use mock data if URL is placeholder
            setStandings(standingsData); // standingsData can be null
             if (!standingsData && standingsUrl !== 'YOUR_STANDINGS_SHEETS_URL_HERE') {
                 setErrorStandings("Could not retrieve standings data.");
                 console.log("No standings data returned from fetch.");
             } else if (!standingsData) {
                 console.log("Using mock standings data as URL is not configured.");
                 // Set mock data explicitly if needed, although getStandingsDataFromSheets might already do it
                 setStandings(getMockStandingsData());
             }
        } catch (err: any) {
            setErrorStandings(`Failed to fetch standings: ${err.message || 'Unknown error'}`);
            console.error("Standings Fetch Error:", err);
            setStandings(getMockStandingsData()); // Fallback to mock data on error
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
    const intervalId = setInterval(fetchData, 15000); // Refresh every 15 seconds for live updates
    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [fetchData]); // Rerun effect if fetchData function reference changes

  const handleTimeoutClick = () => {
     setIsTimeoutModalOpen(true);
  };

  const handleShowStandingsClick = () => {
    setIsStandingsModalOpen(true);
    // Optionally trigger a standings fetch here if not done periodically
    // if (!standings && !isLoadingStandings && !errorStandings) {
    //   fetchData(); // Refetch all data, or create a separate fetchStandings function
    // }
  };

  const handleTimeoutClose = useCallback(() => {
    setIsTimeoutModalOpen(false);
  }, []);

   const liveBadgeText = liveMatch?.status?.toLowerCase() === 'live' ? `LIVE MATCH: ${liveMatch.team1} vs ${liveMatch.team2}` : (liveMatch ? `MATCH STATUS: ${liveMatch.status || 'Info'}` : 'No Live Match Data');


  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">CourtSide Chronicle</h1>
         {/* Adjust badge display based on liveMatch presence */}
         <Badge variant={liveMatch?.status?.toLowerCase() === 'live' ? "destructive" : "secondary"} className={`${liveMatch?.status?.toLowerCase() === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white'} text-lg px-4 py-1`}>
             {liveBadgeText}
         </Badge>
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
                // Display error message, but still try to render LiveMatchDisplay which handles null
                <div className="flex flex-col items-center justify-center h-60 text-center text-destructive p-4 border border-destructive rounded-md">
                    <AlertCircleIcon className="h-12 w-12 mb-4" />
                    <p className="text-lg font-semibold">{errorLive}</p>
                     {/* Render display with null data, it will show "No match live" */}
                    <LiveMatchDisplay liveMatch={null} />
                </div>
            ) : (
               // Render LiveMatchDisplay, it handles the case where liveMatch is null internally
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
            disabled={isLoadingStandings && !standings} // Disable if loading initially and no data yet
          >
            {/* Show loader only if loading AND standings are null */}
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

         {/* Display Standings Error if applicable and modal is closed */}
         {errorStandings && !isStandingsModalOpen && (
             <p className="text-xs text-destructive mt-2 text-center">{errorStandings}. Showing mock data.</p>
         )}

      </main>

      {/* Modals */}
      <TimeoutModal
        isOpen={isTimeoutModalOpen}
        onClose={handleTimeoutClose} // Use the memoized close handler
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
