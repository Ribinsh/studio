
"use client";

import type { LiveMatchScoreData } from '@/services/google-sheets';
import { getLiveScoreDataFromSheets, getStandingsDataFromSheets, getMockStandingsData } from '@/services/google-sheets';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimerIcon, LoaderIcon, UsersIcon, BarChartIcon, AlertCircleIcon } from 'lucide-react';
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
    console.log("fetchData triggered..."); // Log start of fetch

    // Reset loading/error states for live score
    setIsLoadingLive(true);
    setErrorLive(null);
    // Reset loading/error states for standings (only if modal isn't open to avoid flicker)
    if (!isStandingsModalOpen) {
      setIsLoadingStandings(true);
      setErrorStandings(null);
    }

    // --- Fetch Live Score ---
    try {
      console.log("Attempting to fetch live score..."); // Log the URL being fetched
      // The function now defaults to the correct CSV link internally
      const liveData = await getLiveScoreDataFromSheets();

      if (liveData) {
         console.log("Successfully fetched live data:", liveData);
         setLiveMatch(liveData);
      } else {
         console.log("Fetch returned null or empty data for live score.");
         setLiveMatch(null); // Ensure state is null if no data
         // Optional: Set a specific message instead of generic error if null is expected (e.g., no match running)
         // setErrorLive("No match currently live or data unavailable.");
      }
    } catch (err: any) {
      console.error("Error fetching live score data:", err);
      setErrorLive(`Failed to fetch live score: ${err.message || 'Unknown error'}. Check sheet access or format.`);
      setLiveMatch(null); // Set to null on error
    } finally {
       console.log("Finished live score fetch attempt.");
       setIsLoadingLive(false);
    }


    // --- Fetch Standings ---
    // Fetching standings here to have them ready, unless modal is open
    if (!isStandingsModalOpen) { // Avoid refetching if modal is already open
        setIsLoadingStandings(true); // Ensure loading state is true before fetch
        setErrorStandings(null); // Clear previous errors

        try {
            // Use environment variable or a placeholder STANDINGS URL. Ensure this is configured.
            const standingsSheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_STANDINGS_GID || 'YOUR_STANDINGS_GID_HERE'; // Need GID for standings sheet
            const standingsDocId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_STANDINGS_DOC_ID || 'YOUR_STANDINGS_DOC_ID_HERE'; // Need Doc ID for standings
            const standingsUrl = standingsDocId !== 'YOUR_STANDINGS_DOC_ID_HERE' && standingsSheetId !== 'YOUR_STANDINGS_GID_HERE'
              ? `https://docs.google.com/spreadsheets/d/${standingsDocId}/export?format=csv&gid=${standingsSheetId}`
              : 'YOUR_STANDINGS_SHEETS_URL_HERE'; // Placeholder if env vars not set


             console.log("Attempting to fetch standings from:", standingsUrl); // Log the URL being fetched
             const standingsData = await getStandingsDataFromSheets(standingsUrl); // This uses mock data if URL is placeholder

             if (standingsData) {
                console.log("Successfully fetched standings data (or using mock):", standingsData);
                setStandings(standingsData);
             } else if (standingsUrl === 'YOUR_STANDINGS_SHEETS_URL_HERE') {
                 console.log("Standings URL not configured, using mock data.");
                 setStandings(getMockStandingsData()); // Explicitly set mock data
             } else {
                 console.log("Fetch returned null or empty data for standings.");
                 setErrorStandings("Could not retrieve standings data. Using mock data as fallback.");
                 setStandings(getMockStandingsData()); // Fallback to mock data
             }
        } catch (err: any) {
            console.error("Error fetching standings data:", err);
            setErrorStandings(`Failed to fetch standings: ${err.message || 'Unknown error'}. Using mock data.`);
            setStandings(getMockStandingsData()); // Fallback to mock data on error
        } finally {
            console.log("Finished standings fetch attempt.");
            setIsLoadingStandings(false);
        }
    } else {
        // If modal is open, don't change loading state unless indicating background refresh
        console.log("Standings modal is open, skipping standings fetch.");
        setIsLoadingStandings(false); // Ensure loading is false if skipped
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
    // and if data isn't already loaded or loading.
    if (!standings && !isLoadingStandings && !errorStandings) {
        console.log("Standings button clicked, triggering fetch...");
        // Trigger fetch explicitly if needed (or rely on interval)
        // fetchData(); // Consider if needed or if interval is sufficient
    } else {
        console.log("Standings button clicked, modal opening with existing data/state.");
    }
  };

  const handleTimeoutClose = useCallback(() => {
    setIsTimeoutModalOpen(false);
  }, []);

   // Determine badge text and variant based on loading, error, or live match data
   let liveBadgeText = 'Checking Live Status...';
   let badgeVariant: "secondary" | "destructive" | "default" = "secondary"; // Default to secondary

   if (isLoadingLive) {
       liveBadgeText = 'Loading Live Score...';
       badgeVariant = "secondary";
   } else if (errorLive && !liveMatch) { // Show error only if fetch failed AND we have no stale data
       liveBadgeText = 'Error Loading Live Score';
       badgeVariant = "destructive";
   } else if (liveMatch) {
        // Check status first, default to 'Live' interpretation if status is missing but data is present
        const statusLower = liveMatch.status?.toLowerCase() || 'live';
        if (statusLower === 'live' || statusLower === '') { // Treat empty status as live if data exists
             liveBadgeText = `LIVE MATCH: ${liveMatch.team1} vs ${liveMatch.team2}`;
             badgeVariant = "destructive"; // Use destructive (red) for live
        } else {
             liveBadgeText = `MATCH STATUS: ${liveMatch.status}`;
             badgeVariant = "default"; // Use default (blue) for other statuses like Timeout, Finished Set
        }
   } else {
        // Not loading, no error, but no live match data after fetch
        liveBadgeText = 'No Match Currently Live';
        badgeVariant = "secondary";
   }


  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">CourtSide Chronicle</h1>
         <Badge variant={badgeVariant} className={`${badgeVariant === 'destructive' ? 'animate-pulse' : ''} text-lg px-4 py-1`}>
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
            ) : errorLive && !liveMatch ? ( // Show specific error message ONLY if loading finished, error exists, AND liveMatch is still null
                <div className="flex flex-col items-center justify-center h-60 text-center text-destructive p-4 border border-destructive rounded-md">
                    <AlertCircleIcon className="h-12 w-12 mb-4" />
                    <p className="text-lg font-semibold">{errorLive}</p>
                     {/* Render display with null data, it will show "No match live" */}
                    <LiveMatchDisplay liveMatch={null} />
                </div>
            ) : (
               // Render LiveMatchDisplay. It handles the case where liveMatch is null (show "No match live").
               // If there was an error but we still have OLD liveMatch data, we might show that stale data here until the next successful fetch.
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
             <p className="text-xs text-destructive mt-2 text-center">{errorStandings}</p>
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

