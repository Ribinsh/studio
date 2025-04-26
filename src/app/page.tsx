
"use client";

import type { MatchData } from '@/services/google-sheets';
import { getMatchDataFromSheets } from '@/services/google-sheets';
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimerIcon, TrophyIcon, LoaderIcon, UsersIcon, BarChartIcon } from 'lucide-react';
import TimeoutModal from '@/components/TimeoutModal';
import StandingsModal from '@/components/StandingsModal'; // Import StandingsModal
import LiveMatchDisplay from '@/components/LiveMatchDisplay'; // Import LiveMatchDisplay
import GroupsDisplay from '@/components/GroupsDisplay'; // Keep import for StandingsModal
import type { TeamStanding, GroupStandings } from '@/lib/types';
import { calculateStandings } from '@/lib/standings';
import { Badge } from '@/components/ui/badge'; // Import Badge

// Define teams and groups
const TEAMS = {
  groupA: ['Kanthapuram', 'Marakkara', 'Vaalal', 'Puthankunnu'],
  groupB: ['Kizhisseri', 'Kizhakkoth', 'Kakkancheri'],
};

// Helper function to determine match status (simplified for live check)
const getIsLive = (match: MatchData): boolean => {
    const isFinished = (match.team1SetScore ?? 0) >= 2 || (match.team2SetScore ?? 0) >= 2; // Assuming best of 3 sets
    const hasScores = (match.team1FinalScore ?? 0) > 0 || (match.team2FinalScore ?? 0) > 0 || (match.team1SetScore ?? 0) > 0 || (match.team2SetScore ?? 0) > 0;
    // Consider 'Live' in breakPoints or calculated status
    return (match.breakPoints?.toLowerCase() === 'live') || (hasScores && !isFinished);
};


export default function Home() {
  const [matchData, setMatchData] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);
  const [isStandingsModalOpen, setIsStandingsModalOpen] = useState(false); // State for standings modal

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // TODO: Replace with actual Google Sheets URL from user config
        const googleSheetsUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL || 'YOUR_GOOGLE_SHEETS_URL_HERE';
        if (googleSheetsUrl === 'YOUR_GOOGLE_SHEETS_URL_HERE') {
           console.warn("Using mock data. Please set NEXT_PUBLIC_GOOGLE_SHEETS_URL in your .env file.");
           setMatchData(getMockMatchData());
        } else {
            const data = await getMatchDataFromSheets(googleSheetsUrl);
            setMatchData(data);
        }
      } catch (err) {
        setError('Failed to fetch match data. Please check the Google Sheets URL and permissions. Displaying mock data instead.');
        console.error(err);
        setMatchData(getMockMatchData()); // Use mock data on fetch error
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    // Optional: Add polling to refresh data periodically
     const intervalId = setInterval(fetchData, 15000); // Refresh every 15 seconds for live updates
     return () => clearInterval(intervalId);
  }, []);

  const standings = useMemo(() => calculateStandings(matchData, TEAMS), [matchData]);

  // Find the currently live match
  const liveMatch = useMemo(() => matchData.find(getIsLive), [matchData]);

  const handleTimeoutClick = () => {
    setIsTimeoutModalOpen(true);
  };

  const handleShowStandingsClick = () => {
    setIsStandingsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-primary mb-1">CourtSide Chronicle</h1>
         {liveMatch && (
              <Badge variant="destructive" className="bg-red-500 text-white animate-pulse text-lg px-4 py-1">
                LIVE MATCH: #{liveMatch.matchNo}
              </Badge>
            )}
      </header>

      <main className="flex-grow flex flex-col items-center justify-center">
        <Card className="w-full max-w-4xl shadow-lg mb-6">
           {/* Remove CardHeader with TrophyIcon */}
           <CardContent className="p-6 md:p-10">
             {isLoading ? (
               <div className="flex justify-center items-center h-60">
                 <LoaderIcon className="h-12 w-12 animate-spin text-primary" />
                 <p className="ml-4 text-xl text-muted-foreground">Loading Live Score...</p>
               </div>
             ) : error ? (
               <div className="text-center text-destructive p-4 border border-destructive rounded-md">
                  <p className="text-lg">{error}</p>
                  <p className="text-sm mt-2">Displaying placeholder data.</p>
                   <LiveMatchDisplay liveMatch={getMockMatchData().find(getIsLive)} /> {/* Show mock live match on error */}
               </div>
             ) : (
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
            >
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
        onClose={() => setIsTimeoutModalOpen(false)}
      />
      <StandingsModal
        isOpen={isStandingsModalOpen}
        onClose={() => setIsStandingsModalOpen(false)}
        standings={standings}
        isLoading={isLoading && !error} // Pass loading state only if not errored
      />

      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} CourtSide Chronicle. All rights reserved.</p>
      </footer>
    </div>
  );
}


// Helper function to provide mock data
function getMockMatchData(): MatchData[] {
 return [
    { matchNo: 1, time: '4:30 PM', team1: 'Kanthapuram', team1SetScore: 2, team1FinalScore: 25, team2: 'Marakkara', team2SetScore: 1, team2FinalScore: 23, breakPoints: 'Finished' },
    { matchNo: 2, time: '5:00 PM', team1: 'Vaalal', team1SetScore: 1, team1FinalScore: 18, team2: 'Puthankunnu', team2SetScore: 1, team2FinalScore: 20, breakPoints: 'Live' }, // Ensure one match is live
    { matchNo: 3, time: '5:30 PM', team1: 'Kizhisseri', team1SetScore: 0, team1FinalScore: 0, team2: 'Kizhakkoth', team2SetScore: 0, team2FinalScore: 0, breakPoints: 'Upcoming' },
    { matchNo: 4, time: '6:00 PM', team1: 'Kanthapuram', team1SetScore: 0, team1FinalScore: 0, team2: 'Vaalal', team2SetScore: 0, team2FinalScore: 0, breakPoints: 'Upcoming' },
    // ... add other matches as upcoming or finished
     { matchNo: 5, time: '6:30 PM', team1: 'Marakkara', team1SetScore: 0, team1FinalScore: 0, team2: 'Puthankunnu', team2SetScore: 0, team2FinalScore: 0, breakPoints: 'Upcoming' },
     { matchNo: 6, time: '7:00 PM', team1: 'Kakkancheri', team1SetScore: 0, team1FinalScore: 0, team2: 'Kizhisseri', team2SetScore: 0, team2FinalScore: 0, breakPoints: 'Upcoming' },
     { matchNo: 7, time: '7:30 PM', team1: 'Kanthapuram', team1SetScore: 0, team1FinalScore: 0, team2: 'Puthankunnu', team2SetScore: 0, team2FinalScore: 0, breakPoints: 'Upcoming' },
     { matchNo: 8, time: '8:00 PM', team1: 'Marakkara', team1SetScore: 0, team1FinalScore: 0, team2: 'Vaalal', team2SetScore: 0, team2FinalScore: 0, breakPoints: 'Upcoming' },
     { matchNo: 9, time: '8:30 PM', team1: 'Kakkancheri', team1SetScore: 0, team1FinalScore: 0, team2: 'Kizhakkoth', team2SetScore: 0, team2FinalScore: 0, breakPoints: 'Upcoming' },
  ];
}

